import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-middleware-key",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authenticate via x-middleware-key
    const middlewareKey = req.headers.get("x-middleware-key");
    const expectedKey = Deno.env.get("HL7_MIDDLEWARE_KEY");
    if (!expectedKey) {
      return new Response(JSON.stringify({ error: "Server misconfigured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (middlewareKey !== expectedKey) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const url = new URL(req.url);
    const action = url.searchParams.get("action");

    // ─── ACTION: exam-catalog ──────────────────────────────────────
    // Returns all active exams with their codes, names, sectors, materials and parameters
    if (action === "exam-catalog") {
      const { data: exams, error } = await supabase
        .from("exam_catalog")
        .select("code, name, sector, material, method, unit, reference_range, equipment, section_group")
        .eq("status", "active")
        .order("name");
      if (error) throw error;

      // Also fetch parameters for each exam
      const { data: params, error: pErr } = await supabase
        .from("exam_parameters")
        .select("exam_id, name, lis_code, lis_name, equip_code, equip_analyte, unit, reference_range, section, sort_order")
        .order("sort_order");
      if (pErr) throw pErr;

      // Get exam IDs for mapping
      const { data: examIds, error: idErr } = await supabase
        .from("exam_catalog")
        .select("id, code")
        .eq("status", "active");
      if (idErr) throw idErr;

      const codeToId = Object.fromEntries((examIds || []).map((e: any) => [e.id, e.code]));
      const paramsByExamCode: Record<string, any[]> = {};
      for (const p of params || []) {
        const examCode = codeToId[p.exam_id];
        if (examCode) {
          if (!paramsByExamCode[examCode]) paramsByExamCode[examCode] = [];
          paramsByExamCode[examCode].push({
            name: p.name,
            lis_code: p.lis_code,
            lis_name: p.lis_name,
            equip_code: p.equip_code,
            equip_analyte: p.equip_analyte,
            unit: p.unit,
            reference_range: p.reference_range,
            section: p.section,
            sort_order: p.sort_order,
          });
        }
      }

      const result = (exams || []).map((e: any) => ({
        ...e,
        parameters: paramsByExamCode[e.code] || [],
      }));

      return new Response(JSON.stringify({ exams: result }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ─── ACTION: sample-worklist ───────────────────────────────────
    // Returns samples pending processing (status = collected or triagem)
    if (action === "sample-worklist") {
      const statusFilter = url.searchParams.get("status") || "triagem";
      const sectorFilter = url.searchParams.get("sector");

      let query = supabase
        .from("samples")
        .select("id, barcode, sample_type, sector, status, collected_at, order_id")
        .in("status", statusFilter.split(","))
        .order("collected_at", { ascending: false })
        .limit(200);

      if (sectorFilter) {
        query = query.eq("sector", sectorFilter);
      }

      const { data: samples, error } = await query;
      if (error) throw error;

      // Enrich with order + patient data
      const orderIds = [...new Set((samples || []).map((s: any) => s.order_id))];
      const { data: orders } = await supabase
        .from("orders")
        .select("id, order_number, patient_id, exams, doctor_name")
        .in("id", orderIds);

      const patientIds = [...new Set((orders || []).map((o: any) => o.patient_id))];
      const { data: patients } = await supabase
        .from("patients")
        .select("id, name, cpf, birth_date, gender")
        .in("id", patientIds);

      const patientMap = Object.fromEntries((patients || []).map((p: any) => [p.id, p]));
      const orderMap = Object.fromEntries((orders || []).map((o: any) => [o.id, {
        order_number: o.order_number,
        exams: o.exams,
        doctor_name: o.doctor_name,
        patient: patientMap[o.patient_id] || null,
      }]));

      const result = (samples || []).map((s: any) => ({
        barcode: s.barcode,
        sample_type: s.sample_type,
        sector: s.sector,
        status: s.status,
        collected_at: s.collected_at,
        order: orderMap[s.order_id] || null,
      }));

      return new Response(JSON.stringify({ samples: result }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ─── ACTION: patient-lookup ────────────────────────────────────
    // Search patient by CPF or name
    if (action === "patient-lookup") {
      const cpf = url.searchParams.get("cpf");
      const name = url.searchParams.get("name");

      if (!cpf && !name) {
        return new Response(JSON.stringify({ error: "Provide cpf or name parameter" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      let query = supabase
        .from("patients")
        .select("id, name, cpf, birth_date, gender, phone, email")
        .limit(20);

      if (cpf) {
        query = query.eq("cpf", cpf);
      } else if (name) {
        query = query.ilike("name", `%${name}%`);
      }

      const { data, error } = await query;
      if (error) throw error;

      return new Response(JSON.stringify({ patients: data || [] }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ─── ACTION: sample-by-barcode ─────────────────────────────────
    // Lookup a single sample and its order/patient/exams by barcode
    if (action === "sample-by-barcode") {
      const barcode = url.searchParams.get("barcode");
      if (!barcode) {
        return new Response(JSON.stringify({ error: "barcode parameter required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: sample, error } = await supabase
        .from("samples")
        .select("id, barcode, sample_type, sector, status, collected_at, order_id")
        .eq("barcode", barcode)
        .maybeSingle();
      if (error) throw error;
      if (!sample) {
        return new Response(JSON.stringify({ error: "Sample not found" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: order } = await supabase
        .from("orders")
        .select("id, order_number, patient_id, exams, doctor_name")
        .eq("id", sample.order_id)
        .maybeSingle();

      let patient = null;
      if (order?.patient_id) {
        const { data: p } = await supabase
          .from("patients")
          .select("id, name, cpf, birth_date, gender")
          .eq("id", order.patient_id)
          .maybeSingle();
        patient = p;
      }

      return new Response(JSON.stringify({
        barcode: sample.barcode,
        sample_type: sample.sample_type,
        sector: sample.sector,
        status: sample.status,
        collected_at: sample.collected_at,
        order: order ? {
          order_number: order.order_number,
          exams: order.exams,
          doctor_name: order.doctor_name,
        } : null,
        patient,
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({
        error: "Unknown action",
        available_actions: ["exam-catalog", "sample-worklist", "patient-lookup", "sample-by-barcode"],
      }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("LIS query error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error", details: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
