"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "../prisma";
import { revalidatePath } from "next/cache";

export async function registrarCliente(data: {
  nombre: string;
  apellido: string;
  cuil: string;
  cuilContador: string;
  telefono: string;
  email: string;
}) {
  const { userId } = await auth();
  if (!userId) return { error: "No autenticado." };

  const esAdmin = await db.contador.findFirst({ where: { clerk_id: userId } });
  if (!esAdmin) return { error: "No tenés permisos de administrador." };

  if (!/^\d{11}$/.test(data.cuil)) {
    return { error: "CUIL inválido. Debe tener 11 dígitos." };
  }

  const cuilCliente = BigInt(data.cuil);
  const cuilContador = BigInt(data.cuilContador);

  try {
    const yaExiste = await db.cliente.findUnique({ where: { cuil: cuilCliente } });
    if (yaExiste) return { error: "Ya existe un cliente con ese CUIL." };

    const contador = await db.contador.findUnique({ where: { cuil: cuilContador } });
    if (!contador) return { error: "El contador indicado no existe." };

    await db.cliente.create({
      data: {
        cuil: cuilCliente,
        contador: cuilContador,
        id_estudio: contador.id_estudio,
        nombre: data.nombre,
        apellido: data.apellido,
        email: data.email,
        telefono: data.telefono,
      },
    });

    revalidatePath("/dashboard/clientes");
    return { success: true };
  } catch {
    return { error: "Error al registrar el cliente." };
  }
}
