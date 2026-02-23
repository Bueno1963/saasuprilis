// Mock data for the LIS system

export interface Patient {
  id: string;
  name: string;
  cpf: string;
  birthDate: string;
  gender: "M" | "F";
  phone: string;
  email: string;
  insurance: string;
}

export interface Order {
  id: string;
  patientId: string;
  patientName: string;
  doctorName: string;
  insurance: string;
  exams: string[];
  status: "registered" | "collected" | "processing" | "completed" | "released";
  createdAt: string;
  priority: "normal" | "urgent";
}

export interface Sample {
  id: string;
  barcode: string;
  orderId: string;
  patientName: string;
  type: "Sangue" | "Urina" | "Soro" | "Plasma";
  sector: "Hematologia" | "Bioquímica" | "Imunologia" | "Microbiologia";
  status: "collected" | "triaged" | "processing" | "analyzed" | "released";
  collectedAt: string;
}

export interface QCData {
  id: string;
  analyte: string;
  level: string;
  value: number;
  mean: number;
  sd: number;
  date: string;
  equipment: string;
  status: "ok" | "warning" | "fail";
}

export interface Result {
  id: string;
  orderId: string;
  patientName: string;
  exam: string;
  value: string;
  unit: string;
  reference: string;
  flag: "normal" | "high" | "low" | "critical";
  status: "pending" | "validated" | "released";
  analystName: string;
  validatedAt?: string;
}

export const mockPatients: Patient[] = [
  { id: "P001", name: "Maria Silva Santos", cpf: "123.456.789-00", birthDate: "1985-03-15", gender: "F", phone: "(11) 99876-5432", email: "maria@email.com", insurance: "Unimed" },
  { id: "P002", name: "João Carlos Oliveira", cpf: "987.654.321-00", birthDate: "1970-08-22", gender: "M", phone: "(11) 98765-4321", email: "joao@email.com", insurance: "SulAmérica" },
  { id: "P003", name: "Ana Beatriz Costa", cpf: "456.789.123-00", birthDate: "1992-11-30", gender: "F", phone: "(11) 91234-5678", email: "ana@email.com", insurance: "Bradesco Saúde" },
  { id: "P004", name: "Pedro Henrique Lima", cpf: "321.654.987-00", birthDate: "1960-01-10", gender: "M", phone: "(11) 93456-7890", email: "pedro@email.com", insurance: "Particular" },
  { id: "P005", name: "Fernanda Rodrigues", cpf: "654.321.987-00", birthDate: "1995-07-25", gender: "F", phone: "(11) 92345-6789", email: "fernanda@email.com", insurance: "Amil" },
];

export const mockOrders: Order[] = [
  { id: "ORD-2024-001", patientId: "P001", patientName: "Maria Silva Santos", doctorName: "Dr. Roberto Almeida", insurance: "Unimed", exams: ["Hemograma", "Glicose", "TSH"], status: "completed", createdAt: "2024-01-15T08:30:00", priority: "normal" },
  { id: "ORD-2024-002", patientId: "P002", patientName: "João Carlos Oliveira", doctorName: "Dra. Carla Mendes", insurance: "SulAmérica", exams: ["Hemograma", "Colesterol Total", "Triglicerídeos"], status: "processing", createdAt: "2024-01-15T09:15:00", priority: "urgent" },
  { id: "ORD-2024-003", patientId: "P003", patientName: "Ana Beatriz Costa", doctorName: "Dr. Fernando Souza", insurance: "Bradesco Saúde", exams: ["Glicose", "HbA1c", "Insulina"], status: "collected", createdAt: "2024-01-15T10:00:00", priority: "normal" },
  { id: "ORD-2024-004", patientId: "P004", patientName: "Pedro Henrique Lima", doctorName: "Dra. Patrícia Luz", insurance: "Particular", exams: ["PSA Total", "PSA Livre", "Testosterona"], status: "released", createdAt: "2024-01-14T14:20:00", priority: "normal" },
  { id: "ORD-2024-005", patientId: "P005", patientName: "Fernanda Rodrigues", doctorName: "Dr. Marcos Pereira", insurance: "Amil", exams: ["Beta-HCG", "Progesterona"], status: "registered", createdAt: "2024-01-15T11:45:00", priority: "urgent" },
];

