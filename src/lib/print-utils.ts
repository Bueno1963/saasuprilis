// Code 128B encoding
const CODE128B_START = 104;
const CODE128_STOP = 106;
const CODE128B_OFFSET = 32;

const CODE128_PATTERNS: number[] = [
  0x6CC,0x66C,0x666,0x498,0x48C,0x44C,0x4C8,0x4C4,0x468,0x448,
  0x644,0x624,0x622,0x6A4,0x64A,0x648,0x624,0x642,0x68A,0x682,
  0x6A8,0x6A2,0x6AA,0x492,0x48A,0x488,0x512,0x50A,0x508,0x52A,
  0x522,0x528,0x54A,0x542,0x548,0x46A,0x462,0x468,0x4A6,0x4A2,
  0x4A8,0x462,0x446,0x44A,0x4CA,0x4C2,0x4C8,0x526,0x516,0x51A,
  0x536,0x532,0x538,0x562,0x566,0x568,0x592,0x596,0x598,0x5B2,
  0x5A6,0x5A8,0x5AA,0x6B4,0x674,0x672,0x764,0x734,0x732,0x6B2,
  0x6D4,0x6D2,0x6DA,0x4BA,0x4B6,0x5B4,0x5BA,0x4DA,0x4D6,0x5D4,
  0x5DA,0x6D6,0x6BA,0x6B6,0x56E,0x5AE,0x5E6,0x5EA,0x6AE,0x6E6,
  0x6EA,0x636,0x63A,0x66E,0x676,0x67A,0x6CE,0x6D6,0x6E2,0x6DE,
  0x746,0x726,0x72A,0x74A,0x742,0x748,0x762
];

function encodeCode128B(text: string): string {
  // Use a well-known encoding table approach via canvas for reliability
  const values: number[] = [CODE128B_START];
  for (let i = 0; i < text.length; i++) {
    values.push(text.charCodeAt(i) - CODE128B_OFFSET);
  }
  // checksum
  let checksum = values[0];
  for (let i = 1; i < values.length; i++) {
    checksum += values[i] * i;
  }
  values.push(checksum % 103);
  values.push(CODE128_STOP);
  return values.map(v => v.toString()).join(",");
}

