import jsPDF from "jspdf";

interface PopData {
  code: string;
  title: string;
  category: string;
  sector?: string;
  version: string;
  status: string;
  objective?: string;
  scope?: string;
  responsibilities?: string;
  materials?: string;
  procedure_steps?: string;
  safety_notes?: string;
  references_docs?: string;
  revision_history?: string;
  effective_date?: string;
  next_review_date?: string;
  created_at?: string;
}

const CATEGORY_LABELS: Record<string, string> = {
  pre_analitica: "Fase Pré-Analítica",
  analitica: "Fase Analítica",
  pos_analitica: "Fase Pós-Analítica",
  biosseguranca: "Biossegurança",
  gestao_qualidade: "Gestão da Qualidade",
  equipamentos: "Equipamentos",
  recursos_humanos: "Recursos Humanos",
  infraestrutura: "Infraestrutura",
};

const STATUS_LABELS: Record<string, string> = {
  vigente: "Vigente",
  rascunho: "Rascunho",
  em_revisao: "Em Revisão",
  obsoleto: "Obsoleto",
};

export function generatePopPdf(pop: PopData, labName?: string) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const marginL = 20;
  const marginR = 20;
  const contentW = pageW - marginL - marginR;
  let y = 20;

  const addFooter = (pageNum: number) => {
    doc.setFontSize(7);
    doc.setTextColor(130);
    doc.setFont("helvetica", "normal");
    doc.text("Documento elaborado conforme RDC 978/2025 — ANVISA", marginL, pageH - 12);
    doc.text(`${pop.code} • v${pop.version}`, marginL, pageH - 8);
    doc.text(`Página ${pageNum}`, pageW - marginR, pageH - 8, { align: "right" });
    const printDate = new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
    doc.text(`Impresso em: ${printDate}`, pageW / 2, pageH - 8, { align: "center" });
  };

  const checkNewPage = (needed: number) => {
    if (y + needed > pageH - 25) {
      addFooter(doc.getNumberOfPages());
      doc.addPage();
      y = 20;
    }
  };

  const addSection = (num: string, title: string, content?: string) => {
    if (!content) return;
    checkNewPage(20);

    // Section title
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 80, 140);
    doc.text(`${num}. ${title}`, marginL, y);
    y += 2;

    // Underline
    doc.setDrawColor(30, 80, 140);
    doc.setLineWidth(0.3);
    doc.line(marginL, y, marginL + contentW, y);
    y += 5;

    // Content
    doc.setFontSize(9.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(50);
    const lines = doc.splitTextToSize(content, contentW);
    for (const line of lines) {
      checkNewPage(5);
      doc.text(line, marginL, y);
      y += 4.5;
    }
    y += 4;
  };

  // ===== HEADER =====
  // Top border
  doc.setFillColor(30, 80, 140);
  doc.rect(0, 0, pageW, 3, "F");

  // Header box
  doc.setFillColor(240, 245, 250);
  doc.rect(marginL - 2, 8, contentW + 4, 36, "F");
  doc.setDrawColor(30, 80, 140);
  doc.setLineWidth(0.5);
  doc.rect(marginL - 2, 8, contentW + 4, 36, "S");

  // Lab name
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(30, 80, 140);
  doc.text(labName || "LABORATÓRIO DE ANÁLISES CLÍNICAS", marginL + 3, 16);

  // Document type
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(30, 50, 80);
  doc.text("PROCEDIMENTO OPERACIONAL PADRÃO", marginL + 3, 24);

  // POP title
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(50);
  const titleLines = doc.splitTextToSize(pop.title, contentW - 50);
  doc.text(titleLines, marginL + 3, 31);

  // Code and version badge (top right)
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(30, 80, 140);
  doc.text(pop.code, pageW - marginR - 3, 16, { align: "right" });
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text(`Versão ${pop.version}`, pageW - marginR - 3, 21, { align: "right" });

  // Status badge
  const statusLabel = STATUS_LABELS[pop.status] || pop.status;
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  if (pop.status === "vigente") {
    doc.setTextColor(0, 120, 60);
  } else if (pop.status === "em_revisao") {
    doc.setTextColor(180, 130, 0);
  } else {
    doc.setTextColor(130);
  }
  doc.text(`Status: ${statusLabel}`, pageW - marginR - 3, 26, { align: "right" });

  y = 50;

  // ===== INFO TABLE =====
  doc.setFillColor(245, 248, 252);
  doc.rect(marginL, y, contentW, 18, "F");
  doc.setDrawColor(200);
  doc.setLineWidth(0.2);
  doc.rect(marginL, y, contentW, 18, "S");

  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(80);

  const col1 = marginL + 3;
  const col2 = marginL + contentW / 2 + 3;

  doc.text("Categoria:", col1, y + 6);
  doc.text("Setor:", col2, y + 6);
  doc.text("Vigência:", col1, y + 13);
  doc.text("Próxima Revisão:", col2, y + 13);

  doc.setFont("helvetica", "normal");
  doc.setTextColor(50);
  doc.text(CATEGORY_LABELS[pop.category] || pop.category, col1 + 22, y + 6);
  doc.text(pop.sector || "—", col2 + 14, y + 6);
  doc.text(pop.effective_date ? new Date(pop.effective_date).toLocaleDateString("pt-BR") : "—", col1 + 22, y + 13);
  doc.text(pop.next_review_date ? new Date(pop.next_review_date).toLocaleDateString("pt-BR") : "—", col2 + 35, y + 13);

  y += 26;

  // ===== SECTIONS =====
  addSection("1", "OBJETIVO", pop.objective);
  addSection("2", "ABRANGÊNCIA / ESCOPO", pop.scope);
  addSection("3", "RESPONSABILIDADES", pop.responsibilities);
  addSection("4", "MATERIAIS E EQUIPAMENTOS", pop.materials);
  addSection("5", "PROCEDIMENTO", pop.procedure_steps);
  addSection("6", "CUIDADOS DE BIOSSEGURANÇA", pop.safety_notes);
  addSection("7", "REFERÊNCIAS NORMATIVAS", pop.references_docs);

  // ===== REVISION HISTORY =====
  if (pop.revision_history) {
    addSection("8", "HISTÓRICO DE REVISÕES", pop.revision_history);
  }

  // ===== SIGNATURE AREA =====
  checkNewPage(40);
  y += 10;
  doc.setDrawColor(150);
  doc.setLineWidth(0.3);

  const sigW = (contentW - 20) / 2;

  // Line 1
  doc.line(marginL, y + 15, marginL + sigW, y + 15);
  doc.line(marginL + sigW + 20, y + 15, marginL + contentW, y + 15);

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(80);
  doc.text("Elaborado por", marginL + sigW / 2, y + 20, { align: "center" });
  doc.text("Data: ___/___/______", marginL + sigW / 2, y + 25, { align: "center" });

  doc.text("Aprovado por", marginL + sigW + 20 + sigW / 2, y + 20, { align: "center" });
  doc.text("Data: ___/___/______", marginL + sigW + 20 + sigW / 2, y + 25, { align: "center" });

  // Footer on all pages
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    addFooter(i);
  }

  // Save
  doc.save(`${pop.code}_v${pop.version}.pdf`);
}
