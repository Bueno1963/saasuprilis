import { supabase } from "@/integrations/supabase/client";

/** Pads/truncates a string to exact fixed width */
function fw(value: string, len: number): string {
  return (value || "").padEnd(len).slice(0, len);
}

/**
 * Generates an I9LIS_CARGA file (.RCB) using fixed-width positional format.
 * Line 11 = patient data, Line 10 = sample + exam codes.
 * Downloads the file to the user's browser.
 */
export async function generateI9LISCargaFile(sample: {
  id: string;
  barcode: string;
  sector: string;
  order_id: string;
  sample_type?: string;
  collected_at?: string;
}): Promise<boolean> {
  if (sample.sector !== "Bioquímica") return false;

  try {
    const { data: order } = await supabase
      .from("orders")
      .select("order_number, exams, priority, patients(name, cpf, birth_date, gender)")
      .eq("id", sample.order_id)
      .single();

    if (!order) return false;

    const patient = order.patients as any;
    const exams: string[] = order.exams || [];

    const { data: examDetails } = await supabase
      .from("exam_catalog")
      .select("code, name, material, sector")
      .in("name", exams)
      .eq("sector", "Bioquímica")
      .eq("status", "active");

    if (!examDetails || examDetails.length === 0) return false;

    // ── Date helpers ──
    const collectedDate = sample.collected_at
      ? new Date(sample.collected_at).toISOString().slice(0, 10).replace(/-/g, "")
      : new Date().toISOString().slice(0, 10).replace(/-/g, "");

    const collectedTime = sample.collected_at
      ? new Date(sample.collected_at).toTimeString().slice(0, 5).replace(":", "")
      : new Date().toTimeString().slice(0, 5).replace(":", "");

    // Birth date DDMMYYYY
    let dtNasc = "";
    if (patient?.birth_date) {
      const bd = new Date(patient.birth_date);
      dtNasc =
        String(bd.getDate()).padStart(2, "0") +
        String(bd.getMonth() + 1).padStart(2, "0") +
        bd.getFullYear();
    }

    // Gender
    const sexo = (patient?.gender || "I").charAt(0).toUpperCase(); // M, F or I

    // ── LINE 11 — Patient data ──
    // Pos 1-2: "11" | 3-14: REG_PAC(12) | 15-64: NOME(50) | 65-71: IDADE(7) | 72-79: DT_NASC(8) | 80: SEXO(1)
    const line11 =
      "11" +
      fw(patient?.cpf || "", 12) +
      fw(patient?.name || "", 50) +
      fw("", 7) + // IDADE (optional)
      fw(dtNasc, 8) +
      fw(sexo, 1);

    // ── LINE 10 — Sample + exams (fixed-width per I9LIS spec) ──
    // Pos  1-2 : Tipo "10"
    // Pos  3-20: Amostra (18)
    // Pos 21   : Ordem (1)
    // Pos 22-28: Diluição (7)
    // Pos 29-40: Agrupamento (12)
    // Pos 41   : (space)
    // Pos 42-45: Hora coleta (4)
    // Pos 46   : Prioridade (1)
    // Pos 47-54: Material (8)
    // Pos 55-60: Instrumento (6)
    // Pos 61-72: Reg. paciente (12)
    // Pos 73-80: Origem (8)
    // Pos 81-88: Data coleta (8, aaaammdd)
    // Pos 89+  : Exames (8 chars each, up to 20)

    const prioridade = order.priority === "urgent" ? "U" : "N";
    const material = examDetails[0]?.material || sample.sample_type || "Soro";
    const examCodes = examDetails.map((e) => fw(e.code, 8)).join("");

    const line10 =
      "10" +
      fw(sample.barcode, 18) +
      fw("1", 1) +
      fw("", 7) + // diluição
      fw(order.order_number, 12) + // agrupamento
      " " + // pos 41 gap
      fw(collectedTime, 4) +
      fw(prioridade, 1) +
      fw(material, 8) +
      fw("", 6) + // instrumento
      fw(patient?.cpf || "", 12) +
      fw("", 8) + // origem
      fw(collectedDate, 8) +
      examCodes;

    // File: line 11 first (patient), then line 10 (sample/exams)
    const fileContent = [line11, line10].join("\r\n");

    // Download
    const blob = new Blob([fileContent], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `I9LIS_CARGA_${sample.barcode}.RCB`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    // Log sync
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
        message: `Arquivo I9LIS_CARGA gerado: ${sample.barcode} — ${examDetails.length} exame(s) — Paciente: ${patient?.name || "—"}`,
        records_created: examDetails.length,
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
