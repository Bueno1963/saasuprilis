import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY não configurada");
    }

    const { patient_name, patient_email, scheduled_date, scheduled_time, appointment_type } = await req.json();

    if (!patient_email) {
      return new Response(
        JSON.stringify({ success: false, error: "Paciente sem e-mail cadastrado" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const typeLabels: Record<string, string> = {
      exame: "Exame",
      coleta: "Coleta",
      retorno: "Retorno",
    };

    const dateFormatted = scheduled_date
      ? new Date(scheduled_date + "T12:00:00").toLocaleDateString("pt-BR")
      : scheduled_date;

    const htmlBody = `
      <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
        <div style="background: #1e3a5f; padding: 24px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 20px;">Confirmação de Agendamento</h1>
        </div>
        <div style="padding: 32px 24px;">
          <p style="color: #334155; font-size: 15px; margin: 0 0 16px;">
            Olá <strong>${patient_name}</strong>,
          </p>
          <p style="color: #334155; font-size: 15px; margin: 0 0 24px;">
            Seu agendamento foi confirmado com sucesso. Confira os detalhes:
          </p>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
            <tr>
              <td style="padding: 10px 12px; background: #f1f5f9; border-radius: 6px 0 0 0; color: #64748b; font-size: 13px;">Data</td>
              <td style="padding: 10px 12px; background: #f1f5f9; border-radius: 0 6px 0 0; font-weight: 600; color: #1e293b; font-size: 14px;">${dateFormatted}</td>
            </tr>
            <tr>
              <td style="padding: 10px 12px; color: #64748b; font-size: 13px;">Horário</td>
              <td style="padding: 10px 12px; font-weight: 600; color: #1e293b; font-size: 14px;">${scheduled_time}</td>
            </tr>
            <tr>
              <td style="padding: 10px 12px; background: #f1f5f9; border-radius: 0 0 0 6px; color: #64748b; font-size: 13px;">Tipo</td>
              <td style="padding: 10px 12px; background: #f1f5f9; border-radius: 0 0 6px 0; font-weight: 600; color: #1e293b; font-size: 14px;">${typeLabels[appointment_type] || appointment_type}</td>
            </tr>
          </table>
          <div style="background: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; padding: 14px; margin-bottom: 16px;">
            <p style="color: #92400e; font-size: 13px; margin: 0;">
              📋 Compareça ao laboratório no horário agendado com <strong>documento de identidade</strong> e <strong>pedido médico</strong>.
            </p>
          </div>
        </div>
        <div style="background: #f8fafc; padding: 16px 24px; text-align: center; border-top: 1px solid #e2e8f0;">
          <p style="color: #94a3b8; font-size: 11px; margin: 0;">
            Este é um e-mail automático. Não responda a esta mensagem.
          </p>
        </div>
      </div>
    `;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Laboratório <onboarding@resend.dev>",
        to: [patient_email],
        subject: `Agendamento confirmado — ${dateFormatted} às ${scheduled_time}`,
        html: htmlBody,
      }),
    });

    const resData = await res.json();
    if (!res.ok) {
      console.error("Resend error:", resData);
      throw new Error(`Resend API error [${res.status}]: ${JSON.stringify(resData)}`);
    }

    return new Response(
      JSON.stringify({ success: true, email_id: resData.id }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error sending confirmation email:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ success: false, error: msg }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
