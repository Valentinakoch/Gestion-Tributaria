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
