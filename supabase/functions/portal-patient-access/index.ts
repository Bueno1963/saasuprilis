import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { order_number, birth_date } = await req.json();

    if (!order_number || !birth_date) {
      return new Response(
        JSON.stringify({ error: "Número do pedido e data de nascimento são obrigatórios" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Find order and validate patient birth date
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("id, order_number, doctor_name, exams, status, created_at, patient_id, patients!inner(id, name, birth_date, cpf)")
      .eq("order_number", order_number.trim().toUpperCase())
      .single();

    if (orderError || !order) {
      return new Response(
        JSON.stringify({ error: "Pedido não encontrado. Verifique o número informado." }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const patient = (order as any).patients;
    if (patient.birth_date !== birth_date) {
      return new Response(
        JSON.stringify({ error: "Data de nascimento não confere com o cadastro do paciente." }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get released results only
    const { data: results } = await supabase
      .from("results")
      .select("id, exam, value, unit, reference_range, flag, status, released_at")
      .eq("order_id", order.id)
      .eq("status", "released");

    if (!results || results.length === 0) {
      return new Response(
        JSON.stringify({ error: "Nenhum resultado liberado encontrado para este pedido." }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get lab settings for header
    const { data: labSettings } = await supabase
      .from("lab_settings")
      .select("name, phone, address, city, state, technical_responsible, crm_responsible")
      .limit(1)
      .single();

    // Log access for LGPD compliance
    const userAgent = req.headers.get("user-agent") || "";
    const accessIp = req.headers.get("x-forwarded-for") || req.headers.get("cf-connecting-ip") || "unknown";

    await supabase.from("portal_access_logs").insert({
      portal_type: "paciente",
      order_id: order.id,
      patient_id: patient.id,
      access_ip: accessIp,
      user_agent: userAgent,
      access_method: "codigo",
      data_returned: { results_count: results.length, exams: results.map((r: any) => r.exam) },
    });

    // Mask CPF for display
    const maskedCpf = patient.cpf
      ? patient.cpf.replace(/(\d{3})\d{3}\d{3}(\d{2})/, "$1.***.***-$2")
      : "";

    return new Response(
      JSON.stringify({
        patient: {
          name: patient.name,
          cpf_masked: maskedCpf,
        },
        order: {
          order_number: order.order_number,
          doctor_name: order.doctor_name,
          created_at: order.created_at,
        },
        results,
        lab: labSettings,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: "Erro interno do servidor" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
