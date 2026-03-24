import { Button } from "@/components/ui/button";
import { ArrowLeft, Cpu } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface Props { onBack: () => void; }

const I9LISSettings = ({ onBack }: Props) => {
  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack}><ArrowLeft className="h-4 w-4" /></Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Cpu className="h-6 w-6 text-primary" />
            I9LIS — Manual de Integração
          </h1>
          <p className="text-sm text-muted-foreground">Formas de integração entre o I9LIS Interface e sistemas LIS</p>
        </div>
      </div>

      <div className="bg-muted/50 rounded-lg p-4 text-sm text-muted-foreground">
        <strong className="text-foreground">Pré-requisito:</strong> Para qualquer forma de integração, deve ser fornecida a listagem completa dos exames que serão interfaceados com seus respectivos códigos de exames e campos, para que se proceda com o cadastramento dos mapeamentos dos exames do LIS no banco de dados do interfaceamento.
      </div>

      <Accordion type="multiple" className="space-y-2">
        {/* ── FORMA 1: TROCA DE ARQUIVOS ── */}
        <AccordionItem value="arquivos" className="border rounded-lg px-4">
          <AccordionTrigger className="hover:no-underline">
            <span className="font-semibold text-foreground">1. Integração por Troca de Arquivos</span>
          </AccordionTrigger>
          <AccordionContent className="space-y-6">
            <p className="text-sm text-muted-foreground">
              Será cadastrado um diretório de rede responsável pela troca dos arquivos entre os 2 sistemas em dois momentos distintos.
            </p>

            {/* ENVIO LIS → I9LIS */}
            <div className="space-y-3">
              <h3 className="font-semibold text-foreground text-sm">Envio de dados do LIS ao I9LIS Interface</h3>
              <p className="text-xs text-muted-foreground">Linha tipo 10 — Amostra/Exames</p>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Campo</TableHead>
                      <TableHead className="text-xs">INI</TableHead>
                      <TableHead className="text-xs">TAM</TableHead>
                      <TableHead className="text-xs">Formato</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {[
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
                    ].map(([campo, ini, tam, fmt], i) => (
                      <TableRow key={i}>
                        <TableCell className="text-xs font-medium">{campo}</TableCell>
                        <TableCell className="text-xs">{ini}</TableCell>
                        <TableCell className="text-xs">{tam}</TableCell>
                        <TableCell className="text-xs">{fmt}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <p className="text-xs text-muted-foreground">Linha tipo 11 — Paciente</p>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Campo</TableHead>
                      <TableHead className="text-xs">INI</TableHead>
                      <TableHead className="text-xs">TAM</TableHead>
                      <TableHead className="text-xs">Formato</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {[
                      ["Tipo de linha", "1", "2", '"11"'],
                      ["Registro do paciente", "3", "12", "A"],
                      ["Nome", "15", "50", "A"],
                      ["Idade", "65", "7", "A (opcional, aaammdd)"],
                      ["Data de nascimento", "72", "8", "A (opcional, aaaammdd)"],
                      ["Sexo", "80", "1", "A (opcional)"],
                      ["Cor", "81", "1", "A (opcional)"],
                    ].map(([campo, ini, tam, fmt], i) => (
                      <TableRow key={i}>
                        <TableCell className="text-xs font-medium">{campo}</TableCell>
                        <TableCell className="text-xs">{ini}</TableCell>
                        <TableCell className="text-xs">{tam}</TableCell>
                        <TableCell className="text-xs">{fmt}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="bg-muted/40 rounded p-3 text-xs text-muted-foreground space-y-1">
                <p><strong>Formato dos arquivos de envio:</strong> xxxxxxxx.RCB (nome livre definido pelo LIS).</p>
                <p>O vínculo entre amostra e paciente é feito pelo campo "Registro do paciente" presente nas linhas 10 e 11.</p>
              </div>
            </div>

            {/* ENVIO I9LIS → LIS */}
            <div className="space-y-3">
              <h3 className="font-semibold text-foreground text-sm">Envio de dados do I9LIS Interface ao LIS</h3>

              <p className="text-xs text-muted-foreground">Linha tipo 11 — Paciente (retorno)</p>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Campo</TableHead>
                      <TableHead className="text-xs">INI</TableHead>
                      <TableHead className="text-xs">TAM</TableHead>
                      <TableHead className="text-xs">Formato</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {[
                      ["Tipo de linha", "1", "2", '"11"'],
                      ["Registro do paciente", "3", "12", "A"],
                      ["Nome", "15", "50", "A"],
                      ["Data de nascimento", "65", "8", "A (aaaammdd)"],
                      ["Sexo", "73", "1", "A"],
                      ["Cor", "74", "1", "A"],
                    ].map(([campo, ini, tam, fmt], i) => (
                      <TableRow key={i}>
                        <TableCell className="text-xs font-medium">{campo}</TableCell>
                        <TableCell className="text-xs">{ini}</TableCell>
                        <TableCell className="text-xs">{tam}</TableCell>
                        <TableCell className="text-xs">{fmt}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <p className="text-xs text-muted-foreground">Linha tipo 20 — Amostra</p>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Campo</TableHead>
                      <TableHead className="text-xs">INI</TableHead>
                      <TableHead className="text-xs">TAM</TableHead>
                      <TableHead className="text-xs">Formato</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {[
                      ["Tipo de linha", "1", "2", '"20"'],
                      ["Amostra", "3", "18", "A"],
                      ["Diluição", "22", "7", "A"],
                      ["Agrupamento", "29", "12", "A"],
                      ["Laboratório", "41", "8", "A"],
                      ["Instrumento", "49", "6", "A"],
                      ["Registro do paciente", "55", "12", "A"],
                      ["Origem", "67", "8", "A"],
                      ["Material", "75", "8", "A"],
                      ["Rack", "83", "6", "A"],
                      ["Data de Coleta", "89", "8", "A (aaaammdd)"],
                      ["Observação", "97", "80", "A"],
                      ["Escaninho", "177", "6", "A"],
                    ].map(([campo, ini, tam, fmt], i) => (
                      <TableRow key={i}>
                        <TableCell className="text-xs font-medium">{campo}</TableCell>
                        <TableCell className="text-xs">{ini}</TableCell>
                        <TableCell className="text-xs">{tam}</TableCell>
                        <TableCell className="text-xs">{fmt}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <p className="text-xs text-muted-foreground">Linha tipo 21 — Resultado</p>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Campo</TableHead>
                      <TableHead className="text-xs">INI</TableHead>
                      <TableHead className="text-xs">TAM</TableHead>
                      <TableHead className="text-xs">Formato</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {[
                      ["Tipo de linha", "1", "2", '"21"'],
                      ["Exame (LIS)", "3", "8", "A"],
                      ["Parâmetro (LIS)", "11", "8", "A"],
                      ["Resultado", "19", "80", "A"],
                      ["Data de resultado", "217", "8", "A"],
                      ["Hora de resultado", "225", "4", "A"],
                      ["Data de liberação", "229", "8", "A"],
                      ["Hora de liberação", "237", "4", "A"],
                      ["Operador que liberou", "241", "8", "A"],
                    ].map(([campo, ini, tam, fmt], i) => (
                      <TableRow key={i}>
                        <TableCell className="text-xs font-medium">{campo}</TableCell>
                        <TableCell className="text-xs">{ini}</TableCell>
                        <TableCell className="text-xs">{tam}</TableCell>
                        <TableCell className="text-xs">{fmt}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <p className="text-xs text-muted-foreground">Linha tipo 22 — Fim de Lote</p>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Campo</TableHead>
                      <TableHead className="text-xs">INI</TableHead>
                      <TableHead className="text-xs">TAM</TableHead>
                      <TableHead className="text-xs">Formato</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell className="text-xs font-medium">Tipo de linha</TableCell>
                      <TableCell className="text-xs">1</TableCell>
                      <TableCell className="text-xs">2</TableCell>
                      <TableCell className="text-xs">"22"</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="text-xs font-medium">Total de linhas no arquivo</TableCell>
                      <TableCell className="text-xs">3</TableCell>
                      <TableCell className="text-xs">5</TableCell>
                      <TableCell className="text-xs">N</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>

              <div className="bg-muted/40 rounded p-3 text-xs text-muted-foreground space-y-1">
                <p><strong>Formato dos arquivos de retorno:</strong> nnnnnnnn.ENV (sequencial incrementado por instrumento).</p>
                <p>Um arquivo típico: 1 linha tipo "11" (paciente), 1 linha tipo "20" (amostra) e 1 a N linhas tipo "21" (resultados).</p>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* ── FORMA 2: BANCO DE DADOS ── */}
        <AccordionItem value="banco" className="border rounded-lg px-4">
          <AccordionTrigger className="hover:no-underline">
            <span className="font-semibold text-foreground">2. Integração via Banco de Dados (Tabelas Temporárias) — Recomendada</span>
          </AccordionTrigger>
          <AccordionContent className="space-y-6">
            <p className="text-sm text-muted-foreground">
              Forma mais recomendada. A empresa detentora do sistema LIS cria e fornece acesso a uma estrutura de banco de dados temporária contendo 4 tabelas (2 fixas e 2 temporárias).
            </p>

            {/* TABELA I9LIS_EXAMES */}
            <div className="space-y-2">
              <h3 className="font-semibold text-foreground text-sm">Tabela I9LIS_EXAMES (fixa)</h3>
              <p className="text-xs text-muted-foreground">Mantida atualizada pelo sistema LIS com o cadastro de exames.</p>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Coluna</TableHead>
                      <TableHead className="text-xs">Tipo</TableHead>
                      <TableHead className="text-xs">Descrição</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {[
                      ["COD_EXAME", "char(8) PK", "Código do exame no LIS"],
                      ["COD_MATERIAL", "char(8) PK", "Código do material no LIS"],
                      ["DESCR_EXAME", "varchar(80)", "Descrição do exame"],
                      ["DESCR_MATERIAL", "varchar(30)", "Descrição do material"],
                      ["Habilitado", "char(1) default '0'", "'0'=Desabilitado, '1'=Habilitado"],
                    ].map(([col, tipo, desc], i) => (
                      <TableRow key={i}>
                        <TableCell className="text-xs font-mono font-medium">{col}</TableCell>
                        <TableCell className="text-xs">{tipo}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{desc}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>

            {/* TABELA I9LIS_PARAMETROS */}
            <div className="space-y-2">
              <h3 className="font-semibold text-foreground text-sm">Tabela I9LIS_PARAMETROS (fixa)</h3>
              <p className="text-xs text-muted-foreground">Cadastro de parâmetros (campos) dos exames mantido pelo LIS.</p>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Coluna</TableHead>
                      <TableHead className="text-xs">Tipo</TableHead>
                      <TableHead className="text-xs">Descrição</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {[
                      ["COD_EXAME", "char(8) PK", "Código do exame no LIS"],
                      ["COD_MATERIAL", "char(8) PK", "Código do material no LIS"],
                      ["COD_PARAM", "char(8) PK", "Código do parâmetro no LIS"],
                      ["DESCR_PARAM", "varchar(80)", "Descrição do parâmetro"],
                      ["TIPO", "char(1) default '0'", "'0'=Numérico, '1'=Texto"],
                      ["PRECISAO", "int", "Casas decimais (tipo numérico)"],
                    ].map(([col, tipo, desc], i) => (
                      <TableRow key={i}>
                        <TableCell className="text-xs font-mono font-medium">{col}</TableCell>
                        <TableCell className="text-xs">{tipo}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{desc}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>

            {/* TABELA I9LIS_CARGA */}
            <div className="space-y-2">
              <h3 className="font-semibold text-foreground text-sm">Tabela I9LIS_CARGA (temporária)</h3>
              <p className="text-xs text-muted-foreground">Populada pelo LIS e consumida pelo I9LIS Interface (verificação a cada 1 minuto).</p>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Coluna</TableHead>
                      <TableHead className="text-xs">Tipo</TableHead>
                      <TableHead className="text-xs">Descrição</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {[
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
                    ].map(([col, tipo, desc], i) => (
                      <TableRow key={i}>
                        <TableCell className="text-xs font-mono font-medium">{col}</TableCell>
                        <TableCell className="text-xs">{tipo}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{desc}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>

            {/* TABELA I9LIS_DESCARGA */}
            <div className="space-y-2">
              <h3 className="font-semibold text-foreground text-sm">Tabela I9LIS_DESCARGA (temporária)</h3>
              <p className="text-xs text-muted-foreground">Populada pelo I9LIS Interface com resultados de exames. O LIS deve processar e limpar periodicamente.</p>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Coluna</TableHead>
                      <TableHead className="text-xs">Tipo</TableHead>
                      <TableHead className="text-xs">Descrição</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {[
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
                    ].map(([col, tipo, desc], i) => (
                      <TableRow key={i}>
                        <TableCell className="text-xs font-mono font-medium">{col}</TableCell>
                        <TableCell className="text-xs">{tipo}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{desc}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>

            <div className="bg-muted/40 rounded p-3 text-xs text-muted-foreground space-y-1">
              <p><strong>Fluxo:</strong> LIS popula I9LIS_CARGA → I9LIS Interface processa e apaga → Aparelho analisa → I9LIS Interface grava em I9LIS_DESCARGA → LIS consome e limpa.</p>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
};

export default I9LISSettings;
