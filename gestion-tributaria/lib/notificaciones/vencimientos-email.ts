import "server-only";
import { enviarEmail } from "../email";
import { db } from "../prisma";

type EnviarEmailRecordatorioVencimientoInput = {
  clienteEmail: string;
  clienteNombre: string;
  contadorEmail?: string | null;
  impuesto: string;
  monto: number;
  vencimiento: Date;
};

async function enviarEmailRecordatorioVencimiento({
  clienteEmail,
  clienteNombre,
  contadorEmail,
  impuesto,
  monto,
  vencimiento,
}: EnviarEmailRecordatorioVencimientoInput) {
  const montoFormateado = monto.toLocaleString("es-AR", {
    style: "currency",
    currency: "ARS",
  });
  const vencimientoFormateado = vencimiento.toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  return enviarEmail({
    to: clienteEmail,
    replyTo: contadorEmail,
    subject: "Recordatorio de vencimiento",
    text: [
      `Hola ${clienteNombre},`,
      "",
      "Te recordamos que tenes una liquidacion pendiente proxima a vencer.",
      `Impuesto: ${impuesto}`,
      `Vencimiento: ${vencimientoFormateado}`,
      `Monto: ${montoFormateado}`,
      "",
      "Ingresa al sistema para revisar el detalle y realizar el pago.",
    ].join("\n"),
    html: `
      <div style="font-family: Arial, sans-serif; color: #0f172a; line-height: 1.5;">
        <h2 style="margin-bottom: 8px;">Recordatorio de vencimiento</h2>
        <p>Hola ${clienteNombre},</p>
        <p>Te recordamos que tenes una liquidacion pendiente proxima a vencer.</p>
        <table style="border-collapse: collapse; margin-top: 12px;">
          <tr>
            <td style="padding: 4px 12px 4px 0; color: #64748b;">Impuesto</td>
            <td style="padding: 4px 0; font-weight: 600;">${impuesto}</td>
          </tr>
          <tr>
            <td style="padding: 4px 12px 4px 0; color: #64748b;">Vencimiento</td>
            <td style="padding: 4px 0; font-weight: 600;">${vencimientoFormateado}</td>
          </tr>
          <tr>
            <td style="padding: 4px 12px 4px 0; color: #64748b;">Monto</td>
            <td style="padding: 4px 0; font-weight: 600;">${montoFormateado}</td>
          </tr>
        </table>
        <p style="margin-top: 16px;">Ingresa al sistema para revisar el detalle y realizar el pago.</p>
      </div>
    `,
  });
}

function crearFechaUtc(year: number, month: number, day: number) {
  return new Date(Date.UTC(year, month, day));
}

function obtenerPartesFechaArgentina(fecha: Date) {
  const partes = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Argentina/Buenos_Aires",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(fecha);

  const year = Number(partes.find((parte) => parte.type === "year")?.value);
  const month = Number(partes.find((parte) => parte.type === "month")?.value);
  const day = Number(partes.find((parte) => parte.type === "day")?.value);

  return { year, month, day };
}

function sumarDiasUtc(fecha: Date, dias: number) {
  return crearFechaUtc(
    fecha.getUTCFullYear(),
    fecha.getUTCMonth(),
    fecha.getUTCDate() + dias,
  );
}

function inicioDelDiaArgentina(fecha: Date) {
  const { year, month, day } = obtenerPartesFechaArgentina(fecha);
  return crearFechaUtc(year, month - 1, day);
}

export async function notificarLiquidacionesPorVencer() {
  const hoy = inicioDelDiaArgentina(new Date());
  const fechaObjetivo = sumarDiasUtc(hoy, 2);

  const liquidaciones = await db.liquidacion.findMany({
    where: {
      estado: { equals: "PENDIENTE", mode: "insensitive" },
      vencimiento: fechaObjetivo,
      recordatorio_vencimiento_enviado_en: null,
    },
    include: {
      cliente: {
        include: {
          contadorRelacion: {
            select: { email: true },
          },
        },
      },
      impuesto: { select: { formato: true } },
    },
  });

  let enviados = 0;
  const errores: string[] = [];

  for (const liquidacion of liquidaciones) {
    if (!liquidacion.cliente?.email || !liquidacion.vencimiento) {
      errores.push(`Liquidacion ${liquidacion.numero_boleta}: cliente sin email o sin vencimiento.`);
      continue;
    }

    try {
      const resultado = await enviarEmailRecordatorioVencimiento({
        clienteEmail: liquidacion.cliente.email,
        clienteNombre:
          [liquidacion.cliente.nombre, liquidacion.cliente.apellido]
            .filter(Boolean)
            .join(" ") || `CUIL ${liquidacion.cliente.cuil}`,
        contadorEmail: liquidacion.cliente.contadorRelacion?.email,
        impuesto: liquidacion.impuesto?.formato || "Impuesto",
        monto: liquidacion.importe || 0,
        vencimiento: liquidacion.vencimiento,
      });

      if (!resultado.enviado) {
        errores.push(`Liquidacion ${liquidacion.numero_boleta}: ${resultado.error}`);
        continue;
      }

      await db.liquidacion.update({
        where: { numero_boleta: liquidacion.numero_boleta },
        data: { recordatorio_vencimiento_enviado_en: new Date() },
      });

      enviados++;
    } catch (error) {
      errores.push(
        `Liquidacion ${liquidacion.numero_boleta}: ${
          error instanceof Error ? error.message : "Error desconocido"
        }`,
      );
    }
  }

  return {
    revisadas: liquidaciones.length,
    enviados,
    errores,
  };
}
