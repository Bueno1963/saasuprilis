import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const FieldTable = ({ fields, columns }: { fields: string[][]; columns: string[] }) => (
  <div className="overflow-x-auto">
    <Table>
      <TableHeader>
        <TableRow>
          {columns.map((col, i) => (
            <TableHead key={i} className="text-xs">{col}</TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {fields.map((row, i) => (
          <TableRow key={i}>
            {row.map((cell, j) => (
              <TableCell key={j} className={`text-xs ${j === 0 ? "font-mono font-medium" : j === columns.length - 1 ? "text-muted-foreground" : ""}`}>
                {cell}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </div>
);

const I9LISDocumentation = () => {
  return (
    <Accordion type="multiple" className="space-y-2">
      {/* ── TABELA I9LIS_CARGA ── */}
      <AccordionItem value="carga" className="border rounded-lg px-4">
        <AccordionTrigger className="hover:no-underline">
          <span className="font-semibold text-foreground">Tabela I9LIS_CARGA (temporária) — Detalhamento</span>
        </AccordionTrigger>
        <AccordionContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Populada pelo LIS e consumida pelo I9LIS Interface (verificação a cada intervalo configurado).
          </p>
          <FieldTable
            columns={["Coluna", "Tipo", "Descrição"]}
            fields={[
              ["AMOSTRA", "varchar(18) PK", "Código de barras do tubo"],
              ["ORDEM", "int PK", "Sequencial de exames no tubo"],
              ["REG_PAC", "varchar(12)", "Código do paciente no LIS"],
              ["NOME", "varchar(50)", "Nome do paciente"],
              ["IDADE", "char(7)", "Idade (não obrigatório)"],
              ["DT_NASC", "char(8)", "Data de nascimento (DDMMYYYY)"],
              ["SEXO", "char(1)", "F, M ou I"],
              ["COD_EXAME", "char(8)", "Código do exame no LIS"],
              ["COD_MATERIAL", "char(8)", "Código do material no LIS"],
              ["DATA_COLETA", "char(8)", "Data da coleta (DDMMYYYY, opcional)"],
              ["HORA_COLETA", "char(4)", "Hora da coleta (HHMM, opcional)"],
              ["PRIORIDADE", "char(1)", "N=Normal, U=Urgência"],
              ["DATA", "varchar(12)", "Data do pedido (DDMMYYYYHHMM)"],
              ["AGRUPAMENTO", "char(12)", "Código do pedido/requisição"],
            ]}
          />
          <div className="bg-muted/40 rounded p-3 text-xs text-muted-foreground">
            <strong>Fluxo:</strong> LIS popula I9LIS_CARGA → I9LIS Interface processa e apaga → Aparelho analisa amostras.
          </div>
        </AccordionContent>
      </AccordionItem>

      {/* ── TABELA I9LIS_DESCARGA ── */}
      <AccordionItem value="descarga" className="border rounded-lg px-4">
        <AccordionTrigger className="hover:no-underline">
          <span className="font-semibold text-foreground">Tabela I9LIS_DESCARGA (temporária) — Detalhamento</span>
        </AccordionTrigger>
        <AccordionContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Populada pelo I9LIS Interface com resultados de exames. O LIS deve processar e limpar periodicamente.
          </p>
          <FieldTable
            columns={["Coluna", "Tipo", "Descrição"]}
            fields={[
              ["AMOSTRA", "varchar(18) PK", "Código de barras do tubo"],
              ["ORDEM", "int PK", "Sequencial de exames no tubo"],
              ["COD_EXAME", "char(8) PK", "Código do exame no LIS"],
              ["COD_MATERIAL", "char(8) PK", "Código do material no LIS"],
              ["COD_PARAM", "char(8) PK", "Código do parâmetro no LIS"],
              ["REG_PAC", "varchar(12)", "Código do paciente no LIS"],
              ["RESULTADO", "varchar(80)", "Resultado do parâmetro"],
              ["DATA_RES", "char(8)", "Data do resultado (DDMMYYYY)"],
              ["HORA_RES", "char(4)", "Hora do resultado (HHMM)"],
              ["INSTRUMENTO", "varchar(6)", "Código do instrumento"],
            ]}
          />
          <div className="bg-muted/40 rounded p-3 text-xs text-muted-foreground">
            <strong>Fluxo:</strong> Aparelho analisa → I9LIS grava em I9LIS_DESCARGA → LIS consome e limpa.
          </div>
        </AccordionContent>
      </AccordionItem>

      {/* ── TABELAS FIXAS ── */}
      <AccordionItem value="fixas" className="border rounded-lg px-4">
        <AccordionTrigger className="hover:no-underline">
          <span className="font-semibold text-foreground">Tabelas Fixas (I9LIS_EXAMES e I9LIS_PARAMETROS)</span>
        </AccordionTrigger>
        <AccordionContent className="space-y-6">
          <div className="space-y-2">
            <h3 className="font-semibold text-foreground text-sm">I9LIS_EXAMES</h3>
            <p className="text-xs text-muted-foreground">Mantida atualizada pelo LIS com o cadastro de exames.</p>
            <FieldTable
              columns={["Coluna", "Tipo", "Descrição"]}
              fields={[
                ["COD_EXAME", "char(8) PK", "Código do exame no LIS"],
                ["COD_MATERIAL", "char(8) PK", "Código do material no LIS"],
                ["DESCR_EXAME", "varchar(80)", "Descrição do exame"],
                ["DESCR_MATERIAL", "varchar(30)", "Descrição do material"],
                ["Habilitado", "char(1) default '0'", "'0'=Desabilitado, '1'=Habilitado"],
              ]}
            />
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold text-foreground text-sm">I9LIS_PARAMETROS</h3>
            <p className="text-xs text-muted-foreground">Cadastro de parâmetros (campos) dos exames mantido pelo LIS.</p>
            <FieldTable
              columns={["Coluna", "Tipo", "Descrição"]}
              fields={[
                ["COD_EXAME", "char(8) PK", "Código do exame no LIS"],
                ["COD_MATERIAL", "char(8) PK", "Código do material no LIS"],
                ["COD_PARAM", "char(8) PK", "Código do parâmetro no LIS"],
                ["DESCR_PARAM", "varchar(80)", "Descrição do parâmetro"],
                ["TIPO", "char(1) default '0'", "'0'=Numérico, '1'=Texto"],
                ["PRECISAO", "int", "Casas decimais (tipo numérico)"],
              ]}
            />
          </div>
        </AccordionContent>
      </AccordionItem>

      {/* ── TROCA DE ARQUIVOS ── */}
      <AccordionItem value="arquivos" className="border rounded-lg px-4">
        <AccordionTrigger className="hover:no-underline">
          <span className="font-semibold text-foreground">Referência: Integração por Troca de Arquivos</span>
        </AccordionTrigger>
        <AccordionContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Método alternativo via diretório de rede com arquivos .RCB (envio) e .ENV (retorno).
          </p>

          <div className="space-y-2">
            <h3 className="font-semibold text-foreground text-sm">Envio LIS → I9LIS (Linha tipo 10 — Amostra/Exames)</h3>
            <FieldTable
              columns={["Campo", "INI", "TAM", "Formato"]}
              fields={[
                ["Tipo de linha", "1", "2", '"10"'],
                ["Amostra", "3", "18", "A"],
                ["Ordem", "21", "1", "A (opcional)"],
                ["Diluição", "22", "7", "A (opcional)"],
                ["Agrupamento", "29", "12", "A (opcional)"],
                ["Hora de coleta", "42", "4", 'A (opcional, "HHMM")'],
                ["Prioridade", "46", "1", 'A (opcional, "R" ou "U")'],
                ["Material", "47", "8", "A"],
                ["Instrumento", "55", "6", "A (opcional)"],
                ["Registro do paciente", "61", "12", "A (opcional)"],
                ["Origem", "73", "8", "A (opcional)"],
                ["Data de coleta", "81", "8", "A (opcional, aaaammdd)"],
                ["Exame 1…20", "89", "8 cada", "A (até 20 exames)"],
              ]}
            />
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold text-foreground text-sm">Retorno I9LIS → LIS (Linhas 11, 20, 21, 22)</h3>
            <div className="bg-muted/40 rounded p-3 text-xs text-muted-foreground space-y-1">
              <p><strong>Formato:</strong> nnnnnnnn.ENV (sequencial incrementado por instrumento).</p>
              <p>Um arquivo típico: 1 linha tipo "11" (paciente), 1 linha tipo "20" (amostra) e 1 a N linhas tipo "21" (resultados).</p>
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
};

export default I9LISDocumentation;
