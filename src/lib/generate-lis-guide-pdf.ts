import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const MARGIN = 15;

function checkPage(doc: jsPDF, y: number, needed: number): number {
  if (y + needed > doc.internal.pageSize.getHeight() - 20) {
    doc.addPage();
    return 20;
  }
  return y;
}

function sectionTitle(doc: jsPDF, y: number, title: string): number {
  y = checkPage(doc, y, 14);
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(30, 80, 160);
  doc.text(title, MARGIN, y);
  doc.setTextColor(0);
  return y + 7;
}

function subTitle(doc: jsPDF, y: number, title: string): number {
  y = checkPage(doc, y, 12);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(50);
  doc.text(title, MARGIN, y);
  doc.setTextColor(0);
  return y + 5;
}

function para(doc: jsPDF, y: number, text: string, indent = 0): number {
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(60);
  const maxW = doc.internal.pageSize.getWidth() - MARGIN * 2 - indent;
  const lines = doc.splitTextToSize(text, maxW);
  y = checkPage(doc, y, lines.length * 4.5);
  doc.text(lines, MARGIN + indent, y);
  doc.setTextColor(0);
  return y + lines.length * 4.5 + 2;
}

function code(doc: jsPDF, y: number, lines: string[]): number {
  const blockH = lines.length * 4 + 6;
  y = checkPage(doc, y, blockH);
  const w = doc.internal.pageSize.getWidth() - MARGIN * 2;
  doc.setFillColor(240, 240, 240);
  doc.roundedRect(MARGIN, y - 3, w, blockH, 2, 2, "F");
  doc.setFontSize(7.5);
  doc.setFont("courier", "normal");
  doc.setTextColor(40);
  let ly = y + 1;
  for (const line of lines) {
    doc.text(line, MARGIN + 3, ly, { maxWidth: w - 6 });
    ly += 4;
  }
  doc.setTextColor(0);
  return ly + 4;
}

function addFooters(doc: jsPDF) {
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(150);
    const pw = doc.internal.pageSize.getWidth();
    const ph = doc.internal.pageSize.getHeight();
    doc.text(`Página ${i} de ${totalPages}`, pw - MARGIN, ph - 8, { align: "right" });
    doc.text("UPRILIS — Guia de Integração com o LIS", MARGIN, ph - 8);
  }
}

