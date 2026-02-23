import { mockPatients } from "@/lib/mock-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, UserPlus } from "lucide-react";
import { useState } from "react";

const Patients = () => {
  const [search, setSearch] = useState("");
  const filtered = mockPatients.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.cpf.includes(search)
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Pacientes</h1>
          <p className="text-sm text-muted-foreground">Cadastro e consulta de pacientes</p>
        </div>
        <Button>
          <UserPlus className="w-4 h-4 mr-2" />
          Novo Paciente
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome ou CPF..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <p className="text-sm text-muted-foreground">{filtered.length} pacientes</p>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>CPF</TableHead>
                <TableHead>Nascimento</TableHead>
                <TableHead>Sexo</TableHead>
                <TableHead>Convênio</TableHead>
                <TableHead>Telefone</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(patient => (
                <TableRow key={patient.id} className="cursor-pointer hover:bg-muted/50">
                  <TableCell className="font-mono text-sm">{patient.id}</TableCell>
                  <TableCell className="font-medium">{patient.name}</TableCell>
                  <TableCell className="font-mono text-sm">{patient.cpf}</TableCell>
                  <TableCell>{new Date(patient.birthDate).toLocaleDateString("pt-BR")}</TableCell>
                  <TableCell>{patient.gender === "M" ? "Masculino" : "Feminino"}</TableCell>
                  <TableCell>{patient.insurance}</TableCell>
                  <TableCell>{patient.phone}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default Patients;
