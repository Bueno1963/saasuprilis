import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface IntegrationPdfData {
  name: string;
  type: string;
  protocol: string;
  endpointUrl: string;
  apiKeyName: string;
  status: string;
  notes: string;
}

export function generateIntegrationTechPdf(data: IntegrationPdfData) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 15;
  let y = 20;

  // Header
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("Configuração Técnica de Integração", margin, y);
  y += 8;
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100);
  doc.text(`Gerado em: ${new Date().toLocaleDateString("pt-BR")} às ${new Date().toLocaleTimeString("pt-BR")}`, margin, y);
  doc.setTextColor(0);
  y += 10;

  // Separator
  doc.setDrawColor(200);
  doc.line(margin, y, pageW - margin, y);
  y += 8;

  // General info table
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Dados da Integração", margin, y);
  y += 6;

  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    head: [["Campo", "Valor"]],
    body: [
      ["Nome", data.name || "—"],
      ["Tipo", data.type || "—"],
      ["Protocolo", data.protocol || "—"],
      ["Endpoint URL", data.endpointUrl || "—"],
      ["Secret (API Key)", data.apiKeyName || "—"],
      ["Status", data.status === "active" ? "Ativo" : "Inativo"],
      ["Observações", data.notes || "—"],
    ],
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: "bold" },
    alternateRowStyles: { fillColor: [245, 245, 245] },
    columnStyles: { 0: { fontStyle: "bold", cellWidth: 45 } },
  });

  y = (doc as any).lastAutoTable.finalY + 10;

  const isMaxBio = /maxbio/i.test(data.name);
  const isMaxCell = /maxcell/i.test(data.name);
  const isDymind = /dymind/i.test(data.name);

  if (isMaxBio) {
    y = addMaxBioSpecs(doc, y, margin, pageW);
  } else if (isMaxCell) {
    y = addMaxCellSpecs(doc, y, margin, pageW);
  } else if (isDymind) {
    y = addDymindSpecs(doc, y, margin, pageW);
  } else if (data.type === "HL7") {
    y = addGenericHL7Specs(doc, y, margin);
  } else {
    y = addGenericSpecs(doc, y, margin, data.type);
  }

  // Footer
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(`Página ${i} de ${totalPages}`, pageW - margin, doc.internal.pageSize.getHeight() - 10, { align: "right" });
    doc.text("UPRILIS — Sistema de Gestão Laboratorial", margin, doc.internal.pageSize.getHeight() - 10);
  }

  const safeName = data.name.replace(/[^a-zA-Z0-9]/g, "_");
  doc.save(`Config_Tecnica_${safeName}.pdf`);
}

function checkPageBreak(doc: jsPDF, y: number, needed: number): number {
  if (y + needed > doc.internal.pageSize.getHeight() - 20) {
    doc.addPage();
    return 20;
  }
  return y;
}

function addSectionTitle(doc: jsPDF, y: number, margin: number, title: string): number {
  y = checkPageBreak(doc, y, 15);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0);
  doc.text(title, margin, y);
  return y + 6;
}

function addBullets(doc: jsPDF, y: number, margin: number, items: string[]): number {
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(60);
  const maxW = doc.internal.pageSize.getWidth() - margin * 2 - 5;
  for (const item of items) {
    y = checkPageBreak(doc, y, 6);
    const lines = doc.splitTextToSize(`• ${item}`, maxW);
    doc.text(lines, margin + 3, y);
    y += lines.length * 4.5;
  }
  return y;
}

