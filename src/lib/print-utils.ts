export function printEtiquetaColeta(patient: { name: string; cpf: string; birth_date: string; id: string }) {
  const win = window.open("", "_blank", "width=400,height=300");
  if (!win) return;
  const birthFormatted = new Date(patient.birth_date).toLocaleDateString("pt-BR");
  win.document.write(`
    <html><head><title>Etiqueta Coleta</title>
    <style>
      @media print { body { margin: 0; } }
      body { font-family: Arial, sans-serif; padding: 8px; width: 300px; }
      .label { border: 1px dashed #999; padding: 10px; margin-bottom: 8px; }
      .name { font-weight: bold; font-size: 14px; margin-bottom: 4px; }
      .info { font-size: 11px; color: #333; margin-bottom: 2px; }
      .barcode { font-family: monospace; font-size: 16px; letter-spacing: 2px; margin-top: 6px; }
      .date { font-size: 10px; color: #666; margin-top: 4px; }
    </style></head><body>
    <div class="label">
      <div class="name">${patient.name}</div>
      <div class="info">CPF: ${patient.cpf}</div>
      <div class="info">Nasc: ${birthFormatted}</div>
      <div class="barcode">${patient.id.slice(0, 12).toUpperCase()}</div>
      <div class="date">Coleta: ${new Date().toLocaleString("pt-BR")}</div>
    </div>
    <script>window.print(); window.onafterprint = () => window.close();</script>
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
    <script>window.print(); window.onafterprint = () => window.close();</script>
    </body></html>
  `);
  win.document.close();
}
