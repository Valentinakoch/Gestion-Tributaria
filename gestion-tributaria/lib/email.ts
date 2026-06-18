import "server-only";
import nodemailer from "nodemailer";

type EnviarEmailInput = {
  to: string;
  subject: string;
  text: string;
  html: string;
  replyTo?: string | null;
  fromName?: string;
};

function getTransporter() {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD?.replace(/\s/g, "");

  if (!user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user,
      pass,
    },
  });
}

export async function enviarEmail({
  to,
  subject,
  text,
  html,
  replyTo,
  fromName = "Sistema Contable",
}: EnviarEmailInput) {
  const transporter = getTransporter();
  const user = process.env.GMAIL_USER;

  if (!transporter || !user) {
    return { enviado: false, error: "Credenciales de email no configuradas." };
  }

  await transporter.sendMail({
    from: `"${fromName}" <${user}>`,
    to,
    replyTo: replyTo || undefined,
    subject,
    text,
    html,
  });

  return { enviado: true };
}
