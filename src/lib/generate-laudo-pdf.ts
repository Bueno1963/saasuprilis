import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

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
  results: {
    exam: string;
    value: string;
    unit: string;
    referenceRange: string;
    flag: string;
  }[];
  analystName: string;
  analystCrm?: string;
}

const FLAG_LABELS: Record<string, string> = {
  normal: "",
  high: "↑ Alto",
  low: "↓ Baixo",
  critical: "⚠ Crítico",
};

export function generateLaudoPDF(data: LaudoData) {
  const doc = new jsPDF();
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

  // Results table
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(20, 55, 90);
  doc.text("RESULTADOS", leftCol, y);
  y += 4;

  autoTable(doc, {
    startY: y,
    head: [["Exame", "Resultado", "Unidade", "Valor de Referência", "Flag"]],
    body: data.results.map(r => [
      r.exam,
      r.value,
      r.unit,
      r.referenceRange,
      FLAG_LABELS[r.flag] || "",
    ]),
    theme: "grid",
    headStyles: {
      fillColor: [20, 55, 90],
      textColor: 255,
      fontSize: 9,
      fontStyle: "bold",
    },
    bodyStyles: {
      fontSize: 9,
      textColor: 40,
    },
    alternateRowStyles: {
      fillColor: [245, 248, 252],
    },
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

  doc.setDrawColor(100);
  doc.setLineWidth(0.3);
  const sigLineX = pageWidth / 2 - 40;
  const sigLineEnd = pageWidth / 2 + 40;
  doc.line(sigLineX, sigY, sigLineEnd, sigY);

  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(40);
  doc.text(data.analystName, pageWidth / 2, sigY + 5, { align: "center" });

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100);
  if (data.analystCrm) {
    doc.text(`CRM: ${data.analystCrm}`, pageWidth / 2, sigY + 10, { align: "center" });
  }
  doc.text("Assinatura Digital — Laudo emitido eletronicamente", pageWidth / 2, sigY + 15, { align: "center" });

  // Footer
  const pageHeight = doc.internal.pageSize.getHeight();
  doc.setFontSize(7);
  doc.setTextColor(150);
  doc.text(
    `Documento gerado em ${new Date().toLocaleString("pt-BR")} — Este laudo tem validade digital.`,
    pageWidth / 2,
    pageHeight - 10,
    { align: "center" }
  );

  return doc;
}
