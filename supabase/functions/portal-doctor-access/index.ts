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
    const { crm, doctor_name } = await req.json();

    if (!crm || !doctor_name) {
      return new Response(
        JSON.stringify({ error: "CRM e nome do médico são obrigatórios" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Find orders by doctor name (case-insensitive partial match)
    const normalizedName = doctor_name.trim().toLowerCase();
    
    const { data: orders, error: ordersError } = await supabase
      .from("orders")
      .select("id, order_number, doctor_name, exams, status, created_at, patient_id, patients!inner(id, name, birth_date)")
      .ilike("doctor_name", `%${normalizedName}%`)
      .order("created_at", { ascending: false })
      .limit(50);

    if (ordersError || !orders || orders.length === 0) {
      return new Response(
        JSON.stringify({ error: "Nenhum pedido encontrado para este médico." }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get released results for these orders
    const orderIds = orders.map((o: any) => o.id);
    const { data: results } = await supabase
      .from("results")
      .select("id, exam, value, unit, reference_range, flag, status, released_at, order_id")
      .in("order_id", orderIds)
      .eq("status", "released");

    // Group results by order
    const resultsByOrder: Record<string, any[]> = {};
    (results || []).forEach((r: any) => {
      if (!resultsByOrder[r.order_id]) resultsByOrder[r.order_id] = [];
      resultsByOrder[r.order_id].push(r);
    });

    // Build response - only include orders with released results
    const ordersWithResults = orders
      .filter((o: any) => resultsByOrder[o.id]?.length > 0)
      .map((o: any) => ({
        order_number: o.order_number,
        created_at: o.created_at,
        patient_name: (o as any).patients?.name || "—",
        results: resultsByOrder[o.id] || [],
      }));

    if (ordersWithResults.length === 0) {
      return new Response(
        JSON.stringify({ error: "Nenhum resultado liberado encontrado para seus pacientes." }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get lab settings
    const { data: labSettings } = await supabase
      .from("lab_settings")
      .select("name, phone, address, city, state, technical_responsible, crm_responsible")
      .limit(1)
      .single();

    // Log access
    const userAgent = req.headers.get("user-agent") || "";
    const accessIp = req.headers.get("x-forwarded-for") || req.headers.get("cf-connecting-ip") || "unknown";

    await supabase.from("portal_access_logs").insert({
      portal_type: "medico",
      doctor_name: doctor_name,
      access_ip: accessIp,
      user_agent: userAgent,
      access_method: "crm",
      data_returned: { orders_count: ordersWithResults.length, crm },
    });

    return new Response(
      JSON.stringify({
        doctor_name: orders[0].doctor_name,
        crm,
        orders: ordersWithResults,
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
