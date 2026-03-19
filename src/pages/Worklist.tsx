import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import StatusBadge from "@/components/StatusBadge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, MoreVertical, Pencil, Trash2, CalendarIcon, X, Printer, Send } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import SampleEditDialog from "@/components/worklist/SampleEditDialog";
import SendToEquipmentDialog from "@/components/worklist/SendToEquipmentDialog";

const Worklist = () => {
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [renamingSector, setRenamingSector] = useState("");
  const [renameValue, setRenameValue] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [editingSample, setEditingSample] = useState<any>(null);
  const [sendDialogOpen, setSendDialogOpen] = useState(false);
  const [sendDialogSector, setSendDialogSector] = useState("");
  const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined);
  const [dateTo, setDateTo] = useState<Date | undefined>(undefined);
  const queryClient = useQueryClient();

  const { data: samples = [], isLoading } = useQuery({
    queryKey: ["samples"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("samples")
        .select("*, orders(order_number, patients(name))")
        .order("collected_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: examCatalog = [] } = useQuery({
    queryKey: ["exam_catalog_sectors_worklist"],
    queryFn: async () => {
      const { data, error } = await supabase.from("exam_catalog").select("id, name, sector").eq("status", "active");
      if (error) throw error;
      return data;
    },
  });

  const sectors = [...new Set(examCatalog.map(e => e.sector).filter(Boolean))] as string[];

  const invalidateSectors = () => {
    queryClient.invalidateQueries({ queryKey: ["exam_catalog_sectors_worklist"] });
    queryClient.invalidateQueries({ queryKey: ["exam_catalog_sectors"] });
    queryClient.invalidateQueries({ queryKey: ["exam_catalog_sectors_worklist"] });
  };

  const renameSectorMutation = useMutation({
    mutationFn: async ({ oldName, newName }: { oldName: string; newName: string }) => {
      const { error } = await supabase
        .from("exam_catalog")
        .update({ sector: newName })
        .eq("sector", oldName);
      if (error) throw error;
      // Also update samples referencing this sector
      await supabase.from("samples").update({ sector: newName }).eq("sector", oldName);
    },
    onSuccess: () => {
      invalidateSectors();
      queryClient.invalidateQueries({ queryKey: ["samples"] });
      toast.success("Setor renomeado com sucesso");
      setRenameDialogOpen(false);
    },
    onError: () => toast.error("Erro ao renomear setor"),
  });

  const deleteSectorMutation = useMutation({
    mutationFn: async (sectorName: string) => {
      const { error } = await supabase
        .from("exam_catalog")
        .delete()
        .eq("sector", sectorName);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidateSectors();
      toast.success("Setor excluído com sucesso");
      setDeleteTarget(null);
    },
    onError: () => toast.error("Erro ao excluir setor"),
  });

  const handleRename = () => {
    const trimmed = renameValue.trim();
    if (!trimmed || trimmed === renamingSector) return;
    if (sectors.includes(trimmed)) {
      toast.error("Já existe um setor com este nome");
      return;
    }
    renameSectorMutation.mutate({ oldName: renamingSector, newName: trimmed });
  };

  const openRenameDialog = (sector: string) => {
    setRenamingSector(sector);
    setRenameValue(sector);
    setRenameDialogOpen(true);
  };

  // Filter samples by date range
  const filteredSamples = samples.filter(s => {
    const collected = new Date(s.collected_at);
    if (dateFrom) {
      const from = new Date(dateFrom);
      from.setHours(0, 0, 0, 0);
      if (collected < from) return false;
    }
    if (dateTo) {
      const to = new Date(dateTo);
      to.setHours(23, 59, 59, 999);
      if (collected > to) return false;
    }
    return true;
  });

  const hasDateFilter = !!dateFrom || !!dateTo;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Esteira de Produção</h1>
          <p className="text-sm text-muted-foreground">Organização de amostras por setor e equipamento</p>
        </div>
      </div>

      {/* Filtro por período */}
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-sm font-medium text-muted-foreground">Período:</span>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className={cn("w-[150px] justify-start text-left font-normal", !dateFrom && "text-muted-foreground")}>
              <CalendarIcon className="mr-2 h-3.5 w-3.5" />
              {dateFrom ? format(dateFrom, "dd/MM/yyyy") : "De"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar mode="single" selected={dateFrom} onSelect={setDateFrom} locale={ptBR} initialFocus className="p-3 pointer-events-auto" />
          </PopoverContent>
        </Popover>
        <span className="text-sm text-muted-foreground">até</span>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className={cn("w-[150px] justify-start text-left font-normal", !dateTo && "text-muted-foreground")}>
              <CalendarIcon className="mr-2 h-3.5 w-3.5" />
              {dateTo ? format(dateTo, "dd/MM/yyyy") : "Até"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar mode="single" selected={dateTo} onSelect={setDateTo} locale={ptBR} initialFocus className="p-3 pointer-events-auto" />
          </PopoverContent>
        </Popover>
        {hasDateFilter && (
          <Button variant="ghost" size="sm" onClick={() => { setDateFrom(undefined); setDateTo(undefined); }}>
            <X className="h-3.5 w-3.5 mr-1" /> Limpar
          </Button>
        )}
      </div>

      {/* Rename Dialog */}
      <Dialog open={renameDialogOpen} onOpenChange={setRenameDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Renomear Setor</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <Input
              placeholder="Novo nome do setor"
              value={renameValue}
              onChange={e => setRenameValue(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleRename()}
            />
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="ghost">Cancelar</Button>
            </DialogClose>
            <Button onClick={handleRename} disabled={renameSectorMutation.isPending || !renameValue.trim()}>
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={open => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir setor "{deleteTarget}"?</AlertDialogTitle>
            <AlertDialogDescription>
              Todos os exames cadastrados neste setor serão removidos do catálogo. Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteTarget && deleteSectorMutation.mutate(deleteTarget)}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {sectors.length === 0 ? (
        <p className="text-center py-12 text-muted-foreground">Nenhum setor cadastrado. Crie um setor para começar.</p>
      ) : (
        <Tabs defaultValue={sectors[0]}>
          <TabsList>
            {sectors.map(sector => (
              <TabsTrigger key={sector} value={sector}>{sector}</TabsTrigger>
            ))}
          </TabsList>

          {sectors.map(sector => {
            const sectorSamples = filteredSamples.filter(s => s.sector === sector);
            return (
              <TabsContent key={sector} value={sector}>
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">{sector} — {sectorSamples.length} amostras</CardTitle>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="default"
                          size="sm"
                          className="text-xs gap-1"
                          disabled={sectorSamples.length === 0}
                          onClick={() => {
                            setSendDialogSector(sector);
                            setSendDialogOpen(true);
                          }}
                        >
                          <Send className="w-3.5 h-3.5" /> Enviar para Equipamento
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs"
                          disabled={sectorSamples.length === 0}
                          onClick={() => {
                            const printWindow = window.open("", "_blank");
                            if (!printWindow) return;
                            const dateRange = dateFrom || dateTo
                              ? `Período: ${dateFrom ? format(dateFrom, "dd/MM/yyyy") : "—"} até ${dateTo ? format(dateTo, "dd/MM/yyyy") : "—"}`
                              : `Data: ${format(new Date(), "dd/MM/yyyy")}`;
                            const statusPt: Record<string, string> = {
                              collected: "Coletada", triaged: "Triada", processing: "Processando",
                              analyzed: "Analisada", released: "Liberada", rejected: "Rejeitada",
                              stored: "Armazenada", disposed: "Descartada",
                            };
                            const materialPt: Record<string, string> = {
                              Sangue: "Sangue", Urina: "Urina", Fezes: "Fezes", Soro: "Soro",
                            };
                            printWindow.document.write(`
                              <html><head><title>Esteira de Produção - ${sector}</title>
                              <style>
                                body { font-family: Arial, sans-serif; padding: 20px; }
                                h2 { margin-bottom: 4px; }
                                .sub { color: #666; font-size: 13px; margin-bottom: 16px; }
                                table { width: 100%; border-collapse: collapse; font-size: 13px; }
                                th, td { border: 1px solid #ddd; padding: 6px 10px; text-align: left; }
                                th { background: #f0f0f0; font-weight: 600; }
                                @media print { body { padding: 0; } }
                              </style></head><body>
                              <h2>Esteira de Produção — ${sector}</h2>
                              <p class="sub">${dateRange} · ${sectorSamples.length} amostra(s)</p>
                              <table>
                                <thead><tr><th>Código</th><th>Paciente</th><th>Material</th><th>Situação</th><th>Data da Coleta</th></tr></thead>
                                <tbody>
                                  ${sectorSamples.map(s => `<tr>
                                    <td>${s.barcode}</td>
                                    <td>${(s.orders as any)?.patients?.name || "—"}</td>
                                    <td>${materialPt[s.sample_type] || s.sample_type}</td>
                                    <td>${statusPt[s.status] || s.status}</td>
                                    <td>${new Date(s.collected_at).toLocaleString("pt-BR")}</td>
                                  </tr>`).join("")}
                                </tbody>
                              </table></body></html>
                            `);
                            printWindow.document.close();
                            printWindow.print();
                          }}
                        >
                          <Printer className="w-3.5 h-3.5 mr-1" /> Imprimir
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openRenameDialog(sector)}>
                              <Pencil className="w-4 h-4 mr-2" /> Renomear
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => setDeleteTarget(sector)}
                            >
                              <Trash2 className="w-4 h-4 mr-2" /> Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {isLoading ? (
                      <p className="text-center py-8 text-muted-foreground">Carregando...</p>
                    ) : sectorSamples.length === 0 ? (
                      <p className="text-sm text-muted-foreground py-8 text-center">Nenhuma amostra neste setor</p>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Código</TableHead>
                            <TableHead>Paciente</TableHead>
                            <TableHead>Material</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Coleta</TableHead>
                            <TableHead className="w-[80px]">Ações</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {sectorSamples.map(sample => (
                            <TableRow key={sample.id}>
                              <TableCell className="font-mono text-sm">{sample.barcode}</TableCell>
                              <TableCell>{(sample.orders as any)?.patients?.name}</TableCell>
                              <TableCell>{sample.sample_type}</TableCell>
                              <TableCell><StatusBadge status={sample.status} /></TableCell>
                              <TableCell className="text-sm">{new Date(sample.collected_at).toLocaleTimeString("pt-BR")}</TableCell>
                              <TableCell>
                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditingSample(sample)}>
                                  <Pencil className="h-3.5 w-3.5" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            );
          })}
        </Tabs>
      )}

      <SampleEditDialog
        open={!!editingSample}
        onOpenChange={open => !open && setEditingSample(null)}
        sample={editingSample}
        sectors={sectors}
      />
    </div>
  );
};

export default Worklist;
