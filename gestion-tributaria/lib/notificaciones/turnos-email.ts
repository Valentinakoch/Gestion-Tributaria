import "server-only";
import { enviarEmail } from "../email";

type EnviarEmailTurnoInput = {
  destinatarioEmail: string;
  destinatarioNombre: string;
  fecha: string;
  hora: string;
  motivo: string;
};


export async function enviarEmailTurno({
  destinatarioEmail,
  destinatarioNombre,
  fecha,
  hora,
  motivo,
}: EnviarEmailTurnoInput) {
  return enviarEmail({
    to: destinatarioEmail,
    fromName: "Sistema de Turnos",
    subject: "Informacion de turno",
    text: [
      `Hola ${destinatarioNombre},`,
      "",
      "Te informamos un cambio en el turno:",
      `Fecha: ${fecha}`,
      `Hora: ${hora}`,
      `Motivo: ${motivo}`,
    ].join("\n"),
    html: `
      <div style="font-family: Arial, sans-serif; color: #0f172a; line-height: 1.5;">
        <h2 style="color: #232321;">Informacion de Turno</h2>
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
}
