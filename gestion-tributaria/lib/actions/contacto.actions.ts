"use server";

import { auth, currentUser } from "@clerk/nextjs/server";
import { db } from "../prisma";
import { revalidatePath } from "next/cache";

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

export async function actualizarContactoCliente(data: {
  email: string;
  telefono: string;
}) {
  const { userId } = await auth();
  if (!userId) return { error: "No autenticado." };

  try {
    const cliente = await db.cliente.findFirst({ where: { clerk_id: userId } });
    if (!cliente) return { error: "Usuario no encontrado." };

    await db.cliente.update({
      where: { cuil: cliente.cuil },
      data: { email: data.email, telefono: data.telefono },
    });

    revalidatePath("/dashboard/contacto");
    return { success: true };
  } catch {
    return { error: "Error al actualizar el contacto." };
  }
}
