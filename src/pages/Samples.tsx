import { mockSamples } from "@/lib/mock-data";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import StatusBadge from "@/components/StatusBadge";
import { Search, Barcode } from "lucide-react";
import { useState } from "react";

const Samples = () => {
  const [search, setSearch] = useState("");
  const filtered = mockSamples.filter(s =>
    s.patientName.toLowerCase().includes(search.toLowerCase()) ||
    s.barcode.includes(search)
  );

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Amostras</h1>
        <p className="text-sm text-muted-foreground">Rastreamento e triagem de amostras biológicas</p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Buscar por código de barras ou paciente..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código de Barras</TableHead>
                <TableHead>Pedido</TableHead>
                <TableHead>Paciente</TableHead>
                <TableHead>Material</TableHead>
                <TableHead>Setor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Coleta</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(sample => (
                <TableRow key={sample.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Barcode className="w-4 h-4 text-muted-foreground" />
                      <span className="font-mono text-sm">{sample.barcode}</span>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-sm">{sample.orderId}</TableCell>
                  <TableCell>{sample.patientName}</TableCell>
                  <TableCell className="text-sm">{sample.type}</TableCell>
                  <TableCell className="text-sm">{sample.sector}</TableCell>
                  <TableCell><StatusBadge status={sample.status} /></TableCell>
                  <TableCell className="text-sm">{new Date(sample.collectedAt).toLocaleString("pt-BR")}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default Samples;
