# Plano SaaS Multi-Tenant — LIS Dra. Dielem

## Visão Geral
Transformar o sistema LIS (Laboratory Information System) em um SaaS multi-tenant, permitindo que múltiplos laboratórios utilizem a mesma plataforma com dados isolados.

## Estratégia: Row-Level Security com `tenant_id`
Abordagem escolhida por ser a mais viável no Lovable Cloud, com bom custo-benefício.

---

## Fase 1: Infraestrutura Multi-Tenant

### 1.1 Tabela `tenants`
- id, name, slug (subdomínio), logo_url, primary_color, plan, status, created_at
- Cada laboratório = 1 tenant

### 1.2 Coluna `tenant_id` em todas as tabelas operacionais
Tabelas afetadas:
- patients, orders, results, samples, appointments
- exam_catalog, exam_parameters, parameter_reference_ranges
- insurance_plans, insurance_plan_exams, billing_batches, receivables, payables
- equipment, maintenance_schedule, certificates, pops
- qc_data, sample_nonconformities, sample_temperature_logs
- sample_tracking_events, integration_sync_logs, integrations
- lab_settings, accounting_entries, chart_of_accounts
- portal_access_logs

### 1.3 Atualizar RLS Policies
- Todas as policies devem filtrar por `tenant_id` do usuário autenticado
- Criar função `get_user_tenant_id(user_id)` como SECURITY DEFINER

### 1.4 Tabela `tenant_members`
- user_id, tenant_id, role (admin/tecnico/recepcao)
- Substitui `user_roles` com contexto de tenant

---

## Fase 2: Onboarding & Registro

### 2.1 Landing Page Comercial
- Página de vendas com planos, features, depoimentos
- Formulário de cadastro de novo laboratório

### 2.2 Fluxo de Onboarding
1. Cadastro do laboratório (nome, CNPJ, responsável)
2. Criação do usuário admin do lab
3. Configuração inicial (logo, dados, exames padrão)
4. Ativação do plano

---

## Fase 3: Billing com Stripe

### 3.1 Planos
- **Starter**: até 500 exames/mês
- **Professional**: até 2.000 exames/mês
- **Enterprise**: ilimitado

### 3.2 Integração Stripe
- Checkout de assinatura
- Webhooks para ativar/desativar tenants
- Portal de billing do cliente

---

## Fase 4: Painel Admin Global (Super Admin)

### 4.1 Dashboard
- Total de tenants, MRR, churn
- Tenants ativos/inativos
- Uso por tenant (exames, pacientes)

### 4.2 Gerenciamento
- Criar/editar/suspender tenants
- Visualizar logs de acesso
- Suporte técnico

---

## Fase 5: Branding por Tenant
- Logo personalizado
- Cores primárias
- Subdomínio (lab.seudominio.com.br)
- Landing page personalizada por lab

---

## Ordem de Implementação
1. ✅ Sistema base funcional (atual)
2. 🔲 Fase 1 — Infraestrutura multi-tenant
3. 🔲 Fase 2 — Onboarding
4. 🔲 Fase 3 — Billing
5. 🔲 Fase 4 — Super Admin
6. 🔲 Fase 5 — Branding

## Notas
- Migração dos dados atuais: o lab atual se torna o primeiro tenant
- Manter compatibilidade retroativa durante a transição
