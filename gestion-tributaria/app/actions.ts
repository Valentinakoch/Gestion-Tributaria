"use server";

import { auth, currentUser } from "@clerk/nextjs/server";
import { db } from "../lib/prisma";
import { revalidatePath } from "next/cache";

export async function saveCuil(cuil: string) {
  const { userId } = await auth();
  if (!userId) {
    return { error: "No autenticado." };
  }

  if (!/^\d{11}$/.test(cuil)) {
    return { error: "CUIL inválido. Debe tener 11 dígitos." };
  }

  const cuilNumber = BigInt(cuil);

  try {
    const existeAdmin = await db.administrador.findUnique({ where: { cuil: cuilNumber } });
    const existeCliente = await db.cliente.findUnique({ where: { cuil: cuilNumber } });

    if (!existeAdmin && !existeCliente) {
      return { error: "El CUIL ingresado no corresponde a un contribuyente registrado en el sistema. Contactá al administrador." };
    }

    const user = await currentUser();

    await db.clerk_user.upsert({
      where: { id: userId },
      create: { id: userId, cuil, email: user?.emailAddresses[0]?.emailAddress },
      update: { cuil },
    });

    await db.usuario.upsert({
      where: { CUIL_usuario: cuilNumber },
      create: {
        CUIL_usuario: cuilNumber,
        email: user?.emailAddresses[0]?.emailAddress,
        nombre_usuario: user?.firstName || undefined,
        apellido_usuario: user?.lastName || undefined,
      },
      update: {
        email: user?.emailAddresses[0]?.emailAddress,
        nombre_usuario: user?.firstName || undefined,
        apellido_usuario: user?.lastName || undefined,
      },
    });

    return { success: true };
  } catch {
    return { error: "Error de conexión con la base de datos." };
  }
}

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

export async function crearTurno(data: {
  fecha: string;
  hora: string;
}) {
  const { userId } = await auth();
  if (!userId) return { error: "No autenticado." };

  try {
    const clerkUser = await db.clerk_user.findUnique({ where: { id: userId } });
    if (!clerkUser?.cuil) return { error: "CUIL no registrado." };

    const cuilCliente = BigInt(clerkUser.cuil);

    const admin = await db.administrador.findFirst();
    if (!admin) return { error: "No hay administradores disponibles." };

    const [h, m] = data.hora.split(":").map(Number);
    const horaDate = new Date();
    horaDate.setHours(h, m, 0, 0);

    await db.turno.create({
      data: {
        cuil_cliente: cuilCliente,
        cuil_admin: admin.cuil,
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

export async function enviarMensaje(mensaje: string) {
  const { userId } = await auth();
  if (!userId) return { error: "No autenticado." };
  if (!mensaje.trim()) return { error: "El mensaje no puede estar vacío." };

  try {
    const user = await currentUser();
    const nombre = `${user?.firstName || ""} ${user?.lastName || ""}`.trim() || "Anónimo";

    console.log(`[Contacto] ${nombre} (${userId}): ${mensaje}`);

    return { success: true };
  } catch {
    return { error: "Error al enviar el mensaje." };
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
          fecha_hora_cuil_admin_cuil_cliente: {
            cuil_cliente: BigInt(data.cuilCliente),
            cuil_admin: BigInt(data.cuilAdminActual),
            fecha: fechaOld,
            hora: horaOld,
          },
        },
      }),
      db.turno.create({
        data: {
          cuil_cliente: BigInt(data.cuilCliente),
          cuil_admin: BigInt(data.nuevoCuilAdmin),
          fecha: fechaNew,
          hora: horaNew,
        },
      }),
    ]);

    revalidatePath("/dashboard/turnos");
    return { success: true };
  } catch (e) {
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
        fecha_hora_cuil_admin_cuil_cliente: {
          cuil_cliente: BigInt(data.cuilCliente),
          cuil_admin: BigInt(data.cuilAdmin),
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

export async function actualizarContactoCliente(data: {
  email: string;
  telefono: string;
}) {
  const { userId } = await auth();
  if (!userId) return { error: "No autenticado." };

  try {
    const clerkUser = await db.clerk_user.findUnique({ where: { id: userId } });
    if (!clerkUser?.cuil) return { error: "CUIL no registrado." };

    const cuilNumber = BigInt(clerkUser.cuil.replace(/\D/g, ""));

    await db.usuario.update({
      where: { CUIL_usuario: cuilNumber },
      data: { email: data.email, telefono: data.telefono },
    });

    revalidatePath("/dashboard/contacto");
    return { success: true };
  } catch {
    return { error: "Error al actualizar el contacto." };
  }
}

export async function verificarRol(rol: "admin" | "cliente") {
  const { userId } = await auth();
  if (!userId) return { error: "No autenticado." };

  try {
    const clerkUser = await db.clerk_user.findUnique({ where: { id: userId } });
    if (!clerkUser?.cuil) return { error: "Primero debés registrar tu CUIL." };

    const cuilNumber = BigInt(clerkUser.cuil.trim());

    if (rol === "admin") {
      const admin = await db.administrador.findUnique({ where: { cuil: cuilNumber } });
      if (!admin) return { error: "Este CUIL no está registrado como administrador. Contactá al estudio contable." };
    } else {
      const cliente = await db.cliente.findUnique({ where: { cuil: cuilNumber } });
      if (!cliente) return { error: "Este CUIL no está registrado como cliente. Contactá al estudio contable." };
    }

    await db.clerk_user.update({
      where: { id: userId },
      data: { rol },
    });

    revalidatePath("/dashboard");
    return { success: true };
  } catch {
    return { error: "Error de conexión con la base de datos." };
  }
}
