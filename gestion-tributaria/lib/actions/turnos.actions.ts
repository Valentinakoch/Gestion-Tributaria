"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "../prisma";
import { revalidatePath } from "next/cache";

export async function crearTurno(data: {
  fecha: string;
  hora: string;
}) {
  const { userId } = await auth();
  if (!userId) return { error: "No autenticado." };

  try {
    const cliente = await db.cliente.findFirst({ where: { clerk_id: userId } });
    if (!cliente) return { error: "CUIL no registrado." };

    const admin = await db.contador.findFirst();
    if (!admin) return { error: "No hay administradores disponibles." };

    const [h, m] = data.hora.split(":").map(Number);
    const horaDate = new Date();
    horaDate.setHours(h, m, 0, 0);

    await db.turno.create({
      data: {
        cuil_cliente: cliente.cuil,
        cuil_contador: admin.cuil,
        fecha: new Date(data.fecha),
        hora: horaDate,
      },
    });

    revalidatePath("/dashboard");
    return { success: true };
  } catch {
    return { error: "Error al crear el turno." };
  }
}

export async function editarTurno(data: {
  cuilCliente: string;
  cuilAdminActual: string;
  fechaActual: string;
  horaActual: string;
  nuevaFecha: string;
  nuevaHora: string;
  nuevoCuilAdmin: string;
}) {
  const { userId } = await auth();
  if (!userId) return { error: "No autenticado." };

  try {
    const [a, m, d] = data.fechaActual.split("-").map(Number);
    const fechaOld = new Date(a, m - 1, d);
    const [hO, minO] = data.horaActual.split(":").map(Number);
    const horaOld = new Date();
    horaOld.setHours(hO, minO, 0, 0);

    const [aN, mN, dN] = data.nuevaFecha.split("-").map(Number);
    const fechaNew = new Date(aN, mN - 1, dN);
    const [hN, minN] = data.nuevaHora.split(":").map(Number);
    const horaNew = new Date();
    horaNew.setHours(hN, minN, 0, 0);

    await db.$transaction([
      db.turno.delete({
        where: {
          fecha_hora_cuil_contador: {
            cuil_contador: BigInt(data.cuilAdminActual),
            fecha: fechaOld,
            hora: horaOld,
          },
        },
      }),
      db.turno.create({
        data: {
          cuil_cliente: BigInt(data.cuilCliente),
          cuil_contador: BigInt(data.nuevoCuilAdmin),
          fecha: fechaNew,
          hora: horaNew,
        },
      }),
    ]);

    revalidatePath("/dashboard/turnos");
    return { success: true };
  } catch {
    return { error: "Error al editar el turno." };
  }
}

export async function borrarTurno(data: {
  cuilCliente: string;
  cuilAdmin: string;
  fecha: string;
  hora: string;
}) {
  const { userId } = await auth();
  if (!userId) return { error: "No autenticado." };

  try {
    const [a, m, d] = data.fecha.split("-").map(Number);
    const fechaDate = new Date(a, m - 1, d);
    const [h, min] = data.hora.split(":").map(Number);
    const horaDate = new Date();
    horaDate.setHours(h, min, 0, 0);

    await db.turno.delete({
      where: {
        fecha_hora_cuil_contador: {
          cuil_contador: BigInt(data.cuilAdmin),
          fecha: fechaDate,
          hora: horaDate,
        },
      },
    });

    revalidatePath("/dashboard/turnos");
    return { success: true };
  } catch {
    return { error: "Error al borrar el turno." };
  }
}
