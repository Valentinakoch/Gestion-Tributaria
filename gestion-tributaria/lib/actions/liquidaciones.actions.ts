"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "../prisma";
import { revalidatePath } from "next/cache";

export async function crearLiquidacion(data: {
  cuilCliente: string;
  idImpuesto: number;
  monto: number;
  periodo: string;
}) {
  const { userId } = await auth();
  if (!userId) return { error: "No autenticado." };

  try {
    const [anio, mes] = data.periodo.split("-").map(Number);
    const periodoDate = new Date(anio, mes - 1, 15);

    await db.liquidacion.create({
      data: {
        periodo_fiscal: periodoDate,
        importe: data.monto,
        estado: "PENDIENTE",
        cuil_cliente: BigInt(data.cuilCliente),
        id_impuesto: data.idImpuesto,
      },
    });

    revalidatePath("/dashboard");
    return { success: true };
  } catch {
    return { error: "Error al crear la liquidación." };
  }
}
