"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { db } from "../prisma";

type ImpuestoInput = {
  formato: string;
  idEntidad: number;
};

type ActionResult = {
  success: boolean;
  error?: string;
};

async function obtenerContadorActual() {
  const { userId } = await auth();
  if (!userId) return null;

  return db.contador.findFirst({
    where: { clerk_id: userId },
    select: { cuil: true },
  });
}

async function validarImpuesto(data: ImpuestoInput) {
  const formato = data.formato.trim();

  if (formato.length < 2 || formato.length > 100) {
    return { error: "El nombre del impuesto debe tener entre 2 y 100 caracteres." };
  }

  if (!Number.isInteger(data.idEntidad) || data.idEntidad <= 0) {
    return { error: "Selecciona una entidad tributaria." };
  }

  const entidad = await db.entidad_tributaria.findUnique({
    where: { id_entidad: data.idEntidad },
    select: { id_entidad: true },
  });

  if (!entidad) {
    return { error: "La entidad tributaria seleccionada no existe." };
  }

  return { formato, idEntidad: data.idEntidad };
}

export async function crearImpuesto(data: ImpuestoInput): Promise<ActionResult> {
  const contador = await obtenerContadorActual();
  if (!contador) return { success: false, error: "No autorizado." };

  const validacion = await validarImpuesto(data);
  if ("error" in validacion) return { success: false, error: validacion.error };

  const existente = await db.impuesto.findFirst({
    where: {
      formato: { equals: validacion.formato, mode: "insensitive" },
      id_entidad: validacion.idEntidad,
    },
    select: { id_impuesto: true },
  });

  if (existente) {
    return { success: false, error: "Ya existe ese impuesto para la entidad seleccionada." };
  }

  await db.impuesto.create({
    data: {
      formato: validacion.formato,
      id_entidad: validacion.idEntidad,
    },
  });

  revalidatePath("/dashboard/impuestos");
  revalidatePath("/dashboard/subir");
  return { success: true };
}

export async function modificarImpuesto(
  idImpuesto: number,
  data: ImpuestoInput,
): Promise<ActionResult> {
  const contador = await obtenerContadorActual();
  if (!contador) return { success: false, error: "No autorizado." };
  if (!Number.isInteger(idImpuesto) || idImpuesto <= 0) {
    return { success: false, error: "Impuesto invalido." };
  }

  const validacion = await validarImpuesto(data);
  if ("error" in validacion) return { success: false, error: validacion.error };

  const impuesto = await db.impuesto.findUnique({
    where: { id_impuesto: idImpuesto },
    select: { id_impuesto: true },
  });
  if (!impuesto) return { success: false, error: "El impuesto no existe." };

  const existente = await db.impuesto.findFirst({
    where: {
      id_impuesto: { not: idImpuesto },
      formato: { equals: validacion.formato, mode: "insensitive" },
      id_entidad: validacion.idEntidad,
    },
    select: { id_impuesto: true },
  });

  if (existente) {
    return { success: false, error: "Ya existe ese impuesto para la entidad seleccionada." };
  }

  await db.impuesto.update({
    where: { id_impuesto: idImpuesto },
    data: {
      formato: validacion.formato,
      id_entidad: validacion.idEntidad,
    },
  });

  revalidatePath("/dashboard/impuestos");
  revalidatePath("/dashboard/subir");
  return { success: true };
}

export async function eliminarImpuesto(idImpuesto: number): Promise<ActionResult> {
  const contador = await obtenerContadorActual();
  if (!contador) return { success: false, error: "No autorizado." };
  if (!Number.isInteger(idImpuesto) || idImpuesto <= 0) {
    return { success: false, error: "Impuesto invalido." };
  }

  const impuesto = await db.impuesto.findUnique({
    where: { id_impuesto: idImpuesto },
    select: {
      id_impuesto: true,
      _count: { select: { liquidacion: true } },
    },
  });

  if (!impuesto) return { success: false, error: "El impuesto no existe." };
  if (impuesto._count.liquidacion > 0) {
    return {
      success: false,
      error: `No se puede eliminar: tiene ${impuesto._count.liquidacion} liquidacion(es) asociada(s).`,
    };
  }

  await db.impuesto.delete({
    where: { id_impuesto: idImpuesto },
  });

  revalidatePath("/dashboard/impuestos");
  revalidatePath("/dashboard/subir");
  return { success: true };
}
