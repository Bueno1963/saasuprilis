interface Props {
  type: string;
  name: string;
}

const isMaxBio = (n: string) => /maxbio/i.test(n);
const isMaxCell = (n: string) => /maxcell/i.test(n);
const isDymind = (n: string) => /dymind/i.test(n);
const isKnownHL7 = (n: string) => isMaxBio(n) || isMaxCell(n) || isDymind(n);

const MaxBioSpecs = () => (
  <>
    <ul className="text-xs text-muted-foreground space-y-1 ml-3 list-disc">
      <li>Equipamento: <strong className="text-foreground">MaxBIO 200B — Analisador Bioquímico Automatizado</strong></li>
      <li>Protocolo: <strong className="text-foreground">MLLP sobre TCP/IP persistente</strong> — Framing: SB(0x0B) + Data + EB(0x1C) + CR(0x0D)</li>
      <li>Versão: <strong className="text-foreground">HL7 v2.3.1</strong> — Character Set: <strong className="text-foreground">UTF-8 (UNICODE)</strong></li>
      <li>Resultados/QC: <strong className="text-foreground">ORU^R01</strong> (envio) → <strong className="text-foreground">ACK^R01</strong> (confirmação)</li>
      <li>Consulta bidirecional: <strong className="text-foreground">ORM^O01</strong> (query) → <strong className="text-foreground">ORR^O02</strong> (resposta com PID/PV1/ORC/OBR/OBX)</li>
      <li>MSH-11: <strong className="text-foreground">P</strong>=Amostra/Pedido, <strong className="text-foreground">Q</strong>=QC</li>
      <li>Segmentos: MSH, MSA, PID, PV1, OBR, OBX, ORC</li>
      <li>Testes suportados: Bioquímica geral (enzimas, substratos, eletrólitos, proteínas específicas)</li>
      <li>Flags OBX-8: <strong className="text-foreground">N</strong>=Normal, <strong className="text-foreground">H</strong>=Alto, <strong className="text-foreground">L</strong>=Baixo, <strong className="text-foreground">A</strong>=Anormal</li>
      <li>ACK timeout: reconexão automática se sem resposta no tempo configurado</li>
    </ul>
    <div className="mt-3 rounded border border-border bg-background p-3 space-y-2">
      <h4 className="text-xs font-semibold text-foreground">Processo de Envio de Dados de Teste (Sending Test Data)</h4>
      <p className="text-[11px] text-muted-foreground leading-relaxed">
        O analisador bioquímico envia as informações de amostra e os resultados dos exames ao servidor LIS <strong className="text-foreground">em unidades de amostras</strong>.
        Ou seja, uma amostra e seus respectivos resultados são enviados juntos como uma única mensagem.
        Após determinar (validar) a mensagem, o servidor LIS responde com o ACK apropriado.
      </p>
      <div className="text-[11px] text-muted-foreground space-y-1">
        <p className="font-medium text-foreground">Fluxo de comunicação:</p>
        <ol className="list-decimal ml-4 space-y-0.5">
          <li>Analisador estabelece conexão TCP/IP com o servidor LIS</li>
          <li>Analisador envia mensagem <strong className="text-foreground">ORU^R01</strong> contendo segmentos MSH + PID + OBR + OBX (1 amostra + N resultados)</li>
          <li>LIS valida a mensagem e responde com <strong className="text-foreground">ACK^R01</strong> (AA=aceito, AE=erro, AR=rejeitado)</li>
          <li>Próxima amostra é enviada somente após receber o ACK da anterior</li>
        </ol>
      </div>
      <div className="text-[11px] text-muted-foreground space-y-1">
        <p className="font-medium text-foreground">Estrutura da mensagem ORU^R01:</p>
        <pre className="bg-muted rounded p-2 text-[10px] font-mono overflow-x-auto whitespace-pre">
{`MSH|^~\\&|MaxBIO200B|LAB|LIS|HOST|...|ORU^R01|...|P|2.3.1||||||UNICODE UTF-8
PID|||<patient_id>||<patient_name>||<DOB>|<sex>|...
OBR|1|<sample_barcode>||<test_code>^<test_name>||<collection_dt>|...
OBX|1|NM|<analyte_code>^<analyte_name>||<value>|<unit>|<ref_range>|<flag>|||F
OBX|2|NM|...`}
        </pre>
      </div>
    </div>
    <div className="mt-3 rounded border border-border bg-background p-3 space-y-2">
      <h4 className="text-xs font-semibold text-foreground">Processo de Envio de QC (Sending QC Data)</h4>
      <p className="text-[11px] text-muted-foreground leading-relaxed">
        O analisador bioquímico envia os resultados de controle de qualidade ao servidor LIS <strong className="text-foreground">em unidades de teste QC</strong>.
        A mensagem ORU contém os segmentos <strong className="text-foreground">MSH</strong> e <strong className="text-foreground">OBR</strong> (sem PID, pois não é paciente).
      </p>
      <div className="text-[11px] text-muted-foreground space-y-1">
        <p className="font-medium text-foreground">Exemplo de dados QC transmitidos:</p>
        <QCTable />
      </div>
      <div className="text-[11px] text-muted-foreground space-y-1">
        <p className="font-medium text-foreground">Estrutura da mensagem ORU^R01 (QC):</p>
        <pre className="bg-muted rounded p-2 text-[10px] font-mono overflow-x-auto whitespace-pre">
{`MSH|^~\\&|MaxBIO200B|LAB|LIS|HOST|20110321164643|ORU^R01|...|Q|2.3.1||||||UNICODE UTF-8
OBR|1||123|ALT^ALT||20110321164643|...
OBX|1|NM|ALT^ALT||123.232|U/L|40~1|N|||F`}
        </pre>
        <p className="text-[10px] italic">MSH-11 = <strong className="text-foreground">Q</strong> indica que a mensagem é de Controle de Qualidade.</p>
      </div>
    </div>
  </>
);

