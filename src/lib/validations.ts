import { z } from "zod";

// CPF validation
const cpfRegex = /^\d{3}\.\d{3}\.\d{3}-\d{2}$/;
const phoneRegex = /^\(\d{2}\)\s?\d{4,5}-\d{4}$/;

function isValidCPF(cpf: string): boolean {
  const digits = cpf.replace(/\D/g, "");
  if (digits.length !== 11 || /^(\d)\1+$/.test(digits)) return false;
  let sum = 0;
  for (let i = 0; i < 9; i++) sum += parseInt(digits[i]) * (10 - i);
  let rest = (sum * 10) % 11;
  if (rest === 10) rest = 0;
  if (rest !== parseInt(digits[9])) return false;
  sum = 0;
  for (let i = 0; i < 10; i++) sum += parseInt(digits[i]) * (11 - i);
  rest = (sum * 10) % 11;
  if (rest === 10) rest = 0;
  return rest === parseInt(digits[10]);
}

export const patientSchema = z.object({
  name: z.string().trim().min(3, "Nome deve ter pelo menos 3 caracteres").max(100, "Nome muito longo"),
  cpf: z
    .string()
    .regex(cpfRegex, "CPF deve estar no formato 000.000.000-00")
    .refine(isValidCPF, "CPF inválido"),
  birth_date: z.string().min(1, "Data de nascimento é obrigatória").refine((val) => {
    const d = new Date(val);
    return d <= new Date() && d >= new Date("1900-01-01");
  }, "Data inválida"),
  gender: z.enum(["M", "F"], { required_error: "Selecione o sexo" }),
  phone: z
    .string()
    .optional()
    .refine((val) => !val || phoneRegex.test(val), "Formato: (00) 00000-0000"),
  email: z
    .string()
    .optional()
    .refine((val) => !val || z.string().email().safeParse(val).success, "Email inválido"),
  insurance: z.string().max(100).default("Particular"),
  address: z.string().max(200).optional().default(""),
  city: z.string().max(100).optional().default(""),
  state: z.string().max(2).optional().default(""),
  zip_code: z.string().max(10).optional().default(""),
});

export type PatientFormData = z.infer<typeof patientSchema>;

export const orderSchema = z.object({
  patient_id: z.string().uuid("Selecione um paciente"),
  doctor_name: z.string().trim().min(2, "Nome do médico é obrigatório").max(100, "Nome muito longo"),
  insurance: z.string().max(100).default("Particular"),
  exams: z.array(z.string()).min(1, "Adicione pelo menos um exame"),
  priority: z.enum(["normal", "urgent"]).default("normal"),
});

export type OrderFormData = z.infer<typeof orderSchema>;

// Formatting helpers
export function formatCPF(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

export function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 2) return digits.length ? `(${digits}` : "";
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

export function formatCEP(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 5) return digits;
  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
}
