import "server-only";
import nodemailer from "nodemailer";

type EnviarEmailLiquidacionInput = {
  clienteEmail: string;
  clienteNombre: string;
  contadorEmail?: string | null;
  impuesto: string;
  monto: number;
  periodo: string;
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

export async function enviarEmailLiquidacion({
  clienteEmail,
  clienteNombre,
  contadorEmail,
  impuesto,
  monto,
  periodo,
}: EnviarEmailLiquidacionInput) {
  const transporter = getTransporter();
  const user = process.env.GMAIL_USER;

  if (!transporter || !user) {
    return { enviado: false, error: "Credenciales de email no configuradas." };
  }

  const montoFormateado = monto.toLocaleString("es-AR", {
    style: "currency",
    currency: "ARS",
  });

  await transporter.sendMail({
    from: `"Sistema Tributario" <${user}>`,
    to: clienteEmail,
    replyTo: contadorEmail || undefined,
    subject: "Nueva liquidación disponible",
    text: [
      `Hola ${clienteNombre},`,
      "",
      `Tenés una nueva liquidación disponible.`,
      `Impuesto: ${impuesto}`,
      `Período: ${periodo}`,
      `Monto: ${montoFormateado}`,
      "",
      "Ingresá al sistema para revisar el detalle.",
    ].join("\n"),
    html: `
      <div style="font-family: Arial, sans-serif; color: #0f172a; line-height: 1.5;">
        <h2 style="margin-bottom: 8px;">Nueva liquidación disponible</h2>
        <p>Hola ${clienteNombre},</p>
        <p>Tenés una nueva liquidación disponible en el sistema.</p>
        <table style="border-collapse: collapse; margin-top: 12px;">
          <tr>
            <td style="padding: 4px 12px 4px 0; color: #64748b;">Impuesto</td>
            <td style="padding: 4px 0; font-weight: 600;">${impuesto}</td>
          </tr>
          <tr>
            <td style="padding: 4px 12px 4px 0; color: #64748b;">Período</td>
            <td style="padding: 4px 0; font-weight: 600;">${periodo}</td>
          </tr>
          <tr>
            <td style="padding: 4px 12px 4px 0; color: #64748b;">Monto</td>
            <td style="padding: 4px 0; font-weight: 600;">${montoFormateado}</td>
          </tr>
        </table>
        <p style="margin-top: 16px;">Ingresá al sistema para revisar el detalle.</p>
      </div>
    `,
  });

  return { enviado: true };
}


type EnviarEmailTurnoInput = {
  destinatarioEmail: string;
  destinatarioNombre: string;
  fecha: string;
  hora: string;
  motivo: string; // Ej: "El administrador ha cancelado el turno" o "El cliente ha cancelado el turno"
};

export async function enviarEmailTurno({
  destinatarioEmail,
  destinatarioNombre,
  fecha,
  hora,
  motivo,
}: EnviarEmailTurnoInput) {
  const transporter = getTransporter();
  const user = process.env.GMAIL_USER;

  if (!transporter || !user) {
    return { enviado: false, error: "Credenciales de email no configuradas." };
  }

  const asunto = "Información de turno";

  await transporter.sendMail({
    from: `"Sistema de Turnos" <${user}>`,
    to: destinatarioEmail,
    subject: asunto,
    text: `Hola ${destinatarioNombre},\n\nTe informamos cambio en el turno:\nFecha: ${fecha}\nHora: ${hora}\nMotivo: ${motivo}`,
    html: `
      <div style="font-family: Arial, sans-serif; color: #0f172a; line-height: 1.5;">
        <h2 style="color: #232321;">Información de Turno</h2>
        <p>Hola <strong>${destinatarioNombre}</strong>,</p>
        <p>Te notificamos acerca del siguiente turno:</p>
        <table style="border-collapse: collapse; margin-top: 12px;">
          <tr>
            <td style="padding: 4px 12px 4px 0; color: #64748b;">Fecha:</td>
            <td style="padding: 4px 0; font-weight: 600;">${fecha}</td>
          </tr>
          <tr>
            <td style="padding: 4px 12px 4px 0; color: #64748b;">Hora:</td>
            <td style="padding: 4px 0; font-weight: 600;">${hora}</td>
          </tr>
          <tr>
            <td style="padding: 4px 12px 4px 0; color: #64748b;">Detalle:</td>
            <td style="padding: 4px 0; color: #dc2626;">${motivo}</td>
          </tr>
        </table>
      </div>
    `,
  });

  return { enviado: true };
}