export function generateLisIntegrationGuidePdf(baseUrl: string) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pw = doc.internal.pageSize.getWidth();
  let y = 18;

  // ══════════════════════════════════════════════════════════════════
  // COVER
  // ══════════════════════════════════════════════════════════════════
  doc.setFillColor(30, 80, 160);
  doc.rect(0, 0, pw, 50, "F");
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255);
  doc.text("Guia de Integração com o LIS", MARGIN, 25);
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text("API REST para sistemas terceiros e middleware de equipamentos", MARGIN, 34);
  doc.setFontSize(8);
  doc.text(`Gerado em: ${new Date().toLocaleDateString("pt-BR")} às ${new Date().toLocaleTimeString("pt-BR")}`, MARGIN, 44);
  doc.setTextColor(0);
  y = 60;

  // ══════════════════════════════════════════════════════════════════
  // 1. VISÃO GERAL
  // ══════════════════════════════════════════════════════════════════
  y = sectionTitle(doc, y, "1. Visão Geral");
  y = para(doc, y,
    "Este documento descreve a API REST do LIS (UPRILIS) disponível para sistemas terceiros, " +
    "middleware de interfaceamento e empresas de integração. A API permite:"
  );
  const items = [
    "• Consultar o catálogo de exames com seus códigos, setores, materiais e parâmetros técnicos",
    "• Buscar pacientes cadastrados por CPF ou nome",
    "• Consultar amostras pendentes de processamento (worklist) com dados do pedido e paciente",
    "• Consultar uma amostra específica por código de barras",
    "• Enviar resultados de análises de volta ao LIS (endpoint existente: hl7-receiver)",
  ];
  for (const item of items) {
    y = para(doc, y, item, 3);
  }
  y += 2;
  y = para(doc, y,
    "IMPORTANTE: Esta API é independente de equipamento. Os códigos de exames retornados são " +
    "os códigos do LIS, que podem ser mapeados para qualquer analisador via a tabela de parâmetros."
  );

  // ══════════════════════════════════════════════════════════════════
  // 2. AUTENTICAÇÃO
  // ══════════════════════════════════════════════════════════════════
  y = sectionTitle(doc, y, "2. Autenticação");
  y = para(doc, y,
    "Todas as requisições devem incluir o header x-middleware-key com o token fornecido pelo administrador do laboratório. " +
    "Este é o mesmo token utilizado para o endpoint hl7-receiver."
  );
  y = subTitle(doc, y, "Header obrigatório:");
  y = code(doc, y, [
    "x-middleware-key: <TOKEN_FORNECIDO_PELO_LABORATORIO>",
    "Content-Type: application/json",
  ]);
  y = para(doc, y,
    "Caso o token esteja ausente ou inválido, a API retornará HTTP 401 Unauthorized."
  );

  // ══════════════════════════════════════════════════════════════════
  // 3. BASE URL
  // ══════════════════════════════════════════════════════════════════
  y = sectionTitle(doc, y, "3. URL Base");
  y = para(doc, y, "Todos os endpoints utilizam a seguinte URL base:");
  y = code(doc, y, [
    `Consultas:  GET  ${baseUrl}/functions/v1/lis-query?action=<acao>`,
    `Resultados: POST ${baseUrl}/functions/v1/hl7-receiver`,
  ]);

  // ══════════════════════════════════════════════════════════════════
  // 4. ENDPOINTS DE CONSULTA (lis-query)
  // ══════════════════════════════════════════════════════════════════
  y = sectionTitle(doc, y, "4. Endpoints de Consulta");

  // 4.1 exam-catalog
  y = subTitle(doc, y, "4.1  GET ?action=exam-catalog");
  y = para(doc, y,
    "Retorna TODOS os exames ativos cadastrados no LIS com seus códigos, setores, materiais, métodos " +
    "e parâmetros técnicos. Use esta consulta para sincronizar os códigos do LIS com o seu sistema."
  );
  y = subTitle(doc, y, "Exemplo de requisição:");
  y = code(doc, y, [
    `GET ${baseUrl}/functions/v1/lis-query?action=exam-catalog`,
    `Header: x-middleware-key: <TOKEN>`,
  ]);
  y = subTitle(doc, y, "Exemplo de resposta:");
  y = code(doc, y, [
    '{',
    '  "exams": [',
    '    {',
    '      "code": "GLI",',
    '      "name": "Glicose",',
    '      "sector": "Bioquímica",',
    '      "material": "Sangue",',
    '      "method": "Enzimático",',
    '      "unit": "mg/dL",',
    '      "reference_range": "70 - 99",',
    '      "equipment": "MaxBIO200B",',
    '      "section_group": "",',
    '      "parameters": [',
    '        {',
    '          "name": "Glicose",',
    '          "lis_code": "GLI",',
    '          "lis_name": "Glicose",',
    '          "equip_code": "GLU",',
    '          "equip_analyte": "GLU",',
    '          "unit": "mg/dL",',
    '          "reference_range": "70 - 99",',
    '          "section": "",',
    '          "sort_order": 0',
    '        }',
    '      ]',
    '    }',
    '  ]',
    '}',
  ]);
  y = para(doc, y,
    "Nota: O campo 'parameters' contém o mapeamento entre o código do LIS (lis_code) e o código " +
    "do equipamento (equip_code). Use lis_code para identificar o analito no LIS ao enviar resultados."
  );

  // 4.2 sample-worklist
  y = sectionTitle(doc, y, ""); // page break helper
  y = subTitle(doc, y, "4.2  GET ?action=sample-worklist");
  y = para(doc, y,
    "Retorna a lista de amostras aguardando processamento, com os dados do pedido (exames solicitados) " +
    "e do paciente. Use para implementar a busca bidirecional (query do analisador ao LIS)."
  );
  y = subTitle(doc, y, "Parâmetros opcionais:");

  autoTable(doc, {
    startY: y,
    margin: { left: MARGIN, right: MARGIN },
    head: [["Parâmetro", "Tipo", "Padrão", "Descrição"]],
    body: [
      ["status", "string", "triagem", "Status das amostras (separar por vírgula: collected,triagem)"],
      ["sector", "string", "(todos)", "Filtrar por setor (ex: Bioquímica, Hematologia)"],
    ],
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [30, 80, 160], textColor: 255, fontStyle: "bold" },
  });
  y = (doc as any).lastAutoTable.finalY + 4;

  y = subTitle(doc, y, "Exemplo de requisição:");
  y = code(doc, y, [
    `GET ${baseUrl}/functions/v1/lis-query?action=sample-worklist&status=triagem&sector=Bioquímica`,
    `Header: x-middleware-key: <TOKEN>`,
  ]);
  y = subTitle(doc, y, "Exemplo de resposta:");
  y = code(doc, y, [
    '{',
    '  "samples": [',
    '    {',
    '      "barcode": "LAB20260323001",',
    '      "sample_type": "Sangue",',
    '      "sector": "Bioquímica",',
    '      "status": "triagem",',
    '      "collected_at": "2026-03-23T08:30:00Z",',
    '      "order": {',
    '        "order_number": "ORD-2026-045",',
    '        "exams": ["GLI", "URE", "CRE", "COL", "TRI"],',
    '        "doctor_name": "Dr. Silva",',
    '        "patient": {',
    '          "id": "uuid...",',
    '          "name": "João da Silva",',
    '          "cpf": "123.456.789-00",',
    '          "birth_date": "1985-06-15",',
    '          "gender": "M"',
    '        }',
    '      }',
    '    }',
    '  ]',
    '}',
  ]);

  // 4.3 patient-lookup
  y = subTitle(doc, y, "4.3  GET ?action=patient-lookup");
  y = para(doc, y,
    "Busca pacientes por CPF (exato) ou por nome (parcial). Use para validar dados do paciente " +
    "antes de processar amostras."
  );
  y = subTitle(doc, y, "Parâmetros (pelo menos um obrigatório):");
  autoTable(doc, {
    startY: y,
    margin: { left: MARGIN, right: MARGIN },
    head: [["Parâmetro", "Tipo", "Descrição"]],
    body: [
      ["cpf", "string", "CPF exato do paciente (ex: 12345678900)"],
      ["name", "string", "Busca parcial por nome (ex: João)"],
    ],
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [30, 80, 160], textColor: 255, fontStyle: "bold" },
  });
  y = (doc as any).lastAutoTable.finalY + 4;

  y = subTitle(doc, y, "Exemplo:");
  y = code(doc, y, [
    `GET ${baseUrl}/functions/v1/lis-query?action=patient-lookup&cpf=12345678900`,
  ]);

  // 4.4 sample-by-barcode
  y = subTitle(doc, y, "4.4  GET ?action=sample-by-barcode");
  y = para(doc, y,
    "Consulta uma amostra específica pelo código de barras. Retorna dados completos: " +
    "amostra, pedido (com lista de exames) e paciente."
  );
  y = subTitle(doc, y, "Parâmetro obrigatório:");
  autoTable(doc, {
    startY: y,
    margin: { left: MARGIN, right: MARGIN },
    head: [["Parâmetro", "Tipo", "Descrição"]],
    body: [
      ["barcode", "string", "Código de barras da amostra (ex: LAB20260323001)"],
    ],
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [30, 80, 160], textColor: 255, fontStyle: "bold" },
  });
  y = (doc as any).lastAutoTable.finalY + 4;

  y = subTitle(doc, y, "Exemplo de resposta:");
  y = code(doc, y, [
    '{',
    '  "barcode": "LAB20260323001",',
    '  "sample_type": "Sangue",',
    '  "sector": "Bioquímica",',
    '  "status": "triagem",',
    '  "collected_at": "2026-03-23T08:30:00Z",',
    '  "order": {',
    '    "order_number": "ORD-2026-045",',
    '    "exams": ["GLI", "URE", "CRE"],',
    '    "doctor_name": "Dr. Silva"',
    '  },',
    '  "patient": {',
    '    "name": "João da Silva",',
    '    "cpf": "123.456.789-00",',
    '    "birth_date": "1985-06-15",',
    '    "gender": "M"',
    '  }',
    '}',
  ]);

  // ══════════════════════════════════════════════════════════════════
  // 5. ENVIO DE RESULTADOS (hl7-receiver)
  // ══════════════════════════════════════════════════════════════════
  y = sectionTitle(doc, y, "5. Envio de Resultados ao LIS");
  y = para(doc, y,
    "Após o analisador processar a amostra, o middleware deve enviar os resultados de volta ao LIS " +
    "via o endpoint hl7-receiver. Este endpoint aceita um payload JSON (não HL7 puro)."
  );
  y = subTitle(doc, y, "Endpoint:");
  y = code(doc, y, [
    `POST ${baseUrl}/functions/v1/hl7-receiver`,
    `Headers:`,
    `  x-middleware-key: <TOKEN>`,
    `  Content-Type: application/json`,
  ]);
  y = subTitle(doc, y, "Payload JSON:");

  autoTable(doc, {
    startY: y,
    margin: { left: MARGIN, right: MARGIN },
    head: [["Campo", "Tipo", "Obrigatório", "Descrição"]],
    body: [
      ["barcode", "string", "Sim", "Código de barras da amostra (mesmo retornado na worklist)"],
      ["equipment_name", "string", "Sim", "Nome do equipamento que processou a amostra"],
      ["is_qc", "boolean", "Sim", "true = dado de Controle de Qualidade, false = resultado de paciente"],
      ["message_datetime", "string", "Não", "Data/hora ISO 8601 da mensagem"],
      ["patient_id", "string", "Não", "ID do paciente (opcional, o LIS identifica pela amostra)"],
      ["results", "array", "Sim", "Array de resultados (ver detalhes abaixo)"],
    ],
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [30, 80, 160], textColor: 255, fontStyle: "bold" },
  });
  y = (doc as any).lastAutoTable.finalY + 4;

  y = subTitle(doc, y, "Estrutura de cada item em results[]:");

  autoTable(doc, {
    startY: y,
    margin: { left: MARGIN, right: MARGIN },
    head: [["Campo", "Tipo", "Descrição"]],
    body: [
      ["analyte_code", "string", "Código do analito no equipamento (ex: GLU, ALT)"],
      ["analyte_name", "string", "Nome legível do analito (ex: Glicose)"],
      ["value", "string", "Valor do resultado (ex: '95.2')"],
      ["unit", "string", "Unidade de medida (ex: mg/dL)"],
      ["reference_range", "string", "Faixa de referência do equipamento (ex: '70~99')"],
      ["flag", "string", "N=Normal, H=Alto, L=Baixo, A=Anormal"],
    ],
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [30, 80, 160], textColor: 255, fontStyle: "bold" },
  });
  y = (doc as any).lastAutoTable.finalY + 4;

  y = subTitle(doc, y, "Exemplo de payload completo:");
  y = code(doc, y, [
    '{',
    '  "barcode": "LAB20260323001",',
    '  "equipment_name": "MaxBIO200B",',
    '  "is_qc": false,',
    '  "message_datetime": "2026-03-23T10:15:00Z",',
    '  "results": [',
    '    {',
    '      "analyte_code": "GLU",',
    '      "analyte_name": "Glicose",',
    '      "value": "95.2",',
    '      "unit": "mg/dL",',
    '      "reference_range": "70~99",',
    '      "flag": "N"',
    '    },',
    '    {',
    '      "analyte_code": "ALT",',
    '      "analyte_name": "ALT",',
    '      "value": "45.0",',
    '      "unit": "U/L",',
    '      "reference_range": "10~40",',
    '      "flag": "H"',
    '    }',
    '  ]',
    '}',
  ]);

  y = subTitle(doc, y, "Respostas possíveis:");
  autoTable(doc, {
    startY: y,
    margin: { left: MARGIN, right: MARGIN },
    head: [["HTTP", "Significado", "Ação"]],
    body: [
      ["200", "Resultados inseridos com sucesso", "Prosseguir para próxima amostra"],
      ["400", "Payload inválido (barcode ou results ausente)", "Corrigir payload"],
      ["401", "Token x-middleware-key inválido", "Verificar token com o administrador"],
      ["404", "Amostra não encontrada no LIS", "Verificar código de barras"],
      ["500", "Erro interno do servidor", "Reportar ao administrador do LIS"],
    ],
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [30, 80, 160], textColor: 255, fontStyle: "bold" },
  });
  y = (doc as any).lastAutoTable.finalY + 6;

  // ══════════════════════════════════════════════════════════════════
  // 6. FLUXO COMPLETO DE INTEGRAÇÃO
  // ══════════════════════════════════════════════════════════════════
  y = sectionTitle(doc, y, "6. Fluxo Completo de Integração");
  y = para(doc, y,
    "O fluxo típico de um middleware de integração com o LIS segue estes passos:"
  );

  const steps = [
    "1. SINCRONIZAR CATÁLOGO — Chamar ?action=exam-catalog para obter todos os códigos de exames do LIS. Mapear lis_code → equip_code para cada analisador configurado.",
    "2. CONSULTAR WORKLIST — Periodicamente chamar ?action=sample-worklist para obter amostras pendentes (status=triagem). Filtrar por setor se necessário.",
    "3. ENVIAR PARA O ANALISADOR — Transmitir as amostras da worklist para o equipamento via HL7/ASTM/Serial conforme protocolo do fabricante.",
    "4. RECEBER RESULTADOS DO ANALISADOR — Capturar os frames HL7/ASTM vindos do equipamento e converter para o formato JSON do LIS.",
    "5. ENVIAR RESULTADOS AO LIS — POST para /hl7-receiver com o barcode e os resultados. O LIS automaticamente atualiza o status da amostra para 'analisada'.",
    "6. VERIFICAR (OPCIONAL) — Chamar ?action=sample-by-barcode para confirmar que os resultados foram recebidos (status = 'analyzed').",
  ];
  for (const step of steps) {
    y = para(doc, y, step, 2);
  }

  // ══════════════════════════════════════════════════════════════════
  // 7. CÓDIGOS DE STATUS DAS AMOSTRAS
  // ══════════════════════════════════════════════════════════════════
  y = sectionTitle(doc, y, "7. Códigos de Status das Amostras no LIS");

  autoTable(doc, {
    startY: y,
    margin: { left: MARGIN, right: MARGIN },
    head: [["Status", "Descrição"]],
    body: [
      ["collected", "Amostra coletada, ainda não triada"],
      ["triagem", "Amostra triada, pronta para envio ao analisador"],
      ["processing", "Amostra enviada ao equipamento, aguardando resultados"],
      ["analyzed", "Resultados recebidos do equipamento"],
      ["pending", "Resultado pendente de validação técnica"],
      ["validated", "Resultado validado tecnicamente"],
      ["released", "Resultado liberado para o paciente/médico"],
    ],
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [30, 80, 160], textColor: 255, fontStyle: "bold" },
  });
  y = (doc as any).lastAutoTable.finalY + 6;

  // ══════════════════════════════════════════════════════════════════
  // 8. CONTATO
  // ══════════════════════════════════════════════════════════════════
  y = sectionTitle(doc, y, "8. Suporte");
  y = para(doc, y,
    "Para obter o token de autenticação (x-middleware-key) ou tirar dúvidas sobre a integração, " +
    "entre em contato com o administrador do laboratório."
  );

  addFooters(doc);
  doc.save("Guia_Integracao_LIS_UPRILIS.pdf");
}
