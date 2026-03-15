import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

/**
 * Checks if a numeric value is outside the reference range.
 * Supports formats: "X a Y", "X - Y", "< X", "> X", "Até X", etc.
 */
function isOutOfRange(value: string, refRange: string): boolean {
  if (!value || !refRange || value === "—") return false;
  const num = parseFloat(value.replace(/[^\d.,\-]/g, "").replace(",", "."));
  if (isNaN(num)) return false;

  const rangeMatch = refRange.match(/([\d.,]+)\s*(?:a|à|-|–)\s*([\d.,]+)/i);
  if (rangeMatch) {
    const low = parseFloat(rangeMatch[1].replace(",", "."));
    const high = parseFloat(rangeMatch[2].replace(",", "."));
    if (!isNaN(low) && !isNaN(high)) return num < low || num > high;
  }

  const ltMatch = refRange.match(/(?:<|até|menor\s*que)\s*([\d.,]+)/i);
  if (ltMatch) {
    const limit = parseFloat(ltMatch[1].replace(",", "."));
    if (!isNaN(limit)) return num > limit;
  }

  const gtMatch = refRange.match(/(?:>|maior\s*que|acima\s*de)\s*([\d.,]+)/i);
  if (gtMatch) {
    const limit = parseFloat(gtMatch[1].replace(",", "."));
    if (!isNaN(limit)) return num < limit;
  }

  return false;
}

