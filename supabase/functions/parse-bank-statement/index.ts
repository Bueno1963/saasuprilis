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
    const { pdfBase64 } = await req.json();

    if (!pdfBase64) {
      return new Response(JSON.stringify({ error: "PDF data is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "API key not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

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
            content: `You are a Brazilian bank statement parser specialized in extracting transactions from PDF bank statements.

You MUST extract ALL transactions from the statement, across ALL pages.

SUPPORTED BANK FORMATS:
1. **Itaú** - Table columns: Data | Histórico de Lançamentos | Orig | Valor (R$) | Saldo (R$)
   - Dates are DD/MM (year comes from the statement header, e.g. "OUTUBRO/2023")
   - Amounts use Brazilian format: dots for thousands, commas for decimals (e.g. "3.920,00" = 3920.00)
   - "SISPAG SALARIOS" = salary payments (debit)
   - "SISPAG FORNECEDORES" = supplier payments (debit)
   - "SISPAG AOSE..." = company transfers (debit)
   - "PIX TRANSF..." = PIX transfers (check context - usually debit if paired with payments)
   - "SISPAG PAG TIT BANCO" = bill payments (debit)
   - "ITAU SEG VIDA" = insurance (debit)
   - "DA REC FED DARF" = federal tax payment (debit)
   - "EST REC FED DARF" = tax payment reversal/credit (credit)
   - "EST SISPAG FORNECEDORES" = supplier payment reversal (credit)
   - "01-FIN COMPRA" = financing/loan receipt (credit)
   - Rows with only "SALDO INICIAL", "SALDO ANTERIOR", "SALDO PARCIAL", "SALDO FINAL" are NOT transactions - SKIP them
   - If a row has a value in "Valor (R$)" column, it's a transaction
   - If a row only has a value in "Saldo (R$)" column with no "Valor", it's a balance row - SKIP it

2. **Bradesco** - Similar table format with Data | Histórico | Documento | Valor | Saldo
3. **Banco do Brasil** - Data | Histórico | Valor | Saldo
4. **Santander** - Data | Descrição | Valor | Saldo
5. **Caixa** - Data | Histórico | Valor | Saldo

CRITICAL RULES:
- Convert DD/MM dates to YYYY-MM-DD using the year from the statement header
- Convert Brazilian number format to standard: "3.920,00" → 3920.00, "529,48" → 529.48
- ALL amounts must be positive numbers
- Determine type based on context: payments out = "debit", money in = "credit"
- For Itaú: if a row has "EST " prefix (estorno), it's typically a credit/reversal
- SKIP balance-only rows (SALDO INICIAL, SALDO ANTERIOR, SALDO PARCIAL, SALDO FINAL)
- Include the "Orig" (origin agency) in the description when available

Return ONLY a valid JSON array:
[
  {
    "date": "YYYY-MM-DD",
    "description": "transaction description",
    "amount": 123.45,
    "type": "credit" or "debit"
  }
]

If you cannot parse any transactions, return an empty array [].
Return ONLY the JSON array, no markdown, no explanation.`,
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Extract ALL transactions from this bank statement. Make sure to get every single transaction from all pages:",
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:application/pdf;base64,${pdfBase64}`,
                },
              },
            ],
          },
        ],
        temperature: 0.1,
        max_tokens: 16000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI Gateway error:", errorText);
      return new Response(JSON.stringify({ error: "Failed to parse PDF", details: errorText }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiResult = await response.json();
    const content = aiResult.choices?.[0]?.message?.content || "[]";

    // Extract JSON from response (handle markdown code blocks)
    let jsonStr = content;
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1].trim();
    }

    let transactions;
    try {
      transactions = JSON.parse(jsonStr);
    } catch {
      console.error("Failed to parse AI response as JSON:", content);
      transactions = [];
    }

    // Post-process: validate and clean transactions
    transactions = transactions
      .filter((t: any) => t.date && t.description && typeof t.amount === "number" && t.amount > 0)
      .map((t: any) => ({
        date: t.date,
        description: t.description.trim(),
        amount: Math.round(t.amount * 100) / 100,
        type: t.type === "credit" ? "credit" : "debit",
      }));

    console.log(`Parsed ${transactions.length} transactions from PDF`);

    return new Response(JSON.stringify({ transactions }), {
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
