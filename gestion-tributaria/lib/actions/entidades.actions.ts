"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { db } from "../prisma";

type EntidadInput = {
  nombre: string;
  url: string;
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

function validarEntidad(data: EntidadInput): EntidadInput | { error: string } {
  const nombre = data.nombre.trim();
  const url = data.url.trim();

  if (nombre.length < 2 || nombre.length > 100) {
    return { error: "El nombre debe tener entre 2 y 100 caracteres." };
  }

  if (!url) {
    return { error: "El sitio web es obligatorio." };
  }

  try {
    const parsedUrl = new URL(url);
    if (!["http:", "https:"].includes(parsedUrl.protocol)) {
      return { error: "La URL debe comenzar con http:// o https://." };
    }
  } catch {
    return { error: "Ingresá una URL válida." };
  }

  return { nombre, url };
}

export async function crearEntidadTributaria(data: EntidadInput): Promise<ActionResult> {
  const contador = await obtenerContadorActual();
  if (!contador) return { success: false, error: "No autorizado." };

  const validacion = validarEntidad(data);
  if ("error" in validacion) return { success: false, error: validacion.error };

  const existente = await db.entidad_tributaria.findFirst({
    where: {
      nombre: { equals: validacion.nombre, mode: "insensitive" },
    },
    select: { id_entidad: true },
  });

  if (existente) {
    return { success: false, error: "Ya existe una entidad tributaria con ese nombre." };
  }

  await db.entidad_tributaria.create({
    data: {
      nombre: validacion.nombre,
      url: validacion.url,
    },
  });

  revalidatePath("/dashboard/entidades");
  return { success: true };
}

export async function modificarEntidadTributaria(
  idEntidad: number,
  data: Pick<EntidadInput, "url">,
): Promise<ActionResult> {
  const contador = await obtenerContadorActual();
  if (!contador) return { success: false, error: "No autorizado." };
  if (!Number.isInteger(idEntidad) || idEntidad <= 0) {
    return { success: false, error: "Entidad inválida." };
  }

  const entidad = await db.entidad_tributaria.findUnique({
    where: { id_entidad: idEntidad },
    select: { id_entidad: true, nombre: true },
  });
  if (!entidad) return { success: false, error: "La entidad tributaria no existe." };

  const validacion = validarEntidad({
    nombre: entidad.nombre || "",
    url: data.url,
  });
  if ("error" in validacion) return { success: false, error: validacion.error };

  await db.entidad_tributaria.update({
    where: { id_entidad: idEntidad },
    data: {
      url: validacion.url,
    },
  });

  revalidatePath("/dashboard/entidades");
  return { success: true };
}

export async function eliminarEntidadTributaria(idEntidad: number): Promise<ActionResult> {
  const contador = await obtenerContadorActual();
  if (!contador) return { success: false, error: "No autorizado." };
  if (!Number.isInteger(idEntidad) || idEntidad <= 0) {
    return { success: false, error: "Entidad inválida." };
  }

  const entidad = await db.entidad_tributaria.findUnique({
    where: { id_entidad: idEntidad },
    select: {
      id_entidad: true,
      _count: { select: { inscripto_en: true } },
    },
  });

  if (!entidad) return { success: false, error: "La entidad tributaria no existe." };
  if (entidad._count.inscripto_en > 0) {
    return {
      success: false,
      error: `No se puede eliminar: tiene ${entidad._count.inscripto_en} cliente(s) inscripto(s).`,
    };
  }

  await db.entidad_tributaria.delete({
    where: { id_entidad: idEntidad },
  });

  revalidatePath("/dashboard/entidades");
  return { success: true };
}