const RED_TEXT: [number, number, number] = [200, 30, 30];

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
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(20, 55, 90);
  doc.text("LAUDO DE EXAMES LABORATORIAIS", pageWidth / 2, 18, { align: "center" });

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100);
  doc.text("Laboratório de Análises Clínicas", pageWidth / 2, 23, { align: "center" });

  // Divider
  doc.setDrawColor(20, 55, 90);
  doc.setLineWidth(0.5);
  doc.line(14, 26, pageWidth - 14, 26);

  // Patient info block
  let y = 32;
  doc.setFontSize(8);
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
  y += 4.5;
  addField("CPF", data.patientCpf, leftCol, y);
  addField("Sexo", data.patientGender === "M" ? "Masculino" : data.patientGender === "F" ? "Feminino" : data.patientGender, rightCol, y);
  y += 4.5;
  addField("Data de Nascimento", data.patientBirthDate, leftCol, y);
  addField("Convênio", data.insurance, rightCol, y);
  y += 4.5;
  addField("Médico Solicitante", data.doctorName, leftCol, y);
  addField("Coleta", data.collectedAt, rightCol, y);
  y += 4.5;
  addField("Liberação", data.releasedAt, leftCol, y);
  y += 3;

  // Divider
  doc.setDrawColor(200);
  doc.setLineWidth(0.3);
  doc.line(14, y, pageWidth - 14, y);
  y += 4;

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
  doc.setFontSize(10);
   y += 16;

  // Group results by sector
  const sectorMap = new Map<string, LaudoResult[]>();
  for (const r of data.results) {
    const sector = r.sector || "Geral";
    if (!sectorMap.has(sector)) sectorMap.set(sector, []);
    sectorMap.get(sector)!.push(r);
  }

  // Sectors that use the clean 4-column model (no Flag)
  const CLEAN_TABLE_SECTORS = ["bioquímica", "bioquimica", "hormônio", "hormonio", "hormonios", "hormônios", "imunologia", "hematologia", "equ", "eas", "urina", "urinálise", "urinalise", "uroanálise", "uroanalise"];
  const BIOCHEM_SECTORS = ["bioquímica", "bioquimica"];

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
    const isBiochem = BIOCHEM_SECTORS.includes(sector.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()) || BIOCHEM_SECTORS.includes(sector.toLowerCase());

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
            // Observações: span value across remaining columns
            if (p.name === "Observações") {
              const remainingCols = colCount4 - 1;
              body4.push(["   " + p.name, { content: p.value || "", colSpan: remainingCols, styles: { fontStyle: "normal" } }]);
            } else {
              const outOfRange = isOutOfRange(p.value, p.referenceRange);
              const valCell = outOfRange
                ? { content: p.value, styles: { textColor: RED_TEXT, fontStyle: "bold" } }
                : p.value;
              const row: any[] = ["   " + p.name, valCell];
              if (!sectorHideUnit) row.push(p.unit);
              if (!sectorHideRef) row.push((r.hideReferenceRange || (isUrine && !shouldShowUrineRef(p.name))) ? "" : p.referenceRange);
              body4.push(row);
            }
          }

          autoTable(doc, {
            startY: y,
            head: [headRow4],
            body: body4,
            theme: "grid",
            headStyles: { fillColor: [20, 55, 90], textColor: 255, fontSize: 7.5, fontStyle: "bold", cellPadding: 1.5 },
            bodyStyles: { fontSize: 7.5, textColor: 40, cellPadding: 1.5 },
            alternateRowStyles: { fillColor: [245, 248, 252] },
            columnStyles: {
              0: { cellWidth: 'auto' },
              1: { cellWidth: 24, fontStyle: "bold", halign: "center" },
              2: { cellWidth: 18, halign: "center" },
              3: { cellWidth: 40, halign: "center" },
            },
            margin: { left: 14, right: 14 },
          });
          y = (doc as any).lastAutoTable?.finalY + 2 || y + 20;
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
          const HIDE_WHEN_ZERO = ["mielocitos", "metamielocitos", "linfocitos atipicos", "monocitos"];
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

            // Rename "Linfócitos típicos" → "Linfócitos" for display
            let displayName = p.name;
            const normName = p.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
            if (normName === "linfocitos tipicos") displayName = "Linfócitos";

            // Observações: span value across remaining columns
            if (p.name === "Observações") {
              const remainingCols = colCount5 - 1;
              body5.push(["   " + displayName, { content: displayValue || "", colSpan: remainingCols, styles: { fontStyle: "normal" } }]);
            } else {
              const outOfRange = !isLeucocitoParam && isOutOfRange(displayValue, p.referenceRange);
              const valCell = outOfRange
                ? { content: displayValue, styles: { textColor: RED_TEXT, fontStyle: "bold" } }
                : displayValue;
              const absCell = outOfRange && absoluto
                ? { content: absoluto, styles: { textColor: RED_TEXT, fontStyle: "bold" } }
                : absoluto;
              const row: any[] = ["   " + displayName, valCell, absCell];
              if (!sectorHideUnit) row.push(p.unit);
              if (!sectorHideRef) row.push((r.hideReferenceRange || (isUrine && !shouldShowUrineRef(p.name))) ? "" : p.referenceRange);
              body5.push(row);
            }
          }

          autoTable(doc, {
            startY: y,
            head: [headRow5],
            body: body5,
            theme: "grid",
            headStyles: { fillColor: [20, 55, 90], textColor: 255, fontSize: 7.5, fontStyle: "bold", cellPadding: 1.5 },
            bodyStyles: { fontSize: 7.5, textColor: 40, cellPadding: 1.5 },
            alternateRowStyles: { fillColor: [245, 248, 252] },
            columnStyles: {
              0: { cellWidth: 'auto' },
              1: { cellWidth: 20, fontStyle: "bold", halign: "center" },
              2: { cellWidth: 24, fontStyle: "bold", halign: "center" },
              3: { cellWidth: 18, halign: "center" },
              4: { cellWidth: 38, halign: "center" },
            },
            margin: { left: 14, right: 14 },
          });
          y = (doc as any).lastAutoTable?.finalY + 3 || y + 40;
        }
      }
    } else if (isUrine) {
      // === Clinical Compact layout for EQU/Urina ===
      const SEDIMENTO_SECTIONS = ["sedimentoscopia", "sedimento", "microscopia"];
      const isSedimentoSection = (s: string) => {
        const norm = s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
        return SEDIMENTO_SECTIONS.some(ss => norm.includes(ss));
      };

      const URINE_ABNORMAL_VALUES = ["positivo", "presente", "turvo", "ligeiramente turvo"];
      const isUrineAbnormal = (val: string) => {
        const norm = val.trim().toLowerCase();
        return URINE_ABNORMAL_VALUES.some(a => norm === a);
      };

      const fullWidth = pageWidth - 28; // total usable width
      const uWidth = fullWidth * 0.5; // 50% narrower
      const uMargin = (pageWidth - uWidth) / 2; // centered
      const uRight = uMargin + uWidth;

      for (const r of sectorResults) {
        // Exam title — clean, no heavy box
        doc.setFontSize(9);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(20, 55, 90);
        const examTitle = /urin[aá]/i.test(r.exam) ? r.exam : `${r.exam} (Urina)`;
        doc.text(examTitle, uMargin, y);
        doc.setDrawColor(20, 55, 90);
        doc.setLineWidth(0.4);
        doc.line(uMargin, y + 1.5, uMargin + doc.getTextWidth(examTitle), y + 1.5);
        y += 7;

        if (!r.parameters || r.parameters.length === 0) {
          doc.setFontSize(7.5);
          doc.setFont("helvetica", "normal");
          doc.setTextColor(35, 40, 50);
          doc.text(r.exam, uMargin + 2, y);
          doc.setFont("helvetica", "bold");
          const outOfRange = isOutOfRange(r.value, r.referenceRange);
          if (outOfRange) doc.setTextColor(200, 30, 30);
          else doc.setTextColor(20, 25, 35);
          doc.text(r.value || "—", uRight - 2, y, { align: "right" });
          y += 5;
          continue;
        }

        // Group parameters by section
        const sectionGroups: { section: string; params: typeof r.parameters }[] = [];
        let currentSection = "";
        for (const p of r.parameters) {
          if (p.section && p.section !== currentSection) {
            currentSection = p.section;
            sectionGroups.push({ section: p.section, params: [] });
          }
          if (sectionGroups.length === 0) {
            sectionGroups.push({ section: "CARACTERES GERAIS", params: [] });
          }
          if (p.value && p.value.trim().toLowerCase() === "ausentes") continue;
          sectionGroups[sectionGroups.length - 1].params.push(p);
        }

        for (const group of sectionGroups) {
          if (group.params.length === 0) continue;
          const isSedimento = isSedimentoSection(group.section);

          // Section title — uppercase, subtle background strip
          doc.setFillColor(235, 240, 248);
          doc.rect(uMargin, y - 3.5, uWidth, 5, "F");
          doc.setFontSize(6.5);
          doc.setFont("helvetica", "bold");
          doc.setTextColor(40, 55, 80);
          doc.text(group.section.toUpperCase(), uMargin + 2, y);
          y += 4;

          // Column sub-headers
          doc.setFontSize(5.5);
          doc.setFont("helvetica", "normal");
          doc.setTextColor(100, 110, 125);
          doc.text("Parâmetro", uMargin + 2, y);
          if (isSedimento) {
            doc.text("Resultado", uMargin + uWidth * 0.55, y, { align: "left" });
            doc.text("Unidade", uRight - 2, y, { align: "right" });
          } else {
            doc.text("Resultado", uRight - 2, y, { align: "right" });
          }
          y += 1.5;
          doc.setDrawColor(190, 198, 210);
          doc.setLineWidth(0.2);
          doc.line(uMargin, y, uRight, y);
          y += 3.5;

          const rowH = 5.5;
          for (let pi = 0; pi < group.params.length; pi++) {
            const p = group.params[pi];

            // Page break
            if (y + rowH > doc.internal.pageSize.getHeight() - 20) {
              doc.addPage();
              y = 20;
            }

            // Alternating row
            if (pi % 2 === 0) {
              doc.setFillColor(250, 251, 253);
              doc.rect(uMargin, y - 3.5, uWidth, rowH, "F");
            }

            // Param name
            doc.setFontSize(7);
            doc.setFont("helvetica", "normal");
            doc.setTextColor(35, 40, 50);
            doc.text(p.name, uMargin + 3, y);

            // Value — right aligned, bold
            const outOfRange = isOutOfRange(p.value, p.referenceRange);
            const abnormal = isUrineAbnormal(p.value || "");
            const shouldHighlight = outOfRange || abnormal;

            doc.setFont("helvetica", "bold");
            if (shouldHighlight) {
              doc.setTextColor(200, 30, 30);
            } else {
              doc.setTextColor(20, 25, 35);
            }

            if (isSedimento) {
              doc.text(p.value || "—", uMargin + uWidth * 0.55, y, { align: "left" });
              // Unit
              doc.setFont("helvetica", "normal");
              doc.setTextColor(100, 105, 115);
              doc.setFontSize(6.5);
              doc.text(p.unit || "", uRight - 2, y, { align: "right" });
            } else {
              doc.text(p.value || "—", uRight - 3, y, { align: "right" });
            }

            // Separator
            doc.setDrawColor(238, 240, 245);
            doc.setLineWidth(0.1);
            doc.line(uMargin + 1, y + 1.5, uRight - 1, y + 1.5);

            y += rowH;
          }
          y += 3;
        }


        y += 3;
      }

      // Signature block inline for EQU (same page as results)
      y += 8;
      const pageHeight = doc.internal.pageSize.getHeight();
      if (y + 22 > pageHeight - 10) {
        doc.addPage();
        y = 30;
      }

      doc.setDrawColor(100);
      doc.setLineWidth(0.3);
      const equSigLineX = (pageWidth / 2) - 30;
      const equSigLineEnd = (pageWidth / 2) + 30;
      doc.line(equSigLineX, y, equSigLineEnd, y);

      doc.setFontSize(7.5);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(40, 40, 40);
      doc.text(data.analystName, pageWidth / 2, y + 4, { align: "center" });

      doc.setFontSize(6.5);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100, 100, 100);
      if (data.analystCrm) {
        doc.text(`CRM: ${data.analystCrm}`, pageWidth / 2, y + 7.5, { align: "center" });
      }
      doc.text("Assinatura Digital — Laudo emitido eletronicamente", pageWidth / 2, y + 11, { align: "center" });
      y += 16;

    } else {
      // === Bioquímica layout — matching reference exactly ===
      const bMargin = 14;
      const bRight = pageWidth - 14;
      const bWidth = bRight - bMargin;

      // Column positions
      const colParamRight = bMargin + bWidth * 0.35;
      const colResult = bMargin + bWidth * 0.40;
      const colUnit = bMargin + bWidth * 0.55;
      const colRef = bMargin + bWidth * 0.68;

      // Sector label — bold, dark blue, underlined
      if (hasSectors) {
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(20, 55, 90);
        doc.text(sector.toUpperCase(), bMargin, y);
        doc.setDrawColor(20, 55, 90);
        doc.setLineWidth(0.6);
        doc.line(bMargin, y + 1.5, bMargin + doc.getTextWidth(sector.toUpperCase()), y + 1.5);
        y += 12;
      }

      // Build rows
      const allParams: { section: string; name: string; value: string; unit: string; ref: string; outOfRange: boolean }[] = [];
      for (const r of sectorResults) {
        if (r.parameters && r.parameters.length > 0) {
          for (const p of r.parameters) {
            allParams.push({
              section: p.section || "",
              name: p.name,
              value: p.value,
              unit: p.unit,
              ref: (r.hideReferenceRange) ? "" : p.referenceRange,
              outOfRange: isOutOfRange(p.value, p.referenceRange),
            });
          }
        } else {
          allParams.push({
            section: "",
            name: r.exam,
            value: r.value,
            unit: r.unit,
            ref: (r.hideReferenceRange) ? "" : r.referenceRange,
            outOfRange: isOutOfRange(r.value, r.referenceRange),
          });
        }
      }

      // Reorder: move "Colesterol Total" right after "Triglicerídeos"
      const ctIdx = allParams.findIndex(p => p.name.toLowerCase().includes("colesterol total"));
      const tgIdx = allParams.findIndex(p => p.name.toLowerCase().includes("triglicerídeos") || p.name.toLowerCase().includes("triglicerideos") || p.name.toLowerCase().includes("triglicerides"));
      if (ctIdx !== -1 && tgIdx !== -1 && ctIdx < tgIdx) {
        const [ct] = allParams.splice(ctIdx, 1);
        const newTgIdx = allParams.findIndex(p => p.name.toLowerCase().includes("triglicerídeos") || p.name.toLowerCase().includes("triglicerideos") || p.name.toLowerCase().includes("triglicerides"));
        allParams.splice(newTgIdx + 1, 0, ct);
      }

      // Group by section
      const sectionGroups: { section: string; params: typeof allParams }[] = [];
      let currentSection: string | null = null;
      for (const p of allParams) {
        if (p.section !== currentSection) {
          currentSection = p.section;
          sectionGroups.push({ section: currentSection, params: [] });
        }
        sectionGroups[sectionGroups.length - 1].params.push(p);
      }

      // Column headers — only once before all groups
      doc.setFontSize(5.5);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100, 110, 125);
      doc.text("Resultado", colResult, y);
      doc.text("Unid.", colUnit, y);
      doc.text("Referência", colRef, y);
      y += 2;
      doc.setDrawColor(200, 205, 212);
      doc.setLineWidth(0.2);
      doc.line(bMargin, y, bRight, y);
      y += 6;

      for (const group of sectionGroups) {
        const rowH = 8;
        for (let pi = 0; pi < group.params.length; pi++) {
          const p = group.params[pi];

          if (y + rowH > doc.internal.pageSize.getHeight() - 20) {
            doc.addPage();
            y = 20;
          }

          // Parameter name — 10pt regular
          doc.setFontSize(10);
          doc.setFont("helvetica", "normal");
          doc.setTextColor(30, 35, 45);
          doc.text(p.name, bMargin + 4, y);

          // Result — 10pt bold
          doc.setFont("helvetica", "bold");
          if (p.outOfRange) {
            doc.setTextColor(180, 20, 20);
          } else {
            doc.setTextColor(20, 25, 35);
          }
          doc.text(p.value || "—", colResult, y);

          // Unit — 9pt
          doc.setFontSize(9);
          doc.setFont("helvetica", "normal");
          doc.setTextColor(60, 65, 75);
          doc.text(p.unit || "", colUnit, y);

          // Reference — 8.5pt
          doc.setFontSize(8.5);
          doc.setTextColor(80, 85, 95);
          doc.text(p.ref || "", colRef, y);

          y += rowH;
        }
      }

      // Signature block inline (same page as results)
      y += 8;
      if (y + 22 > doc.internal.pageSize.getHeight() - 10) {
        doc.addPage();
        y = 30;
      }

      doc.setDrawColor(100);
      doc.setLineWidth(0.3);
      const bSigX = (pageWidth / 2) - 30;
      const bSigEnd = (pageWidth / 2) + 30;
      doc.line(bSigX, y, bSigEnd, y);

      doc.setFontSize(7.5);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(40, 40, 40);
      doc.text(data.analystName, pageWidth / 2, y + 4, { align: "center" });

      doc.setFontSize(6.5);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100, 100, 100);
      if (data.analystCrm) {
        doc.text(`CRM: ${data.analystCrm}`, pageWidth / 2, y + 7.5, { align: "center" });
      }
      doc.text("Assinatura Digital — Laudo emitido eletronicamente", pageWidth / 2, y + 11, { align: "center" });
      y += 16;
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
  const sigY = afterTableY + 12;

  // Check if signature fits on current page
  const pageHeight = doc.internal.pageSize.getHeight();
  let currentSigY = sigY;
  if (sigY + 20 > pageHeight - 10) {
    doc.addPage();
    currentSigY = 30;
  }

  doc.setDrawColor(100);
  doc.setLineWidth(0.3);
  const sigLineX = pageWidth / 2 - 35;
  const sigLineEnd = pageWidth / 2 + 35;
  doc.line(sigLineX, currentSigY, sigLineEnd, currentSigY);

  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(40);
  doc.text(data.analystName, pageWidth / 2, currentSigY + 4, { align: "center" });

  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100);
  if (data.analystCrm) {
    doc.text(`CRM: ${data.analystCrm}`, pageWidth / 2, currentSigY + 8, { align: "center" });
  }
  doc.text("Assinatura Digital — Laudo emitido eletronicamente", pageWidth / 2, currentSigY + 12, { align: "center" });

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