function addMaxBioSpecs(doc: jsPDF, y: number, margin: number, pageW: number): number {
  y = addSectionTitle(doc, y, margin, "Especificações Técnicas — MaxBIO 200B");

  const bullets = [
    "Equipamento: MaxBIO 200B — Analisador Bioquímico Automatizado",
    "Protocolo: MLLP sobre TCP/IP persistente — Framing: SB(0x0B) + Data + EB(0x1C) + CR(0x0D)",
    "Versão: HL7 v2.3.1 — Character Set: UTF-8 (UNICODE)",
    "Resultados/QC: ORU^R01 (envio) → ACK^R01 (confirmação)",
    "Consulta bidirecional: ORM^O01 (query) → ORR^O02 (resposta com PID/PV1/ORC/OBR/OBX)",
    "MSH-11: P=Amostra/Pedido, Q=QC",
    "Segmentos: MSH, MSA, PID, PV1, OBR, OBX, ORC",
    "Testes suportados: Bioquímica geral (enzimas, substratos, eletrólitos, proteínas específicas)",
    "Flags OBX-8: N=Normal, H=Alto, L=Baixo, A=Anormal",
    "ACK timeout: reconexão automática se sem resposta no tempo configurado",
  ];
  y = addBullets(doc, y, margin, bullets);
  y += 4;

  // Communication flow
  y = addSectionTitle(doc, y, margin, "Processo de Envio de Dados de Teste");
  y = checkPageBreak(doc, y, 30);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(60);
  const desc = doc.splitTextToSize(
    "O analisador bioquímico envia as informações de amostra e os resultados dos exames ao servidor LIS em unidades de amostras. Uma amostra e seus respectivos resultados são enviados juntos como uma única mensagem. Após validar a mensagem, o servidor LIS responde com o ACK apropriado.",
    pageW - margin * 2
  );
  doc.text(desc, margin, y);
  y += desc.length * 4.5 + 4;

  const flow = [
    "1. Analisador estabelece conexão TCP/IP com o servidor LIS",
    "2. Analisador envia mensagem ORU^R01 contendo segmentos MSH + PID + OBR + OBX (1 amostra + N resultados)",
    "3. LIS valida a mensagem e responde com ACK^R01 (AA=aceito, AE=erro, AR=rejeitado)",
    "4. Próxima amostra é enviada somente após receber o ACK da anterior",
  ];
  for (const step of flow) {
    y = checkPageBreak(doc, y, 6);
    const lines = doc.splitTextToSize(step, pageW - margin * 2 - 3);
    doc.text(lines, margin + 3, y);
    y += lines.length * 4.5;
  }
  y += 4;

  // ORU structure
  y = addSectionTitle(doc, y, margin, "Estrutura da Mensagem ORU^R01");
  y = checkPageBreak(doc, y, 30);
  doc.setFontSize(8);
  doc.setFont("courier", "normal");
  doc.setTextColor(40);
  const oruLines = [
    "MSH|^~\\&|MaxBIO200B|LAB|LIS|HOST|...|ORU^R01|...|P|2.3.1||||||UNICODE UTF-8",
    "PID|||<patient_id>||<patient_name>||<DOB>|<sex>|...",
    "OBR|1|<sample_barcode>||<test_code>^<test_name>||<collection_dt>|...",
    "OBX|1|NM|<analyte_code>^<analyte_name>||<value>|<unit>|<ref_range>|<flag>|||F",
    "OBX|2|NM|...",
  ];
  for (const line of oruLines) {
    y = checkPageBreak(doc, y, 5);
    doc.text(line, margin + 2, y, { maxWidth: pageW - margin * 2 - 4 });
    y += 4.5;
  }
  y += 6;

  // QC section
  y = addSectionTitle(doc, y, margin, "Processo de Envio de QC (Controle de Qualidade)");
  y = checkPageBreak(doc, y, 20);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(60);
  const qcDesc = doc.splitTextToSize(
    "O analisador envia os resultados de controle de qualidade ao servidor LIS em unidades de teste QC. A mensagem ORU contém os segmentos MSH e OBR (sem PID, pois não é paciente). MSH-11 = Q indica QC.",
    pageW - margin * 2
  );
  doc.text(qcDesc, margin, y);
  y += qcDesc.length * 4.5 + 4;

  // QC data table
  y = checkPageBreak(doc, y, 60);
  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    head: [["Campo", "Significado", "Valor Exemplo"]],
    body: [
      ["Item number", "Nº do analito", "1"],
      ["Item name", "Nome do analito", "ALT"],
      ["QC Name", "Nome do controle", "Randox low value"],
      ["QC batch number", "Lote do controle", "123"],
      ["QC times", "Nº de repetições", "1"],
      ["Module number", "Módulo do equipamento", "1"],
      ["Sample Type", "Tipo de amostra", "serum"],
      ["Rack / Position", "Rack e posição", "C001, 2"],
      ["Mean of QC", "Média esperada", "40"],
      ["Standard deviation", "Desvio padrão esperado", "1"],
      ["Measured value", "Valor medido (concentração)", "123.232"],
      ["Test date/time", "Data e hora do teste", "2011.03.21 16:46:43"],
    ],
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: "bold" },
    alternateRowStyles: { fillColor: [245, 245, 245] },
  });

  y = (doc as any).lastAutoTable.finalY + 6;

  // QC ORU structure
  y = addSectionTitle(doc, y, margin, "Estrutura da Mensagem ORU^R01 (QC)");
  y = checkPageBreak(doc, y, 25);
  doc.setFontSize(8);
  doc.setFont("courier", "normal");
  doc.setTextColor(40);
  const qcOru = [
    "MSH|^~\\&|MaxBIO200B|LAB|LIS|HOST|20110321164643|ORU^R01|...|Q|2.3.1||||||UNICODE UTF-8",
    "OBR|1||123|ALT^ALT||20110321164643|...",
    "OBX|1|NM|ALT^ALT||123.232|U/L|40~1|N|||F",
  ];
  for (const line of qcOru) {
    y = checkPageBreak(doc, y, 5);
    doc.text(line, margin + 2, y, { maxWidth: pageW - margin * 2 - 4 });
    y += 4.5;
  }

  return y + 6;
}

