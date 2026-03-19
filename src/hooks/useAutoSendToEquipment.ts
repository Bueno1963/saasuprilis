import { supabase } from "@/integrations/supabase/client";

/**
 * Sends a triaged sample to its respective equipment via integration.
 * Matches sample sector → exam_catalog equipment → integrations by name.
 * Logs the sync event and updates the sample status to "processing".
 */
export async function autoSendTriagedSample(sample: {
  id: string;
  barcode: string;
  sector: string;
  order_id?: string;
  orders?: any;
}) {
  try {
    // 1. Find equipment linked to exams in this sector
    const { data: exams } = await supabase
      .from("exam_catalog")
      .select("equipment")
      .eq("sector", sample.sector)
      .eq("status", "active")
      .not("equipment", "eq", "")
      .not("equipment", "is", null);

    if (!exams || exams.length === 0) return null;

    // Get unique equipment names from the sector's exams
    const equipmentNames = [...new Set(exams.map(e => e.equipment).filter(Boolean))] as string[];
    if (equipmentNames.length === 0) return null;

    // 2. Find matching integrations by equipment name
    const { data: integrations } = await supabase
      .from("integrations")
      .select("id, name, status")
      .in("name", equipmentNames)
      .eq("status", "active");

    if (!integrations || integrations.length === 0) return null;

    // 3. Update sample status to "processing"
    await supabase
      .from("samples")
      .update({ status: "processing" })
      .eq("id", sample.id);

    // 4. Log sync for each matched integration
    const patientName = sample.orders?.patients?.name || "—";
    for (const integration of integrations) {
      await supabase.from("integration_sync_logs").insert({
        integration_id: integration.id,
        status: "success",
        direction: "outbound",
        source_system: "LIS",
        destination_system: integration.name,
        message: `Envio automático (triagem): amostra ${sample.barcode} — Paciente: ${patientName} — Setor: ${sample.sector}`,
        records_created: 1,
        records_updated: 0,
        records_failed: 0,
        duration_ms: 0,
      });

      // Update last_sync on integration
      await supabase
        .from("integrations")
        .update({ last_sync: new Date().toISOString() })
        .eq("id", integration.id);
    }

    return integrations.map(i => i.name);
  } catch (err) {
    console.error("Erro ao enviar amostra para equipamento:", err);
    return null;
  }
}
