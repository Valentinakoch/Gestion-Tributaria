"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "../prisma";
import { revalidatePath } from "next/cache";
import { verificarRol } from "./auth.actions";

//crear nuevo turno disponible (admin)
export async function crearTurno(data: {
  fecha: string;
  hora: string;
  cuilContador: string;
}) {
  const permiso= await verificarRol("admin");
  if(permiso.error) return { error: permiso.error };

  try {
    const [h, m] = data.hora.split(":").map(Number);
   const horaDate = new Date(`1970-01-01T${data.hora}:00.000Z`);
    const existente = await db.turno.findFirst({
      where: {
        cuil_contador: BigInt(data.cuilContador),
        fecha: new Date(data.fecha),
        hora: horaDate,
      },
    });
    if (existente) return { error: "Ya existe un turno en esa fecha y hora." };

    await db.turno.create({
      data: {
        cuil_contador: BigInt(data.cuilContador),
        fecha: new Date(data.fecha),
        hora: horaDate,
        cuil_cliente: null,
      },
    });

    revalidatePath("/dashboard/turnos");
    return { success: true };
  } catch {
    return { error: "Error al crear el turno." };
  }
}

//modificar turno (admin)
export async function editarTurno(data: {
  fechaActual: string;
  horaActual: string;
  cuilContadorActual: string;
  nuevaFecha: string;
  nuevaHora: string;
  nuevoCuilContador: string;
}) {
  const permiso = await verificarRol("admin");
  if (permiso.error) return { error: permiso.error };

  try {
    
    const [hO, minO] = data.horaActual.split(":").map(Number);
    const horaOld = new Date(`1970-01-01T${data.horaActual}:00.000Z`);

    const [hN, minN] = data.nuevaHora.split(":").map(Number);
    const horaNew = new Date(`1970-01-01T${data.nuevaHora}:00.000Z`);
     const turnoActual = await db.turno.findFirst({
      where: {
        fecha: new Date(data.fechaActual),
        hora: horaOld,
        cuil_contador: BigInt(data.cuilContadorActual),
      },
    });
    if (!turnoActual) return { error: "Turno no encontrado." };
     
    //dos operaciones juntas, si alguna falla se deshace todo" no hace update porque son claves primarias
     await db.$transaction([
      db.turno.delete({
        where: {
            fecha_hora_cuil_contador: {
            fecha: new Date(data.fechaActual),
            hora: horaOld,
            cuil_contador: BigInt(data.cuilContadorActual),
          },
        },
      }),
      db.turno.create({
        data: {
          fecha: new Date(data.nuevaFecha),
          hora: horaNew,
          cuil_contador: BigInt(data.nuevoCuilContador),
          cuil_cliente: turnoActual.cuil_cliente,
        },
      }),
    ]);
    revalidatePath("/dashboard/turnos");
    return { success: true };
  } catch {
    return { error: "Error al editar el turno." };
  }
}

//deshabilitar turno (admin)
export async function borrarTurno(data: {
  fecha: string;
  hora: string;
  cuilContador: string;
}) {
  const permiso = await verificarRol("admin");
  if (permiso.error) return { error: permiso.error };
  try {
    const [h, min] = data.hora.split(":").map(Number);
    const horaDate = new Date(`1970-01-01T${data.hora}:00.000Z`);

    await db.turno.delete({
      where: {
        fecha_hora_cuil_contador: {
          fecha: new Date(data.fecha),
          hora: horaDate,
          cuil_contador: BigInt(data.cuilContador),
        },
      },
    });

    revalidatePath("/dashboard/turnos");
    return { success: true };
  } catch {
    return { error: "Error al borrar el turno." };
  }
}
  //Reserva un turno disponible (cliente)
  export async function reservarTurno(data: {
  fecha: string;
  hora: string;
  cuilContador: string;
  }) {
  const permiso = await verificarRol("cliente");
  if (permiso.error) return { error: permiso.error };
  const { userId } = await auth();

  try {
    const cliente = await db.cliente.findFirst({ where: { clerk_id: userId! } });
    if (!cliente) return { error: "Cliente no registrado." };
    const [h, m] = data.hora.split(":").map(Number);
    const horaDate = new Date(`1970-01-01T${data.hora}:00.000Z`);
    const turno = await db.turno.findFirst({
      where: {
        cuil_contador: BigInt(data.cuilContador),
        fecha: new Date(data.fecha),
        hora: horaDate,
        cuil_cliente: null,
      },
    });
    if (!turno) return { error: "El turno no está disponible." };

    await db.turno.update({
      where: {
          fecha_hora_cuil_contador: {
          fecha: new Date(data.fecha),
          hora: horaDate,
          cuil_contador: BigInt(data.cuilContador),
        },
      },
      data: { cuil_cliente: cliente.cuil },
    });
     revalidatePath("/dashboard/turnos");
    return { success: true };
  } catch {
    return { error: "Error al reservar el turno." };
  }
}


