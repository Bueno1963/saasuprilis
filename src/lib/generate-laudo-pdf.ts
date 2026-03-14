import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface LaudoResult {
  exam: string;
  value: string;
  unit: string;
  referenceRange: string;
  flag: string;
  sector?: string;
  hideReferenceRange?: boolean;
  hideFlag?: boolean;
  hideUnit?: boolean;
  headerText?: string;
  footerText?: string;
  defaultObservations?: string;
  parameters?: {
    section: string;
    name: string;
    value: string;
    unit: string;
    referenceRange: string;
  }[];
}

interface HistoryEntry {
  exam: string;
  date: string;
  value: string;
  unit: string;
  flag: string;
}

interface LaudoData {
  orderNumber: string;
  patientName: string;
  patientCpf: string;
  patientBirthDate: string;
  patientGender: string;
  doctorName: string;
  insurance: string;
  collectedAt: string;
  releasedAt: string;
  results: LaudoResult[];
  analystName: string;
  analystCrm?: string;
  history?: HistoryEntry[];
}

const FLAG_LABELS: Record<string, string> = {
  normal: "",
  high: "↑ Alto",
  low: "↓ Baixo",
  critical: "⚠ Crítico",
};

/** Draw a laudo on an existing jsPDF doc (current page) */
export function drawLaudoOnDoc(doc: jsPDF, data: LaudoData) {
  const pageWidth = doc.internal.pageSize.getWidth();

  // Header
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(20, 55, 90);
  doc.text("LAUDO DE EXAMES LABORATORIAIS", pageWidth / 2, 22, { align: "center" });

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100);
  doc.text("Laboratório de Análises Clínicas", pageWidth / 2, 28, { align: "center" });

  // Divider
  doc.setDrawColor(20, 55, 90);
  doc.setLineWidth(0.5);
  doc.line(14, 32, pageWidth - 14, 32);

  // Patient info block
  let y = 40;
  doc.setFontSize(10);
  doc.setTextColor(40);

  const leftCol = 14;
  const rightCol = pageWidth / 2 + 10;

  const addField = (label: string, value: string, x: number, yPos: number) => {
    doc.setFont("helvetica", "bold");
    doc.text(`${label}: `, x, yPos);
    const labelWidth = doc.getTextWidth(`${label}: `);
    doc.setFont("helvetica", "normal");
    doc.text(value || "—", x + labelWidth, yPos);
  };

  addField("Paciente", data.patientName, leftCol, y);
  addField("Pedido", data.orderNumber, rightCol, y);
  y += 6;
  addField("CPF", data.patientCpf, leftCol, y);
  addField("Sexo", data.patientGender === "M" ? "Masculino" : data.patientGender === "F" ? "Feminino" : data.patientGender, rightCol, y);
  y += 6;
  addField("Data de Nascimento", data.patientBirthDate, leftCol, y);
  addField("Convênio", data.insurance, rightCol, y);
  y += 6;
  addField("Médico Solicitante", data.doctorName, leftCol, y);
  y += 6;
  addField("Coleta", data.collectedAt, leftCol, y);
  addField("Liberação", data.releasedAt, rightCol, y);
  y += 4;

  // Divider
  doc.setDrawColor(200);
  doc.setLineWidth(0.3);
  doc.line(14, y, pageWidth - 14, y);
  y += 6;

  // Results table — grouped by sector
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(20, 55, 90);
  doc.text("RESULTADOS", leftCol, y);
  y += 4;

  // Group results by sector
  const sectorMap = new Map<string, LaudoResult[]>();
  for (const r of data.results) {
    const sector = r.sector || "Geral";
    if (!sectorMap.has(sector)) sectorMap.set(sector, []);
    sectorMap.get(sector)!.push(r);
  }

  // Build table body with sector headers
  const tableBody: any[][] = [];
  const sectors = [...sectorMap.keys()].sort();
  const hasSectors = sectors.length > 1 || (sectors.length === 1 && sectors[0] !== "Geral");

  for (const sector of sectors) {
    if (hasSectors) {
      tableBody.push([{
        content: `▸ ${sector.toUpperCase()}`,
        colSpan: 5,
        styles: { fontStyle: "bold", fillColor: [20, 55, 90], textColor: [255, 255, 255], fontSize: 9, cellPadding: { top: 3, bottom: 3, left: 4, right: 4 } },
      }]);
    }

    for (const r of sectorMap.get(sector)!) {
      if (r.parameters && r.parameters.length > 0) {
        tableBody.push([{ content: r.exam, colSpan: 5, styles: { fontStyle: "bold", fillColor: [230, 240, 250], textColor: [20, 55, 90], fontSize: 9 } }]);
        let lastSection = "";
        for (const p of r.parameters) {
          if (p.section && p.section !== lastSection) {
            lastSection = p.section;
            tableBody.push([{ content: p.section, colSpan: 5, styles: { fontStyle: "bold", fillColor: [240, 242, 245], textColor: [80, 80, 80], fontSize: 8 } }]);
          }
          tableBody.push(["   " + p.name, p.value, p.unit, r.hideReferenceRange ? "" : p.referenceRange, ""]);
        }
      } else {
        tableBody.push([r.exam, r.value, r.unit, r.hideReferenceRange ? "" : r.referenceRange, FLAG_LABELS[r.flag] || ""]);
      }
    }
  }

  autoTable(doc, {
    startY: y,
    head: [["Exame / Parâmetro", "Resultado", "Unidade", "Valor de Referência", "Flag"]],
    body: tableBody,
    theme: "grid",
    headStyles: { fillColor: [20, 55, 90], textColor: 255, fontSize: 9, fontStyle: "bold" },
    bodyStyles: { fontSize: 9, textColor: 40 },
    alternateRowStyles: { fillColor: [245, 248, 252] },
    columnStyles: {
      0: { cellWidth: 50 },
      1: { cellWidth: 30, fontStyle: "bold", halign: "center" },
      2: { cellWidth: 25, halign: "center" },
      3: { cellWidth: 50 },
      4: { cellWidth: 25, halign: "center" },
    },
    margin: { left: 14, right: 14 },
  });

  // Digital signature
  const finalY = (doc as any).lastAutoTable?.finalY || y + 40;
  const sigY = finalY + 20;

  // Check if signature fits on current page
  const pageHeight = doc.internal.pageSize.getHeight();
  let currentSigY = sigY;
  if (sigY + 25 > pageHeight - 15) {
    doc.addPage();
    currentSigY = 30;
  }

  doc.setDrawColor(100);
  doc.setLineWidth(0.3);
  const sigLineX = pageWidth / 2 - 40;
  const sigLineEnd = pageWidth / 2 + 40;
  doc.line(sigLineX, currentSigY, sigLineEnd, currentSigY);

  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(40);
  doc.text(data.analystName, pageWidth / 2, currentSigY + 5, { align: "center" });

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100);
  if (data.analystCrm) {
    doc.text(`CRM: ${data.analystCrm}`, pageWidth / 2, currentSigY + 10, { align: "center" });
  }
  doc.text("Assinatura Digital — Laudo emitido eletronicamente", pageWidth / 2, currentSigY + 15, { align: "center" });

  // History section
  if (data.history && data.history.length > 0) {
    doc.addPage();

    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(20, 55, 90);
    doc.text("HISTÓRICO DE RESULTADOS ANTERIORES", pageWidth / 2, 20, { align: "center" });

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100);
    doc.text(`Paciente: ${data.patientName}`, pageWidth / 2, 27, { align: "center" });

    doc.setDrawColor(20, 55, 90);
    doc.setLineWidth(0.5);
    doc.line(14, 30, pageWidth - 14, 30);

    // Group history by exam
    const historyByExam = new Map<string, HistoryEntry[]>();
    for (const h of data.history) {
      if (!historyByExam.has(h.exam)) historyByExam.set(h.exam, []);
      historyByExam.get(h.exam)!.push(h);
    }

    const historyBody: any[][] = [];
    for (const [exam, entries] of historyByExam) {
      historyBody.push([{
        content: exam,
        colSpan: 4,
        styles: { fontStyle: "bold", fillColor: [230, 240, 250], textColor: [20, 55, 90], fontSize: 9 },
      }]);
      // Sort by date desc
      entries.sort((a, b) => b.date.localeCompare(a.date));
      for (const entry of entries) {
        historyBody.push([entry.date, entry.value, entry.unit, FLAG_LABELS[entry.flag] || ""]);
      }
    }

    autoTable(doc, {
      startY: 35,
      head: [["Data", "Resultado", "Unidade", "Flag"]],
      body: historyBody,
      theme: "grid",
      headStyles: { fillColor: [20, 55, 90], textColor: 255, fontSize: 9, fontStyle: "bold" },
      bodyStyles: { fontSize: 9, textColor: 40 },
      alternateRowStyles: { fillColor: [245, 248, 252] },
      columnStyles: {
        0: { cellWidth: 40 },
        1: { cellWidth: 50, fontStyle: "bold", halign: "center" },
        2: { cellWidth: 30, halign: "center" },
        3: { cellWidth: 30, halign: "center" },
      },
      margin: { left: 14, right: 14 },
    });
  }

  // Footer on all pages
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    const ph = doc.internal.pageSize.getHeight();
    doc.setFontSize(7);
    doc.setTextColor(150);
    doc.text(
      `Documento gerado em ${new Date().toLocaleString("pt-BR")} — Este laudo tem validade digital. — Pág. ${i}/${totalPages}`,
      pageWidth / 2,
      ph - 10,
      { align: "center" }
    );
  }
}

export function generateLaudoPDF(data: LaudoData) {
  const doc = new jsPDF();
  drawLaudoOnDoc(doc, data);
  return doc;
}