const MaxCellSpecs = () => (
  <>
    <ul className="text-xs text-muted-foreground space-y-1 ml-3 list-disc">
      <li>Equipamento: <strong className="text-foreground">MAXCELL 500D / 500F — Analisador Hematológico 5-diff</strong></li>
      <li>Protocolo: <strong className="text-foreground">MLLP sobre TCP/IP persistente</strong> — Framing: SB(0x0B) + Data + EB(0x1C) + CR(0x0D)</li>
      <li>Versão: <strong className="text-foreground">HL7 v2.3.1</strong> — Character Set: <strong className="text-foreground">UTF-8 (UNICODE)</strong></li>
      <li>Resultados/QC: <strong className="text-foreground">ORU^R01</strong> (envio) → <strong className="text-foreground">ACK^R01</strong> (confirmação)</li>
      <li>Consulta bidirecional: <strong className="text-foreground">ORM^O01</strong> (query) → <strong className="text-foreground">ORR^O02</strong> (resposta com PID/PV1/ORC/OBR/OBX)</li>
      <li>MSH-11: <strong className="text-foreground">P</strong>=Amostra/Pedido, <strong className="text-foreground">Q</strong>=QC</li>
      <li>Segmentos: MSH, MSA, PID, PV1, OBR, OBX, ORC</li>
      <li>Testes: CBC 5-diff (WBC, RBC, HGB, HCT, PLT, diferencial leucocitário completo)</li>
      <li>OBR-4 tipos: <strong className="text-foreground">01001</strong>=CBC Auto, <strong className="text-foreground">01002</strong>=Manual, <strong className="text-foreground">01003</strong>=LJ QC, <strong className="text-foreground">01004</strong>=XB QC</li>
      <li>Flags OBX-8: <strong className="text-foreground">N</strong>=Normal, <strong className="text-foreground">H</strong>=Alto, <strong className="text-foreground">L</strong>=Baixo, <strong className="text-foreground">A</strong>=Anormal (separados por ~)</li>
      <li>Suporta histogramas/scattergramas em <strong className="text-foreground">BMP/PNG Base64</strong> (OBX tipo ED)</li>
      <li>ACK timeout: reconexão automática se sem resposta no tempo configurado</li>
    </ul>
    <div className="mt-3 rounded border border-border bg-background p-3 space-y-2">
      <h4 className="text-xs font-semibold text-foreground">Dados Transmitidos — Hemograma Completo</h4>
      <p className="text-[11px] text-muted-foreground leading-relaxed">
        O analisador envia amostras com resultados de hemograma completo incluindo contagens celulares, índices eritrocitários (MCV, MCH, MCHC, RDW) e diferencial leucocitário de 5 partes (NEU, LYM, MON, EOS, BAS) com valores absolutos e percentuais.
      </p>
      <div className="text-[11px] text-muted-foreground space-y-1">
        <p className="font-medium text-foreground">Estrutura da mensagem ORU^R01:</p>
        <pre className="bg-muted rounded p-2 text-[10px] font-mono overflow-x-auto whitespace-pre">
{`MSH|^~\\&|MAXCELL500|LAB|LIS|HOST|...|ORU^R01|...|P|2.3.1||||||UNICODE UTF-8
PID|||<patient_id>||<patient_name>||<DOB>|<sex>|...
OBR|1|<sample_barcode>||01001^CBC Auto||<collection_dt>|...
OBX|1|NM|WBC^WBC||8.5|10^3/uL|4.0~10.0|N|||F
OBX|2|NM|RBC^RBC||4.8|10^6/uL|4.0~5.5|N|||F
OBX|3|NM|HGB^Hemoglobina||14.2|g/dL|12.0~16.0|N|||F
OBX|4|ED|HIST_WBC^Histograma WBC||^image^PNG^Base64^<data>|||||||F`}
        </pre>
      </div>
    </div>
  </>
);

