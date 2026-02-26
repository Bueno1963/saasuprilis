import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { transactions, accounts } = await req.json();

    if (!transactions?.length || !accounts?.length) {
      return new Response(JSON.stringify({ error: "Transactions and accounts are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY is not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build accounts list for the prompt
    const accountsList = accounts.map((a: any) => `${a.code} - ${a.name} (tipo: ${a.type}) [id: ${a.id}]`).join("\n");

    const transactionsList = transactions.map((t: any, i: number) =>
      `[${i}] ${t.date} | ${t.description} | R$ ${t.amount.toFixed(2)} | ${t.type === "credit" ? "CRÉDITO" : "DÉBITO"}`
    ).join("\n");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: `Você é um contador especialista em classificação contábil para laboratórios de análises clínicas (prestador de serviços).

Sua tarefa é classificar transações bancárias nas contas contábeis corretas usando partida dobrada.

PLANO DE CONTAS DISPONÍVEL:
${accountsList}

REGRAS DE CLASSIFICAÇÃO:
- Para DÉBITOS (saídas de dinheiro):
  - Conta DÉBITO = a conta de despesa/custo correspondente (ex: aluguel, salários, insumos)
  - Conta CRÉDITO = geralmente uma conta de banco/caixa ou a conta que originou o pagamento
- Para CRÉDITOS (entradas de dinheiro):
  - Conta DÉBITO = conta de banco/caixa (recebimento)
  - Conta CRÉDITO = conta de receita correspondente (ex: exames particulares, convênio)
- Palavras-chave comuns:
  - PIX, TED, transferência → movimentação bancária
  - Aluguel, locação → conta de aluguel
  - Salário, folha, FGTS, INSS → despesa com pessoal
  - Reagente, kit, material → insumos/reagentes
  - Energia, luz, CEMIG, CPFL → energia elétrica
  - Água, SABESP → água e esgoto
  - Internet, telefone → telefone e internet
  - Manutenção, reparo → manutenção equipamentos
  - ISS, PIS, COFINS → impostos
  - Tarifa bancária → tarifas bancárias
  - Juros → juros pagos ou recebidos

Responda APENAS com um JSON array. Cada elemento deve ter:
{
  "index": número_da_transação,
  "debit_account_id": "id_da_conta_debito",
  "credit_account_id": "id_da_conta_credito",
  "confidence": "high" | "medium" | "low"
}

Se não conseguir classificar, use confidence "low" e escolha a conta mais provável.`,
          },
          {
            role: "user",
            content: `Classifique estas transações:\n\n${transactionsList}`,
          },
        ],
        temperature: 0.1,
        max_tokens: 4000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI Gateway error:", response.status, errorText);

      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns instantes." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos insuficientes. Adicione créditos ao workspace." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ error: "Falha na classificação", details: errorText }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiResult = await response.json();
    const content = aiResult.choices?.[0]?.message?.content || "[]";

    let jsonStr = content;
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1].trim();
    }

    let classifications;
    try {
      classifications = JSON.parse(jsonStr);
    } catch {
      console.error("Failed to parse AI classification response:", content);
      classifications = [];
    }

    return new Response(JSON.stringify({ classifications }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
