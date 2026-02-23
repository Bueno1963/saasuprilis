import { mockResults } from "@/lib/mock-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import StatusBadge from "@/components/StatusBadge";
import { CheckCircle, FileText } from "lucide-react";

const Results = () => {
  const pending = mockResults.filter(r => r.status === "pending");
  const validated = mockResults.filter(r => r.status === "validated");
  const released = mockResults.filter(r => r.status === "released");

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Resultados</h1>
        <p className="text-sm text-muted-foreground">Liberação e validação de laudos laboratoriais</p>
      </div>

      {/* Pending Validation */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Pendentes de Validação ({pending.length})</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Pedido</TableHead>
                <TableHead>Paciente</TableHead>
                <TableHead>Exame</TableHead>
                <TableHead>Resultado</TableHead>
                <TableHead>Referência</TableHead>
                <TableHead>Flag</TableHead>
                <TableHead>Ação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pending.map(result => (
                <TableRow key={result.id}>
                  <TableCell className="font-mono text-sm">{result.orderId}</TableCell>
                  <TableCell>{result.patientName}</TableCell>
                  <TableCell>{result.exam}</TableCell>
                  <TableCell className="font-mono font-medium">{result.value} {result.unit}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{result.reference}</TableCell>
                  <TableCell><StatusBadge status={result.flag} /></TableCell>
                  <TableCell>
                    <Button size="sm" variant="outline" className="h-7 text-xs">
                      <CheckCircle className="w-3 h-3 mr-1" /> Validar
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Validated - Ready to Release */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Validados — Aguardando Liberação ({validated.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Pedido</TableHead>
                <TableHead>Paciente</TableHead>
                <TableHead>Exame</TableHead>
                <TableHead>Resultado</TableHead>
                <TableHead>Analista</TableHead>
                <TableHead>Ação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {validated.map(result => (
                <TableRow key={result.id}>
                  <TableCell className="font-mono text-sm">{result.orderId}</TableCell>
                  <TableCell>{result.patientName}</TableCell>
                  <TableCell>{result.exam}</TableCell>
                  <TableCell className="font-mono font-medium">{result.value} {result.unit}</TableCell>
                  <TableCell className="text-sm">{result.analystName}</TableCell>
                  <TableCell>
                    <Button size="sm" className="h-7 text-xs">
                      <FileText className="w-3 h-3 mr-1" /> Liberar Laudo
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Released */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Liberados ({released.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Pedido</TableHead>
                <TableHead>Paciente</TableHead>
                <TableHead>Exame</TableHead>
                <TableHead>Resultado</TableHead>
                <TableHead>Flag</TableHead>
                <TableHead>Liberado em</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {released.map(result => (
                <TableRow key={result.id}>
                  <TableCell className="font-mono text-sm">{result.orderId}</TableCell>
                  <TableCell>{result.patientName}</TableCell>
                  <TableCell>{result.exam}</TableCell>
                  <TableCell className="font-mono font-medium">{result.value} {result.unit}</TableCell>
                  <TableCell><StatusBadge status={result.flag} /></TableCell>
                  <TableCell className="text-sm">{result.validatedAt ? new Date(result.validatedAt).toLocaleString("pt-BR") : "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default Results;
