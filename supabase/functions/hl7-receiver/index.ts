import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-middleware-key",
};

interface HL7Result {
  barcode: string;
  patient_id?: string;
  patient_name?: string;
  patient_dob?: string;
  patient_sex?: string;
  is_qc: boolean;
  results: {
    analyte_code: string;
    analyte_name: string;
    value: string;
    unit: string;
    reference_range: string;
    flag: string;
  }[];
  equipment_name: string;
  message_datetime: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const middlewareKey = req.headers.get("x-middleware-key");
    const expectedKey = Deno.env.get("HL7_MIDDLEWARE_KEY");
    if (!expectedKey) {
      console.error("HL7_MIDDLEWARE_KEY not configured");
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

    const payload: HL7Result = await req.json();

    if (!payload.barcode || !payload.results?.length) {
      return new Response(
        JSON.stringify({ error: "barcode and results are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 1. Find the integration for this equipment
    const { data: integration } = await supabase
      .from("integrations")
      .select("id, name")
      .ilike("name", `%${payload.equipment_name}%`)
      .eq("status", "active")
      .maybeSingle();

    // 2. Find the sample by barcode
    const { data: sample } = await supabase
      .from("samples")
      .select("id, order_id, sector")
      .eq("barcode", payload.barcode)
      .maybeSingle();

    if (!sample) {
      // Log the event even if sample not found
      if (integration) {
        await supabase.from("integration_sync_logs").insert({
          integration_id: integration.id,
          status: "error",
          direction: "inbound",
          source_system: payload.equipment_name,
          destination_system: "LIS",
          message: `Amostra não encontrada: ${payload.barcode}`,
          error_message: `Barcode ${payload.barcode} não existe no sistema`,
          records_created: 0,
          records_updated: 0,
          records_failed: payload.results.length,
        });
      }
      return new Response(
        JSON.stringify({ error: "Sample not found", barcode: payload.barcode }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 3. If QC data, just log and return
    if (payload.is_qc) {
      // Insert QC data points
      for (const r of payload.results) {
        const value = parseFloat(r.value);
        if (!isNaN(value)) {
          await supabase.from("qc_data").insert({
            analyte: r.analyte_name,
            equipment: payload.equipment_name,
            level: "N1",
            value,
            mean: 0,
            sd: 0,
            status: r.flag === "N" ? "approved" : "review",
          });
        }
      }

      if (integration) {
        await supabase.from("integration_sync_logs").insert({
          integration_id: integration.id,
          status: "success",
          direction: "inbound",
          source_system: payload.equipment_name,
          destination_system: "LIS",
          message: `QC recebido: ${payload.results.length} analitos — ${payload.barcode}`,
          records_created: payload.results.length,
          records_updated: 0,
          records_failed: 0,
        });
      }

      return new Response(
        JSON.stringify({ success: true, type: "qc", count: payload.results.length }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 4. Insert/update results for this sample
    let created = 0;
    let failed = 0;
    for (const r of payload.results) {
      const flagMap: Record<string, string> = {
        N: "normal",
        H: "high",
        L: "low",
        A: "abnormal",
      };
      const { error } = await supabase.from("results").insert({
        order_id: sample.order_id,
        sample_id: sample.id,
        exam: r.analyte_name,
        value: r.value,
        unit: r.unit,
        reference_range: r.reference_range,
        flag: flagMap[r.flag] || "normal",
        status: "pending",
      });
      if (error) {
        console.error("Insert result error:", error);
        failed++;
      } else {
        created++;
      }
    }

    // 5. Update sample status to "analyzed"
    await supabase
      .from("samples")
      .update({ status: "analyzed" })
      .eq("id", sample.id);

    // 6. Log sync
    if (integration) {
      await supabase.from("integration_sync_logs").insert({
        integration_id: integration.id,
        status: failed > 0 ? "partial" : "success",
        direction: "inbound",
        source_system: payload.equipment_name,
        destination_system: "LIS",
        message: `Resultados recebidos: amostra ${payload.barcode} — ${created} analitos inseridos`,
        records_created: created,
        records_updated: 0,
        records_failed: failed,
      });

      await supabase
        .from("integrations")
        .update({ last_sync: new Date().toISOString() })
        .eq("id", integration.id);
    }

    return new Response(
      JSON.stringify({ success: true, type: "results", created, failed }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("HL7 receiver error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error", details: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
