"use server";

import { auth, currentUser } from "@clerk/nextjs/server";
import { db } from "../prisma";
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
    const existeAdmin = await db.contador.findUnique({ where: { cuil: cuilNumber } });
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

export async function verificarRol(rol: "admin" | "cliente") {
  const { userId } = await auth();
  if (!userId) return { error: "No autenticado." };

  try {
    const clerkUser = await db.clerk_user.findUnique({ where: { id: userId } });
    if (!clerkUser?.cuil) return { error: "Primero debés registrar tu CUIL." };

    const cuilNumber = BigInt(clerkUser.cuil.trim());

    if (rol === "admin") {
      const admin = await db.contador.findUnique({ where: { cuil: cuilNumber } });
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
