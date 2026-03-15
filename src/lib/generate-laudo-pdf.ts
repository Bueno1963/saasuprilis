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

  // Collect per-exam header texts
  const examHeaderTexts: string[] = [];
  const examFooterTexts: string[] = [];
  const examObservations: string[] = [];
  for (const r of data.results) {
    if (r.headerText) examHeaderTexts.push(r.headerText);
    if (r.footerText) examFooterTexts.push(r.footerText);
    if (r.defaultObservations) examObservations.push(r.defaultObservations);
  }

  // Print header texts if any
  if (examHeaderTexts.length > 0) {
    doc.setFontSize(8);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(80);
    for (const ht of examHeaderTexts) {
      doc.text(ht, leftCol, y);
      y += 4;
    }
    y += 2;
  }

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

  // Sectors that use the clean 4-column model (no Flag)
  const CLEAN_TABLE_SECTORS = ["bioquímica", "bioquimica", "hormônio", "hormonio", "hormonios", "hormônios", "imunologia", "hematologia", "equ", "eas", "urina", "urinálise", "urinalise", "uroanálise", "uroanalise"];

  const URINE_SECTORS = ["equ", "eas", "urina", "urinálise", "urinalise", "uroanálise", "uroanalise"];
  const URINE_REF_PARAMS = ["ph", "densidade", "leucócitos", "leucocitos", "hemácias", "hemacias"];

  const isUrineSector = (sector: string) => {
    const norm = sector.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    return URINE_SECTORS.includes(norm) || URINE_SECTORS.includes(sector.toLowerCase());
  };

  const shouldShowUrineRef = (paramName: string) => {
    const norm = paramName.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
    return URINE_REF_PARAMS.some(p => norm.includes(p));
  };

  const sectors = [...sectorMap.keys()].sort();
  const hasSectors = sectors.length > 1 || (sectors.length === 1 && sectors[0] !== "Geral");

  for (const sector of sectors) {
    const sectorResults = sectorMap.get(sector)!;
    const isCleanTable = CLEAN_TABLE_SECTORS.includes(sector.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()) ||
      CLEAN_TABLE_SECTORS.includes(sector.toLowerCase());
    const isUrine = isUrineSector(sector);

    // Determine per-sector column visibility
    const sectorHideRef = !isCleanTable && sectorResults.some(r => r.hideReferenceRange);
    const sectorHideFlag = isCleanTable || sectorResults.some(r => r.hideFlag);
    const sectorHideUnit = !isCleanTable && sectorResults.some(r => r.hideUnit);

    // Check if any result in this sector has a LEUCOGRAMA section
    const sectorHasLeucograma = sectorResults.some(r => r.parameters?.some(p => p.section?.toUpperCase() === "LEUCOGRAMA"));

    // Differential count params that need absolute value calculation
    const DIFFERENTIAL_PARAMS = [
      "basófilos", "basofilos", "eosinófilos", "eosinofilos",
      "mielócitos", "mielocitos", "metamielócitos", "metamielocitos",
      "bastões", "bastoes", "segmentados",
      "linfócitos típicos", "linfocitos tipicos", "linfócitos atípicos", "linfocitos atipicos",
      "monócitos", "monocitos"
    ];

    const isDifferentialParam = (name: string) => {
      const norm = name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
      return DIFFERENTIAL_PARAMS.some(d => norm === d || norm.startsWith(d));
    };

    // When sector has both ERITROGRAMA and LEUCOGRAMA, split into separate tables
    if (sectorHasLeucograma) {
      for (const r of sectorResults) {
        if (!r.parameters || r.parameters.length === 0) {
          // Simple result row — render as 4-col clean table
          const headRow4 = ["Exame / Parâmetro", "Resultado"];
          if (!sectorHideUnit) headRow4.push("Unidade");
          if (!sectorHideRef) headRow4.push("Valor de Referência");
          const colCount4 = headRow4.length;
          const body4: any[][] = [];
          const row4: any[] = [r.exam, r.value];
          if (!sectorHideUnit) row4.push(r.unit);
          if (!sectorHideRef) row4.push((r.hideReferenceRange || (isUrine && !shouldShowUrineRef(r.exam))) ? "" : r.referenceRange);
          body4.push(row4);
          autoTable(doc, {
            startY: y,
            head: [headRow4],
            body: body4,
            theme: "grid",
            headStyles: { fillColor: [20, 55, 90], textColor: 255, fontSize: 9, fontStyle: "bold" },
            bodyStyles: { fontSize: 9, textColor: 40 },
            alternateRowStyles: { fillColor: [245, 248, 252] },
            columnStyles: {
              0: { cellWidth: 'auto' },
              1: { cellWidth: 28, fontStyle: "bold", halign: "center" },
              ...((!sectorHideUnit) ? { 2: { cellWidth: 22, halign: "center" } } : {}),
              ...((!sectorHideRef) ? { [(!sectorHideUnit) ? 3 : 2]: { cellWidth: 45, halign: "center" } } : {}),
            },
            margin: { left: 14, right: 14 },
          });
          y = (doc as any).lastAutoTable?.finalY + 4 || y + 20;
          continue;
        }

        // Find Leucócitos value for absolute calculation
        let leucocitosValue = 0;
        const leucParam = r.parameters.find(p => p.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim() === "leucocitos");
        if (leucParam && leucParam.value && leucParam.value !== "—") {
          leucocitosValue = parseFloat(leucParam.value.replace(/[^\d.,]/g, "").replace(",", ".")) || 0;
        }

        // Split parameters by section groups: non-LEUCOGRAMA vs LEUCOGRAMA
        const nonLeucogramaParams: typeof r.parameters = [];
        const leucogramaParams: typeof r.parameters = [];
        let currentIsLeuco = false;
        for (const p of r.parameters) {
          if (p.section) {
            currentIsLeuco = p.section.toUpperCase() === "LEUCOGRAMA";
          }
          if (currentIsLeuco) {
            leucogramaParams.push(p);
          } else {
            nonLeucogramaParams.push(p);
          }
        }

        // --- Render non-LEUCOGRAMA (e.g. ERITROGRAMA) as 4-col clean table ---
        if (nonLeucogramaParams.length > 0) {
          const headRow4 = ["Exame / Parâmetro", "Resultado"];
          if (!sectorHideUnit) headRow4.push("Unidade");
          if (!sectorHideRef) headRow4.push("Valor de Referência");
          const colCount4 = headRow4.length;

          const body4: any[][] = [];
          body4.push([{ content: r.exam, colSpan: colCount4, styles: { fontStyle: "bold", fillColor: [230, 240, 250], textColor: [20, 55, 90], fontSize: 9 } }]);

          let lastSection = "";
          for (const p of nonLeucogramaParams) {
            if (p.section && p.section !== lastSection) {
              lastSection = p.section;
              body4.push([{ content: p.section, colSpan: colCount4, styles: { fontStyle: "bold", fillColor: [240, 242, 245], textColor: [80, 80, 80], fontSize: 8 } }]);
            }
            const row: any[] = ["   " + p.name, p.value];
            if (!sectorHideUnit) row.push(p.unit);
            if (!sectorHideRef) row.push((r.hideReferenceRange || (isUrine && !shouldShowUrineRef(p.name))) ? "" : p.referenceRange);
            body4.push(row);
          }

          autoTable(doc, {
            startY: y,
            head: [headRow4],
            body: body4,
            theme: "grid",
            headStyles: { fillColor: [20, 55, 90], textColor: 255, fontSize: 9, fontStyle: "bold" },
            bodyStyles: { fontSize: 9, textColor: 40 },
            alternateRowStyles: { fillColor: [245, 248, 252] },
            columnStyles: {
              0: { cellWidth: 'auto' },
              1: { cellWidth: 28, fontStyle: "bold", halign: "center" },
              2: { cellWidth: 22, halign: "center" },
              3: { cellWidth: 45, halign: "center" },
            },
            margin: { left: 14, right: 14 },
          });
          y = (doc as any).lastAutoTable?.finalY + 4 || y + 20;
        }

        // --- Render LEUCOGRAMA as 5-col table with Valor Absoluto ---
        if (leucogramaParams.length > 0) {
          const headRow5 = ["Exame / Parâmetro", "Resultado", "Valor Absoluto"];
          if (!sectorHideUnit) headRow5.push("Unidade");
          if (!sectorHideRef) headRow5.push("Valor de Referência");
          const colCount5 = headRow5.length;

          const body5: any[][] = [];
          let lastSection = "";
          // Params that should be hidden when value is 0
          const HIDE_WHEN_ZERO = ["mielocitos", "metamielocitos", "linfocitos atipicos"];
          const shouldHideWhenZero = (name: string) => {
            const norm = name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
            return HIDE_WHEN_ZERO.some(h => norm === h || norm.startsWith(h));
          };

          for (const p of leucogramaParams) {
            // Skip zero-value params that should be hidden
            if (shouldHideWhenZero(p.name)) {
              const numVal = parseFloat((p.value || "0").replace(/[^\d.,]/g, "").replace(",", ".")) || 0;
              if (numVal === 0) continue;
            }

            if (p.section && p.section !== lastSection) {
              lastSection = p.section;
              body5.push([{ content: p.section, colSpan: colCount5, styles: { fontStyle: "bold", fillColor: [240, 242, 245], textColor: [80, 80, 80], fontSize: 8 } }]);
            }

            let absoluto = "";
            let displayValue = p.value;
            const isLeucocitoParam = p.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim() === "leucocitos";

            if (isDifferentialParam(p.name) && p.value && p.value !== "—" && leucocitosValue > 0) {
              const pct = parseFloat(p.value.replace(/[^\d.,]/g, "").replace(",", ".")) || 0;
              absoluto = Math.round(pct * leucocitosValue / 100).toString();
            }
            if (isLeucocitoParam) {
              // Leucócitos: Result = 100 (sum of differentials), Valor Absoluto = actual count
              absoluto = p.value !== "—" ? p.value : "";
              displayValue = "100";
            }

            const row: any[] = ["   " + p.name, displayValue, absoluto];
            if (!sectorHideUnit) row.push(p.unit);
            if (!sectorHideRef) row.push((r.hideReferenceRange || (isUrine && !shouldShowUrineRef(p.name))) ? "" : p.referenceRange);
            body5.push(row);
          }

          autoTable(doc, {
            startY: y,
            head: [headRow5],
            body: body5,
            theme: "grid",
            headStyles: { fillColor: [20, 55, 90], textColor: 255, fontSize: 9, fontStyle: "bold" },
            bodyStyles: { fontSize: 9, textColor: 40 },
            alternateRowStyles: { fillColor: [245, 248, 252] },
            columnStyles: {
              0: { cellWidth: 'auto' },
              1: { cellWidth: 24, fontStyle: "bold", halign: "center" },
              2: { cellWidth: 28, fontStyle: "bold", halign: "center" },
              3: { cellWidth: 20, halign: "center" },
              4: { cellWidth: 42, halign: "center" },
            },
            margin: { left: 14, right: 14 },
          });
          y = (doc as any).lastAutoTable?.finalY + 6 || y + 40;
        }
      }
    } else {
      // Standard rendering for non-hemograma sectors
      const headRow: string[] = ["Exame / Parâmetro", "Resultado"];
      if (!sectorHideUnit) headRow.push("Unidade");
      if (!sectorHideRef) headRow.push("Valor de Referência");
      if (!sectorHideFlag) headRow.push("Flag");
      const colCount = headRow.length;

      const tableBody: any[][] = [];

      for (const r of sectorResults) {
        if (r.parameters && r.parameters.length > 0) {
          tableBody.push([{ content: r.exam, colSpan: colCount, styles: { fontStyle: "bold", fillColor: [230, 240, 250], textColor: [20, 55, 90], fontSize: 9 } }]);
          let lastSection = "";
          for (const p of r.parameters) {
            if (p.section && p.section !== lastSection) {
              lastSection = p.section;
              tableBody.push([{ content: p.section, colSpan: colCount, styles: { fontStyle: "bold", fillColor: [240, 242, 245], textColor: [80, 80, 80], fontSize: 8 } }]);
            }
            const row: any[] = ["   " + p.name, p.value];
            if (!sectorHideUnit) row.push(p.unit);
            if (!sectorHideRef) row.push((r.hideReferenceRange || (isUrine && !shouldShowUrineRef(p.name))) ? "" : p.referenceRange);
            if (!sectorHideFlag) row.push("");
            tableBody.push(row);
          }
        } else {
          const row: any[] = [r.exam, r.value];
          if (!sectorHideUnit) row.push(r.unit);
          if (!sectorHideRef) row.push((r.hideReferenceRange || (isUrine && !shouldShowUrineRef(r.exam))) ? "" : r.referenceRange);
          if (!sectorHideFlag) row.push(FLAG_LABELS[r.flag] || "");
          tableBody.push(row);
        }
      }

      const columnStyles: Record<number, any> = {};
      if (isCleanTable) {
        columnStyles[0] = { cellWidth: 'auto' };
        columnStyles[1] = { cellWidth: 28, fontStyle: "bold", halign: "center" };
        columnStyles[2] = { cellWidth: 22, halign: "center" };
        columnStyles[3] = { cellWidth: 45, halign: "center" };
      } else {
        let colIdx = 0;
        columnStyles[colIdx++] = { cellWidth: 'auto' };
        columnStyles[colIdx++] = { cellWidth: 28, fontStyle: "bold", halign: "center" };
        if (!sectorHideUnit) { columnStyles[colIdx++] = { cellWidth: 20, halign: "center" }; }
        if (!sectorHideRef) { columnStyles[colIdx++] = { cellWidth: 42 }; }
        if (!sectorHideFlag) { columnStyles[colIdx++] = { cellWidth: 22, halign: "center" }; }
      }

      autoTable(doc, {
        startY: y,
        head: [headRow],
        body: tableBody,
        theme: "grid",
        headStyles: { fillColor: [20, 55, 90], textColor: 255, fontSize: 9, fontStyle: "bold" },
        bodyStyles: { fontSize: 9, textColor: 40 },
        alternateRowStyles: { fillColor: [245, 248, 252] },
        columnStyles,
        margin: { left: 14, right: 14 },
      });

      y = (doc as any).lastAutoTable?.finalY + 6 || y + 40;
    }
  }

  // Observations
  let afterTableY = (doc as any).lastAutoTable?.finalY || y + 40;
  if (examObservations.length > 0) {
    afterTableY += 6;
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(20, 55, 90);
    doc.text("OBSERVAÇÕES", leftCol, afterTableY);
    afterTableY += 5;
    doc.setFont("helvetica", "normal");
    doc.setTextColor(60);
    doc.setFontSize(8);
    for (const obs of examObservations) {
      const lines = doc.splitTextToSize(obs, pageWidth - 28);
      doc.text(lines, leftCol, afterTableY);
      afterTableY += lines.length * 4 + 2;
    }
  }

  // Exam footer texts
  if (examFooterTexts.length > 0) {
    afterTableY += 4;
    doc.setFontSize(8);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(100);
    for (const ft of examFooterTexts) {
      doc.text(ft, leftCol, afterTableY);
      afterTableY += 4;
    }
  }

  // Digital signature
  const sigY = afterTableY + 20;

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