const DymindSpecs = () => (
  <>
    <ul className="text-xs text-muted-foreground space-y-1 ml-3 list-disc">
      <li>Fabricante: <strong className="text-foreground">Dymind Biotechnology</strong> — Linha de equipamentos laboratoriais</li>
      <li>Protocolo: <strong className="text-foreground">MLLP sobre TCP/IP persistente</strong> — Framing: SB(0x0B) + Data + EB(0x1C) + CR(0x0D)</li>
      <li>Versão: <strong className="text-foreground">HL7 v2.3.1</strong> — Character Set: <strong className="text-foreground">UTF-8 (UNICODE)</strong></li>
      <li>Resultados/QC: <strong className="text-foreground">ORU^R01</strong> (envio) → <strong className="text-foreground">ACK^R01</strong> (confirmação)</li>
      <li>Consulta bidirecional: <strong className="text-foreground">ORM^O01</strong> (query) → <strong className="text-foreground">ORR^O02</strong> (resposta)</li>
      <li>MSH-11: <strong className="text-foreground">P</strong>=Amostra/Pedido, <strong className="text-foreground">Q</strong>=QC</li>
      <li>Segmentos: MSH, MSA, PID, PV1, OBR, OBX, ORC</li>
      <li>Compatível com equipamentos da linha Dymind (hematologia e bioquímica)</li>
      <li>Flags OBX-8: <strong className="text-foreground">N</strong>=Normal, <strong className="text-foreground">H</strong>=Alto, <strong className="text-foreground">L</strong>=Baixo, <strong className="text-foreground">A</strong>=Anormal</li>
      <li>ACK timeout: reconexão automática se sem resposta no tempo configurado</li>
    </ul>
  </>
);