function generateCode128SVG(text: string, width = 280, height = 50): string {
  // Generate barcode using canvas-free SVG approach with proper Code 128B
  const encoded = encodeCode128BBars(text);
  const barWidth = width / encoded.length;
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`;
  for (let i = 0; i < encoded.length; i++) {
    if (encoded[i] === '1') {
      svg += `<rect x="${i * barWidth}" y="0" width="${barWidth}" height="${height}" fill="black"/>`;
    }
  }
  svg += `</svg>`;
  return svg;
}

function encodeCode128BBars(text: string): string {
  // Code 128B bar patterns (each symbol = 11 modules, stop = 13)
  const PATTERNS = [
    "11011001100","11001101100","11001100110","10010011000","10010001100",
    "10001001100","10011001000","10011000100","10001100100","11001001000",
    "11001000100","11000100100","10110011100","10011011100","10011001110",
    "10111001100","10011101100","10011100110","11001110010","11001011100",
    "11001001110","11011100100","11001110100","11101101110","11101001100",
    "11100101100","11100100110","11101100100","11100110100","11100110010",
    "11011011000","11011000110","11000110110","10100011000","10001011000",
    "10001000110","10110001000","10001101000","10001100010","11010001000",
    "11000101000","11000100010","10110111000","10110001110","10001101110",
    "10111011000","10111000110","10001110110","11101110110","11010001110",
    "11000101110","11011101000","11011100010","11011101110","11101011000",
    "11101000110","11100010110","11101101000","11101100010","11100011010",
    "11101111010","11001000010","11110001010","10100110000","10100001100",
    "10010110000","10010000110","10000101100","10000100110","10110010000",
    "10110000100","10011010000","10011000010","10000110100","10000110010",
    "11000010010","11001010000","11110111010","11000010100","10001111010",
    "10100111100","10010111100","10010011110","10111100100","10011110100",
    "10011110010","11110100100","11110010100","11110010010","11011011110",
    "11011110110","11110110110","10101111000","10100011110","10001011110",
    "10111101000","10111100010","11110101000","11110100010","10111011110",
    "10111101110","11101011110","11110101110","11010000100","11010010000",
    "11010011100","1100011101011"
  ];

  const values: number[] = [104]; // Start B
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i) - 32;
    if (code >= 0 && code < 95) values.push(code);
  }
  let checksum = values[0];
  for (let i = 1; i < values.length; i++) {
    checksum += values[i] * i;
  }
  values.push(checksum % 103);
  values.push(106); // Stop

  return values.map(v => PATTERNS[v]).join("");
}

export function printEtiquetaColeta(patient: { name: string; id: string }, exams: string[] = []) {
  const win = window.open("", "_blank", "width=450,height=350");
  if (!win) return;
  const now = new Date().toLocaleString("pt-BR");
  const barcodeText = patient.id.slice(0, 16).toUpperCase();
  const barcodeSVG = generateCode128SVG(barcodeText, 260, 45);

  win.document.write(`
    <html><head><title>Etiqueta Coleta</title>
    <style>
      @media print { @page { margin: 2mm; } body { margin: 0; } }
      body { font-family: Arial, sans-serif; padding: 6px; width: 320px; }
      .label { border: 1px dashed #aaa; padding: 8px; }
      .name { font-weight: bold; font-size: 13px; margin-bottom: 4px; }
      .exams { font-size: 10px; color: #333; margin-bottom: 4px; word-break: break-word; }
      .datetime { font-size: 10px; color: #555; margin-bottom: 6px; }
      .barcode-area { text-align: center; margin-top: 4px; }
      .barcode-text { font-family: monospace; font-size: 10px; letter-spacing: 1px; color: #333; margin-top: 2px; }
    </style></head><body>
    <div class="label">
      <div class="name">${patient.name}</div>
      <div class="exams"><strong>Exames:</strong> ${exams.length > 0 ? exams.join(", ") : "—"}</div>
      <div class="datetime">${now}</div>
      <div class="barcode-area">
        ${barcodeSVG}
        <div class="barcode-text">${barcodeText}</div>
      </div>
    </div>
    <script>window.print(); window.onafterprint = () => window.close();<\/script>
    </body></html>
  `);
  win.document.close();
}

export function printAtendimento(patient: { name: string; cpf: string; birth_date: string; gender: string; phone?: string | null; email?: string | null; insurance?: string | null; id: string }) {
  const win = window.open("", "_blank", "width=600,height=500");
  if (!win) return;
  const birthFormatted = new Date(patient.birth_date).toLocaleDateString("pt-BR");
  win.document.write(`
    <html><head><title>Comprovante de Atendimento</title>
    <style>
      @media print { body { margin: 20px; } }
      body { font-family: Arial, sans-serif; padding: 20px; max-width: 500px; }
      h2 { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #333; padding-bottom: 10px; }
      .row { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #eee; font-size: 13px; }
      .row .label { font-weight: bold; color: #555; }
      .footer { margin-top: 20px; font-size: 11px; color: #888; text-align: center; }
    </style></head><body>
    <h2>Comprovante de Atendimento</h2>
    <div class="row"><span class="label">Paciente:</span><span>${patient.name}</span></div>
    <div class="row"><span class="label">CPF:</span><span>${patient.cpf}</span></div>
    <div class="row"><span class="label">Nascimento:</span><span>${birthFormatted}</span></div>
    <div class="row"><span class="label">Sexo:</span><span>${patient.gender === "M" ? "Masculino" : "Feminino"}</span></div>
    <div class="row"><span class="label">Convênio:</span><span>${patient.insurance || "Particular"}</span></div>
    <div class="row"><span class="label">Telefone:</span><span>${patient.phone || "-"}</span></div>
    <div class="row"><span class="label">Email:</span><span>${patient.email || "-"}</span></div>
    <div class="row"><span class="label">Data/Hora:</span><span>${new Date().toLocaleString("pt-BR")}</span></div>
    <div class="footer">ID: ${patient.id}</div>
    <script>window.print(); window.onafterprint = () => window.close();<\/script>
    </body></html>
  `);
  win.document.close();
}

export function printProtocoloAcesso(order: { order_number: string; created_at: string }, patient: { name: string; birth_date: string }, portalUrl: string) {
  const win = window.open("", "_blank", "width=600,height=700");
  if (!win) return;
  const birthFormatted = new Date(patient.birth_date).toLocaleDateString("pt-BR");
  const dateFormatted = new Date(order.created_at).toLocaleDateString("pt-BR");
  const timeFormatted = new Date(order.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

  win.document.write(`
    <html><head><title>Protocolo de Acesso - Resultados Online</title>
    <style>
      @media print { body { margin: 20px; } @page { margin: 15mm; } }
      body { font-family: Arial, sans-serif; padding: 24px; max-width: 520px; margin: 0 auto; color: #222; }
      .header { text-align: center; border-bottom: 3px solid #1a56db; padding-bottom: 16px; margin-bottom: 20px; }
      .header h1 { font-size: 18px; margin: 0 0 4px; color: #1a56db; }
      .header p { font-size: 12px; color: #666; margin: 0; }
      .info-box { background: #f0f5ff; border: 1px solid #c6d9f7; border-radius: 8px; padding: 16px; margin-bottom: 20px; }
      .info-row { display: flex; justify-content: space-between; padding: 5px 0; font-size: 13px; }
      .info-row .lbl { font-weight: bold; color: #555; }
      .credentials { background: #fff; border: 2px dashed #1a56db; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center; }
      .credentials h3 { font-size: 14px; color: #1a56db; margin: 0 0 12px; text-transform: uppercase; letter-spacing: 1px; }
      .credential-item { margin: 10px 0; }
      .credential-item .label { font-size: 11px; color: #888; text-transform: uppercase; letter-spacing: 0.5px; }
      .credential-item .value { font-size: 20px; font-weight: bold; font-family: monospace; color: #1a56db; letter-spacing: 2px; margin-top: 2px; }
      .credential-item .value.date { font-size: 16px; color: #333; }
      .instructions { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin: 20px 0; }
      .instructions h3 { font-size: 13px; margin: 0 0 10px; color: #333; }
      .instructions ol { margin: 0; padding-left: 20px; font-size: 12px; line-height: 1.8; color: #555; }
      .instructions .url { font-family: monospace; font-weight: bold; color: #1a56db; font-size: 13px; word-break: break-all; }
      .note { font-size: 11px; color: #999; text-align: center; margin-top: 20px; padding-top: 16px; border-top: 1px solid #e5e7eb; }
      .cut-line { border-top: 1px dashed #ccc; margin: 24px 0; position: relative; }
      .cut-line::before { content: "✂"; position: absolute; top: -10px; left: -5px; color: #ccc; font-size: 14px; }
    </style></head><body>
    <div class="header">
      <h1>🔬 Protocolo de Acesso</h1>
      <p>Resultados de Exames Online</p>
    </div>

    <div class="info-box">
      <div class="info-row"><span class="lbl">Paciente:</span><span>${patient.name}</span></div>
      <div class="info-row"><span class="lbl">Pedido:</span><span>${order.order_number}</span></div>
      <div class="info-row"><span class="lbl">Data do Atendimento:</span><span>${dateFormatted} às ${timeFormatted}</span></div>
    </div>

    <div class="credentials">
      <h3>🔑 Dados para Acesso</h3>
      <div class="credential-item">
        <div class="label">Número do Pedido</div>
        <div class="value">${order.order_number}</div>
      </div>
      <div class="credential-item">
        <div class="label">Data de Nascimento</div>
        <div class="value date">${birthFormatted}</div>
      </div>
    </div>

    <div class="instructions">
      <h3>📋 Como acessar seus resultados:</h3>
      <ol>
        <li>Acesse o endereço: <span class="url">${portalUrl}</span></li>
        <li>Na aba <strong>"Resultados"</strong>, informe o <strong>Número do Pedido</strong> acima</li>
        <li>Informe sua <strong>Data de Nascimento</strong></li>
        <li>Clique em <strong>"Consultar Resultados"</strong></li>
      </ol>
    </div>

    <div class="note">
      <p>⏳ Os resultados estarão disponíveis após a liberação pelo laboratório.</p>
      <p>🔒 Seus dados são protegidos conforme a Lei Geral de Proteção de Dados (LGPD).</p>
      <p style="margin-top:8px;">Dúvidas? Entre em contato com o laboratório.</p>
    </div>

    <div class="cut-line"></div>

    <div style="text-align:center; font-size:11px; color:#aaa;">
      Protocolo gerado em ${new Date().toLocaleString("pt-BR")}
    </div>

    <script>window.print(); window.onafterprint = () => window.close();<\/script>
    </body></html>
  `);
  win.document.close();
}
