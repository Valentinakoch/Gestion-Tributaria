"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "../prisma";
import { revalidatePath } from "next/cache";

export async function registrarCliente(data: {
  nombre: string;
  apellido: string;
  cuil: string;
  telefono: string;
  email: string;
}) {
  const { userId } = await auth();
  if (!userId) return { error: "No autenticado." };

  const contador = await db.contador.findFirst({ where: { clerk_id: userId } });
  if (!contador) return { error: "No tenés permisos de administrador." };

  if (!/^\d{11}$/.test(data.cuil)) {
    return { error: "CUIL inválido. Debe tener 11 dígitos." };
  }

  const cuilCliente = BigInt(data.cuil);

  try {
    const yaExiste = await db.cliente.findUnique({ where: { cuil: cuilCliente } });
    if (yaExiste) return { error: "Ya existe un cliente con ese CUIL." };

    await db.cliente.create({
      data: {
        cuil: cuilCliente,
        contador: contador.cuil,
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

export async function actualizarCliente(cuil: string, data: {
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
}) {
  const { userId } = await auth();
  if (!userId) return { error: "No autenticado." };

  const contador = await db.contador.findFirst({ where: { clerk_id: userId } });
  if (!contador) return { error: "No tenés permisos de administrador." };

  const cuilCliente = BigInt(cuil);

  try {
    const cliente = await db.cliente.findUnique({ where: { cuil: cuilCliente } });
    if (!cliente) return { error: "Cliente no encontrado." };
    if (cliente.contador !== contador.cuil) return { error: "No tenés permiso para editar este cliente." };

    await db.cliente.update({
      where: { cuil: cuilCliente },
      data: {
        nombre: data.nombre,
        apellido: data.apellido,
        email: data.email || null,
        telefono: data.telefono || null,
      },
    });

    revalidatePath(`/dashboard/clientes/${cuil}`);
    revalidatePath("/dashboard/clientes");
    return { success: true };
  } catch {
    return { error: "Error al actualizar el cliente." };
  }
}

export async function eliminarCliente(cuil: string) {
  const { userId } = await auth();
  if (!userId) return { error: "No autenticado." };

  const contador = await db.contador.findFirst({ where: { clerk_id: userId } });
  if (!contador) return { error: "No tenés permisos de administrador." };

  const cuilBig = BigInt(cuil);

  try {
    const cliente = await db.cliente.findUnique({ where: { cuil: cuilBig } });
    if (!cliente) return { error: "Cliente no encontrado." };
    if (cliente.contador !== contador.cuil) return { error: "No tenés permiso para eliminar este cliente." };

    await db.$transaction(async (tx) => {
      // Liberar turnos reservados por el cliente (cuil_cliente es nullable)
      await tx.turno.updateMany({
        where: { cuil_cliente: cuilBig },
        data: { cuil_cliente: null },
      });

      // Obtener comprobantes antes de borrar liquidaciones
      const liquidaciones = await tx.liquidacion.findMany({
        where: { cuil_cliente: cuilBig },
        select: { numero_boleta_comprobante: true },
      });

      await tx.liquidacion.deleteMany({ where: { cuil_cliente: cuilBig } });

      const comprobanteIds = liquidaciones
        .map((l) => l.numero_boleta_comprobante)
        .filter((id): id is number => id !== null);

      if (comprobanteIds.length > 0) {
        await tx.comprobante.deleteMany({
          where: { numero_boleta: { in: comprobanteIds } },
        });
      }

      await tx.inscripto_en.deleteMany({ where: { cuil_cliente: cuilBig } });

      await tx.cliente.delete({ where: { cuil: cuilBig } });
    });

    revalidatePath("/dashboard/clientes");
    return { success: true };
  } catch {
    return { error: "Error al eliminar el cliente." };
  }
}