const QCTable = () => (
  <div className="overflow-x-auto">
    <table className="w-full text-[10px] border-collapse">
      <thead>
        <tr className="border-b border-border">
          <th className="text-left py-1 px-2 font-semibold text-foreground">Campo</th>
          <th className="text-left py-1 px-2 font-semibold text-foreground">Significado</th>
          <th className="text-left py-1 px-2 font-semibold text-foreground">Valor Exemplo</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-border">
        <tr><td className="py-1 px-2">Item number</td><td className="py-1 px-2">Nº do analito</td><td className="py-1 px-2 font-mono">1</td></tr>
        <tr><td className="py-1 px-2">Item name</td><td className="py-1 px-2">Nome do analito</td><td className="py-1 px-2 font-mono">ALT</td></tr>
        <tr><td className="py-1 px-2">QC Name</td><td className="py-1 px-2">Nome do controle</td><td className="py-1 px-2 font-mono">Randox low value</td></tr>
        <tr><td className="py-1 px-2">QC batch number</td><td className="py-1 px-2">Lote do controle</td><td className="py-1 px-2 font-mono">123</td></tr>
        <tr><td className="py-1 px-2">QC times</td><td className="py-1 px-2">Nº de repetições</td><td className="py-1 px-2 font-mono">1</td></tr>
        <tr><td className="py-1 px-2">Module number</td><td className="py-1 px-2">Módulo do equipamento</td><td className="py-1 px-2 font-mono">1</td></tr>
        <tr><td className="py-1 px-2">Sample Type</td><td className="py-1 px-2">Tipo de amostra</td><td className="py-1 px-2 font-mono">serum</td></tr>
        <tr><td className="py-1 px-2">Rack / Position</td><td className="py-1 px-2">Rack e posição</td><td className="py-1 px-2 font-mono">C001, 2</td></tr>
        <tr><td className="py-1 px-2">Mean of QC</td><td className="py-1 px-2">Média esperada</td><td className="py-1 px-2 font-mono">40</td></tr>
        <tr><td className="py-1 px-2">Standard deviation</td><td className="py-1 px-2">Desvio padrão esperado</td><td className="py-1 px-2 font-mono">1</td></tr>
        <tr><td className="py-1 px-2">Measured value</td><td className="py-1 px-2">Valor medido (concentração)</td><td className="py-1 px-2 font-mono">123.232</td></tr>
        <tr><td className="py-1 px-2">Test date/time</td><td className="py-1 px-2">Data e hora do teste</td><td className="py-1 px-2 font-mono">2011.03.21 16:46:43</td></tr>
      </tbody>
    </table>
  </div>
);

const GenericHL7Specs = () => (
  <ul className="text-xs text-muted-foreground space-y-1 ml-3 list-disc">
    <li>Protocolo: <strong className="text-foreground">MLLP sobre TCP/IP</strong> — Framing: SB(0x0B) + Data + EB(0x1C) + CR(0x0D)</li>
    <li>Versão: <strong className="text-foreground">HL7 v2.3.1</strong> — Character Set: ASCII</li>
    <li>Mensagens de resultados: <strong className="text-foreground">ORU^R01</strong> (envio) → <strong className="text-foreground">ACK^R01</strong> (confirmação)</li>
    <li>Consulta de amostras: <strong className="text-foreground">QRY^Q02</strong> → <strong className="text-foreground">QCK^Q02</strong> + <strong className="text-foreground">DSR^Q03</strong> → <strong className="text-foreground">ACK^Q03</strong></li>
    <li>Segmentos: MSH, PID, OBR, OBX, MSA, ERR, QRD, QRF, QAK, DSP, DSC</li>
  </ul>
);

const IntegrationProtocolSpecs = ({ type, name }: Props) => {
  if (type === "HL7") {
    if (isMaxBio(name)) return <MaxBioSpecs />;
    if (isMaxCell(name)) return <MaxCellSpecs />;
    if (isDymind(name)) return <DymindSpecs />;
    return <GenericHL7Specs />;
  }

  if (type === "ASTM") return (
    <ul className="text-xs text-muted-foreground space-y-1 ml-3 list-disc">
      <li>Protocolo: <strong className="text-foreground">ASTM E1381/E1394</strong> ou LIS2-A2</li>
      <li>Comunicação via Serial (RS-232) ou TCP/IP</li>
    </ul>
  );

  if (type === "FHIR") return (
    <ul className="text-xs text-muted-foreground space-y-1 ml-3 list-disc">
      <li>Resources: DiagnosticReport, Observation, ServiceRequest</li>
      <li>Auth: OAuth 2.0 / SMART on FHIR</li>
    </ul>
  );

  if (type === "POCT") return (
    <ul className="text-xs text-muted-foreground space-y-1 ml-3 list-disc">
      <li>Padrão: <strong className="text-foreground">CLSI POCT1-A2</strong></li>
      <li>Camadas: Device → Access Point → LIS Gateway</li>
    </ul>
  );

  if (type === "API") return (
    <ul className="text-xs text-muted-foreground space-y-1 ml-3 list-disc">
      <li>API REST — Content-Type: application/json</li>
      <li>Métodos: GET, POST, PUT</li>
    </ul>
  );

  if (type === "Portal") return (
    <ul className="text-xs text-muted-foreground space-y-1 ml-3 list-disc">
      <li>Portal web para laudos — webhook ou polling</li>
    </ul>
  );

  return null;
};

export default IntegrationProtocolSpecs;