function addMaxCellSpecs(doc: jsPDF, y: number, margin: number, pageW: number): number {
  y = addSectionTitle(doc, y, margin, "Especificações Técnicas — MAXCELL 500D/500F");
  const bullets = [
    "Equipamento: MAXCELL 500D / 500F — Analisador Hematológico 5-diff",
    "Protocolo: MLLP sobre TCP/IP persistente — Framing: SB(0x0B) + Data + EB(0x1C) + CR(0x0D)",
    "Versão: HL7 v2.3.1 — Character Set: UTF-8 (UNICODE)",
    "Resultados/QC: ORU^R01 (envio) → ACK^R01 (confirmação)",
    "Consulta bidirecional: ORM^O01 (query) → ORR^O02 (resposta)",
    "MSH-11: P=Amostra/Pedido, Q=QC",
    "Segmentos: MSH, MSA, PID, PV1, OBR, OBX, ORC",
    "Testes: CBC 5-diff (WBC, RBC, HGB, HCT, PLT, diferencial leucocitário completo)",
    "OBR-4 tipos: 01001=CBC Auto, 01002=Manual, 01003=LJ QC, 01004=XB QC",
    "Flags OBX-8: N=Normal, H=Alto, L=Baixo, A=Anormal",
    "Suporta histogramas/scattergramas em BMP/PNG Base64 (OBX tipo ED)",
  ];
  return addBullets(doc, y, margin, bullets) + 6;
}

function addDymindSpecs(doc: jsPDF, y: number, margin: number, _pageW: number): number {
  y = addSectionTitle(doc, y, margin, "Especificações Técnicas — Dymind Biotechnology");
  const bullets = [
    "Fabricante: Dymind Biotechnology — Linha de equipamentos laboratoriais",
    "Protocolo: MLLP sobre TCP/IP persistente — Framing: SB(0x0B) + Data + EB(0x1C) + CR(0x0D)",
    "Versão: HL7 v2.3.1 — Character Set: UTF-8 (UNICODE)",
    "Resultados/QC: ORU^R01 (envio) → ACK^R01 (confirmação)",
    "Consulta bidirecional: ORM^O01 (query) → ORR^O02 (resposta)",
    "MSH-11: P=Amostra/Pedido, Q=QC",
    "Segmentos: MSH, MSA, PID, PV1, OBR, OBX, ORC",
    "Flags OBX-8: N=Normal, H=Alto, L=Baixo, A=Anormal",
  ];
  return addBullets(doc, y, margin, bullets) + 6;
}

function addGenericHL7Specs(doc: jsPDF, y: number, margin: number): number {
  y = addSectionTitle(doc, y, margin, "Especificações Técnicas — HL7 Genérico");
  const bullets = [
    "Protocolo: MLLP sobre TCP/IP — Framing: SB(0x0B) + Data + EB(0x1C) + CR(0x0D)",
    "Versão: HL7 v2.3.1 — Character Set: ASCII",
    "Mensagens de resultados: ORU^R01 (envio) → ACK^R01 (confirmação)",
    "Consulta de amostras: QRY^Q02 → QCK^Q02 + DSR^Q03 → ACK^Q03",
    "Segmentos: MSH, PID, OBR, OBX, MSA, ERR, QRD, QRF, QAK, DSP, DSC",
  ];
  return addBullets(doc, y, margin, bullets) + 6;
}

function addGenericSpecs(doc: jsPDF, y: number, margin: number, type: string): number {
  y = addSectionTitle(doc, y, margin, `Especificações Técnicas — ${type}`);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(60);
  doc.text("Consulte a documentação do fabricante para detalhes de protocolo.", margin, y);
  return y + 8;
}
