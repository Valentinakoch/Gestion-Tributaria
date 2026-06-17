import "server-only";
import { enviarEmailLiquidacion } from "../email";
import { db } from "../prisma";

type NotificarLiquidacionCreadaInput = {
  numeroBoleta: number;
  clerkUserId: string;
};

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
