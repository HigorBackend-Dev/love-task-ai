import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

serve(async (req) => {
  try {
    // Pega os dados do webhook
    const { type, record } = await req.json();

    if (type !== "INSERT" || !record?.email) {
      return new Response(JSON.stringify({ success: false }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing Supabase credentials");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Gera o link de confirmação usando a função nativa do Supabase
    const { data, error } = await supabase.auth.admin.generateLink({
      type: "email_change",
      email: record.email,
      options: {
        redirectTo: `http://localhost:3000/confirm-email`,
      },
    });

    if (error) {
      console.error("Error generating confirmation link:", error);
      throw error;
    }

    // Extrai o token do link
    const token = data?.properties?.email_change_token || "";
    const confirmationLink = `http://localhost:3000/confirm-email?token=${token}`;

    // Envia o e-mail via SMTP (Inbucket)
    const smtpResponse = await fetch("http://localhost:54324/api/v1/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to: record.email,
        from: "noreply@localhost",
        subject: "Confirm your email address",
        html: `
          <h2>Email Confirmation</h2>
          <p>Click the link below to confirm your email address:</p>
          <a href="${confirmationLink}">Confirm Email</a>
          <p>Or copy this link: ${confirmationLink}</p>
        `,
      }),
    });

    if (!smtpResponse.ok) {
      console.error("Failed to send email via SMTP:", smtpResponse.status);
    }

    return new Response(JSON.stringify({ success: true, email: record.email }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }
});
