"use server";

import { auth, clerkClient } from "@clerk/nextjs/server";
import { db } from "../prisma";
import { revalidatePath } from "next/cache";

export async function verificarRol(rol: "admin" | "cliente") {
  const { userId } = await auth();
  if (!userId) return { error: "No autenticado." };

  try {
    const contador = await db.contador.findFirst({ where: { clerk_id: userId } });
    const cliente = await db.cliente.findFirst({ where: { clerk_id: userId } });

    if (rol === "admin" && !contador) return { error: "Este usuario no está registrado como administrador." };
    if (rol === "cliente" && !cliente) return { error: "Este usuario no está registrado como cliente." };

    revalidatePath("/dashboard");
    return { success: true };
  } catch {
    return { error: "Error de conexión con la base de datos." };
  }
}

export async function saveCuil(cuil: string) {
  const { userId } = await auth();
  if (!userId) return { error: "No autenticado." };

  if (!/^\d{11}$/.test(cuil)) {
    return { error: "CUIL inválido. Debe tener 11 dígitos." };
  }

  const cuilNumber = BigInt(cuil);

  try {
    const contador = await db.contador.findUnique({ where: { cuil: cuilNumber } });
    const cliente = await db.cliente.findUnique({ where: { cuil: cuilNumber } });

    if (!contador && !cliente) {
      return { error: "El CUIL ingresado no corresponde a ningún usuario registrado. Contactá al administrador." };
    }

    const client = await clerkClient();

    if (contador) {
      if (contador.clerk_id && contador.clerk_id !== userId) {
        return { error: "Este CUIL ya tiene una cuenta asociada." };
      }
      await db.contador.update({
        where: { cuil: cuilNumber },
        data: { clerk_id: userId },
      });
      await client.users.updateUserMetadata(userId, {
        publicMetadata: { role: "admin" },
      });
    } else if (cliente) {
      if (cliente.clerk_id && cliente.clerk_id !== userId) {
        return { error: "Este CUIL ya tiene una cuenta asociada." };
      }
      await db.cliente.update({
        where: { cuil: cuilNumber },
        data: { clerk_id: userId },
      });
      await client.users.updateUserMetadata(userId, {
        publicMetadata: { role: "cliente" },
      });
    }

    revalidatePath("/dashboard");
    return { success: true };
  } catch {
    return { error: "Error de conexión con la base de datos." };
  }
}