export const mockSamples: Sample[] = [
  { id: "S001", barcode: "LAB20240115001", orderId: "ORD-2024-001", patientName: "Maria Silva Santos", type: "Sangue", sector: "Hematologia", status: "analyzed", collectedAt: "2024-01-15T08:45:00" },
  { id: "S002", barcode: "LAB20240115002", orderId: "ORD-2024-001", patientName: "Maria Silva Santos", type: "Soro", sector: "Bioquímica", status: "analyzed", collectedAt: "2024-01-15T08:45:00" },
  { id: "S003", barcode: "LAB20240115003", orderId: "ORD-2024-002", patientName: "João Carlos Oliveira", type: "Sangue", sector: "Hematologia", status: "processing", collectedAt: "2024-01-15T09:30:00" },
  { id: "S004", barcode: "LAB20240115004", orderId: "ORD-2024-003", patientName: "Ana Beatriz Costa", type: "Soro", sector: "Bioquímica", status: "triaged", collectedAt: "2024-01-15T10:15:00" },
  { id: "S005", barcode: "LAB20240115005", orderId: "ORD-2024-005", patientName: "Fernanda Rodrigues", type: "Soro", sector: "Imunologia", status: "collected", collectedAt: "2024-01-15T12:00:00" },
];

export const mockQCData: QCData[] = Array.from({ length: 20 }, (_, i) => ({
  id: `QC${i + 1}`,
  analyte: "Glicose",
  level: "Nível 1",
  value: 95 + (Math.random() - 0.5) * 12,
  mean: 95,
  sd: 3,
  date: new Date(2024, 0, i + 1).toISOString().split("T")[0],
  equipment: "Cobas c311",
  status: (Math.abs(95 + (Math.random() - 0.5) * 12 - 95) > 6 ? "fail" : Math.abs(95 + (Math.random() - 0.5) * 12 - 95) > 4 ? "warning" : "ok") as "ok" | "warning" | "fail",
}));

// Recalculate QC status properly
mockQCData.forEach(qc => {
  const deviation = Math.abs(qc.value - qc.mean);
  if (deviation > 2 * qc.sd) qc.status = "fail";
  else if (deviation > qc.sd) qc.status = "warning";
  else qc.status = "ok";
});

export const mockResults: Result[] = [
  { id: "R001", orderId: "ORD-2024-001", patientName: "Maria Silva Santos", exam: "Hemograma - Hemoglobina", value: "13.2", unit: "g/dL", reference: "12.0 - 16.0", flag: "normal", status: "released", analystName: "Dra. Luciana Ferreira", validatedAt: "2024-01-15T14:00:00" },
  { id: "R002", orderId: "ORD-2024-001", patientName: "Maria Silva Santos", exam: "Glicose", value: "142", unit: "mg/dL", reference: "70 - 99", flag: "high", status: "released", analystName: "Dra. Luciana Ferreira", validatedAt: "2024-01-15T14:05:00" },
  { id: "R003", orderId: "ORD-2024-001", patientName: "Maria Silva Santos", exam: "TSH", value: "2.8", unit: "mUI/L", reference: "0.4 - 4.0", flag: "normal", status: "validated", analystName: "Dr. André Campos" },
  { id: "R004", orderId: "ORD-2024-002", patientName: "João Carlos Oliveira", exam: "Colesterol Total", value: "245", unit: "mg/dL", reference: "< 200", flag: "high", status: "pending", analystName: "Dra. Luciana Ferreira" },
  { id: "R005", orderId: "ORD-2024-002", patientName: "João Carlos Oliveira", exam: "Triglicerídeos", value: "310", unit: "mg/dL", reference: "< 150", flag: "critical", status: "pending", analystName: "Dra. Luciana Ferreira" },
  { id: "R006", orderId: "ORD-2024-004", patientName: "Pedro Henrique Lima", exam: "PSA Total", value: "1.2", unit: "ng/mL", reference: "< 4.0", flag: "normal", status: "released", analystName: "Dr. André Campos", validatedAt: "2024-01-14T16:30:00" },
];

export const statusLabels: Record<string, string> = {
  registered: "Registrado",
  collected: "Coletado",
  triaged: "Triado",
  processing: "Em Processamento",
  analyzed: "Analisado",
  completed: "Concluído",
  released: "Liberado",
  pending: "Pendente",
  validated: "Validado",
};

export const dashboardStats = {
  totalSamplesToday: 47,
  pendingResults: 12,
  releasedToday: 35,
  urgentOrders: 3,
  equipmentOnline: 8,
  equipmentTotal: 10,
  qcPassRate: 94.2,
};
