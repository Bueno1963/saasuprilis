import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { lab_name, cnpj, email, password, responsible_name } = await req.json();

    if (!lab_name || !email || !password) {
      throw new Error("Nome do laboratório, e-mail e senha são obrigatórios");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    // Generate slug from lab name
    const slug = lab_name
      .toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    // Check slug uniqueness
    const { data: existingTenant } = await adminClient
      .from("tenants")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();

    if (existingTenant) {
      throw new Error("Já existe um laboratório com esse nome. Escolha outro.");
    }

    // Check if email is already registered
    const { data: existingUsers } = await adminClient.auth.admin.listUsers();
    const emailExists = existingUsers?.users?.some((u) => u.email === email);
    if (emailExists) {
      throw new Error("Este e-mail já está cadastrado.");
    }

    // 1. Create tenant with trial status
    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 14);

    const { data: tenant, error: tenantError } = await adminClient
      .from("tenants")
      .insert({
        name: lab_name,
        slug,
        cnpj: cnpj || "",
        email,
        plan: "aprendiz",
        status: "trial",
      })
      .select("id")
      .single();

    if (tenantError) throw tenantError;

    // 2. Create admin user
    const { data: newUser, error: userError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: responsible_name || lab_name,
        tenant_id: tenant.id,
      },
    });

    if (userError) {
      // Rollback tenant creation
      await adminClient.from("tenants").delete().eq("id", tenant.id);
      throw userError;
    }

    const userId = newUser.user.id;

    // 3. Set user as admin of the tenant
    await adminClient.from("tenant_members").update({ role: "admin", tenant_id: tenant.id }).eq("user_id", userId);
    await adminClient.from("user_roles").update({ role: "admin" }).eq("user_id", userId);

    // 4. Update profile
    await adminClient.from("profiles").update({
      full_name: responsible_name || lab_name,
      role_display: "Administrador",
    }).eq("user_id", userId);

    // 5. Create initial lab_settings
    await adminClient.from("lab_settings").insert({
      tenant_id: tenant.id,
      name: lab_name,
      cnpj: cnpj || "",
      technical_responsible: responsible_name || "",
      crm_responsible: "",
    });

    return new Response(
      JSON.stringify({ success: true, tenant_id: tenant.id, user_id: userId }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
