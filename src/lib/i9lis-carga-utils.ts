import { supabase } from "@/integrations/supabase/client";

const STORAGE_KEY = "i9lis_config";

/** Pads/truncates a string to exact fixed width */
function fw(value: string, len: number): string {
  return (value || "").padEnd(len).slice(0, len);
}

/**
 * Generates an I9LIS_CARGA file (.RCB) for a Bioquímica sample
 * moving to "processing" (Em Análise) status.
 * Downloads the file to the user's browser using the configured carga path as reference.
 */
export async function generateI9LISCargaFile(sample: {
  id: string;
  barcode: string;
  sector: string;
  order_id: string;
  sample_type?: string;
  collected_at?: string;
}): Promise<boolean> {
  // Only for Bioquímica sector
  if (sample.sector !== "Bioquímica") return false;

  try {
    // Fetch order + patient info
    const { data: order } = await supabase
      .from("orders")
      .select("order_number, exams, patients(name, cpf)")
      .eq("id", sample.order_id)
      .single();

    if (!order) return false;

    const patient = order.patients as any;
    const exams: string[] = order.exams || [];

    // Fetch exam details from catalog
    const { data: examDetails } = await supabase
      .from("exam_catalog")
      .select("code, name, material, sector")
      .in("name", exams)
      .eq("sector", "Bioquímica")
      .eq("status", "active");

    if (!examDetails || examDetails.length === 0) return false;

    const collectedDate = sample.collected_at
      ? new Date(sample.collected_at).toISOString().slice(0, 10).replace(/-/g, "")
      : new Date().toISOString().slice(0, 10).replace(/-/g, "");

    // Build records
    const records: I9LISCargaRecord[] = examDetails.map((exam) => ({
      AMOSTRA: sample.barcode,
      ORDEM: order.order_number,
      REG_PAC: patient?.cpf || "",
      NOME: patient?.name || "",
      COD_EXAME: exam.code,
      NOME_EXAME: exam.name,
      MATERIAL: exam.material || sample.sample_type || "Soro",
      SETOR: "Bioquímica",
      DATA_COLETA: collectedDate,
    }));

    // Generate file content — pipe-delimited, one line per exam
    const header = "AMOSTRA|ORDEM|REG_PAC|NOME|COD_EXAME|NOME_EXAME|MATERIAL|SETOR|DATA_COLETA";
    const lines = records.map(
      (r) =>
        `${r.AMOSTRA}|${r.ORDEM}|${r.REG_PAC}|${r.NOME}|${r.COD_EXAME}|${r.NOME_EXAME}|${r.MATERIAL}|${r.SETOR}|${r.DATA_COLETA}`
    );
    const fileContent = [header, ...lines].join("\r\n");

    // Download the file to the browser
    const blob = new Blob([fileContent], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `I9LIS_CARGA_${sample.barcode}.RCB`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    // Log the sync event if an integration exists
    const { data: integrations } = await supabase
      .from("integrations")
      .select("id, name")
      .eq("status", "active")
      .ilike("name", "%i9lis%")
      .limit(1);

    if (integrations && integrations.length > 0) {
      await supabase.from("integration_sync_logs").insert({
        integration_id: integrations[0].id,
        status: "success",
        direction: "outbound",
        source_system: "LIS",
        destination_system: "I9LIS",
        message: `Arquivo I9LIS_CARGA gerado automaticamente: ${sample.barcode} — ${exams.length} exame(s) — Paciente: ${patient?.name || "—"}`,
        records_created: records.length,
        records_updated: 0,
        records_failed: 0,
        duration_ms: 0,
      });
    }

    return true;
  } catch (err) {
    console.error("Erro ao gerar arquivo I9LIS_CARGA:", err);
    return false;
  }
}
