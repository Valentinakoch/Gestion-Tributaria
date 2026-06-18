import "server-only";
import { enviarEmail } from "../email";
import { db } from "../prisma";

type NotificarLiquidacionCreadaInput = {
  numeroBoleta: number;
  clerkUserId: string;
};

type EnviarEmailLiquidacionInput = {
  clienteEmail: string;
  clienteNombre: string;
  contadorEmail?: string | null;
  impuesto: string;
  monto: number;
  periodo: string;
};

async function enviarEmailLiquidacion({
  clienteEmail,
  clienteNombre,
  contadorEmail,
  impuesto,
  monto,
  periodo,
}: EnviarEmailLiquidacionInput) {
  const montoFormateado = monto.toLocaleString("es-AR", {
    style: "currency",
    currency: "ARS",
  });

  return enviarEmail({
    to: clienteEmail,
    replyTo: contadorEmail,
    subject: "Nueva liquidacion disponible",
    text: [
      `Hola ${clienteNombre},`,
      "",
      "Tenes una nueva liquidacion disponible.",
      `Impuesto: ${impuesto}`,
      `Periodo: ${periodo}`,
      `Monto: ${montoFormateado}`,
      "",
      "Ingresa al sistema para revisar el detalle.",
    ].join("\n"),
    html: `
      <div style="font-family: Arial, sans-serif; color: #0f172a; line-height: 1.5;">
        <h2 style="margin-bottom: 8px;">Nueva liquidacion disponible</h2>
        <p>Hola ${clienteNombre},</p>
        <p>Tenes una nueva liquidacion disponible en el sistema.</p>
        <table style="border-collapse: collapse; margin-top: 12px;">
          <tr>
            <td style="padding: 4px 12px 4px 0; color: #64748b;">Impuesto</td>
            <td style="padding: 4px 0; font-weight: 600;">${impuesto}</td>
          </tr>
          <tr>
            <td style="padding: 4px 12px 4px 0; color: #64748b;">Periodo</td>
            <td style="padding: 4px 0; font-weight: 600;">${periodo}</td>
          </tr>
          <tr>
            <td style="padding: 4px 12px 4px 0; color: #64748b;">Monto</td>
            <td style="padding: 4px 0; font-weight: 600;">${montoFormateado}</td>
          </tr>
        </table>
        <p style="margin-top: 16px;">Ingresa al sistema para revisar el detalle.</p>
      </div>
    `,
  });
}

export async function notificarLiquidacionCreada({
  numeroBoleta,
  clerkUserId,
}: NotificarLiquidacionCreadaInput) {
  const contador = await db.contador.findFirst({
    where: { clerk_id: clerkUserId },
    select: { cuil: true, id_estudio: true, email: true },
  });

  if (!contador) {
    return { enviado: false, error: "No autorizado para enviar notificaciones." };
  }

  const liquidacion = await db.liquidacion.findUnique({
    where: { numero_boleta: numeroBoleta },
    include: {
      cliente: {
        select: {
          cuil: true,
          id_estudio: true,
          nombre: true,
          apellido: true,
          email: true,
        },
      },
      impuesto: { select: { formato: true } },
    },
  });

  if (!liquidacion?.cliente) {
    return { enviado: false, error: "Liquidación sin cliente asociado." };
  }

  if (liquidacion.cliente.id_estudio !== contador.id_estudio) {
    return { enviado: false, error: "La liquidación no pertenece al estudio." };
  }

  if (!liquidacion.cliente.email) {
    return { enviado: false, error: "El cliente no tiene email registrado." };
  }

  const fechaReferencia = liquidacion.periodo_fiscal || new Date();

  return enviarEmailLiquidacion({
    clienteEmail: liquidacion.cliente.email,
    clienteNombre:
      [liquidacion.cliente.nombre, liquidacion.cliente.apellido]
        .filter(Boolean)
        .join(" ") || `CUIL ${liquidacion.cliente.cuil}`,
    contadorEmail: contador.email,
    impuesto: liquidacion.impuesto?.formato || "Impuesto",
    monto: liquidacion.importe || 0,
    periodo: fechaReferencia.toLocaleDateString("es-AR", {
      month: "long",
      year: "numeric",
    }),
  });
}
