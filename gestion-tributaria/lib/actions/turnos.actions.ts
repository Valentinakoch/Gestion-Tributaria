"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "../prisma";
import { revalidatePath } from "next/cache";
import { verificarRol } from "./auth.actions";
import { enviarEmailTurno } from "../email";

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
     // Validar que la fecha y hora no sean del pasado
    const [anio, mes, dia] = data.fecha.split("-").map(Number);
    const fechaHoraTurno = new Date(anio, mes - 1, dia, h, m, 0, 0); // hora local 
      if (fechaHoraTurno < new Date()) {
        return { error: "No se puede crear un turno en una fecha u hora que ya pasó." };
      }
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
    const horaOld = new Date(`1970-01-01T${data.horaActual}:00.000Z`);
    const horaNew = new Date(`1970-01-01T${data.nuevaHora}:00.000Z`);

     // Validar que la NUEVA fecha y hora no sean del pasado
    const [hN, minN] = data.nuevaHora.split(":").map(Number);
    const [anio, mes, dia] = data.nuevaFecha.split("-").map(Number);
    const nuevaFechaHora = new Date(anio, mes - 1, dia, hN, minN, 0, 0);
    if (nuevaFechaHora < new Date()) {
      return { error: "No se puede modificar el turno a una fecha u hora que ya pasó." };
    }

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

  //cancelar turno reservado (admin) - notificar al cliente
export async function cancelarTurno(data: {
  fecha: string;
  hora: string;
  cuilContador: string;
}) {
  const permiso = await verificarRol("admin");
  if (permiso.error) return { error: permiso.error };

  try {
    const horaDate = new Date(`1970-01-01T${data.hora}:00.000Z`);

    const turno = await db.turno.findFirst({
      where: {
        fecha: new Date(data.fecha),
        hora: horaDate,
        cuil_contador: BigInt(data.cuilContador),
      },
      include: { cliente: true },
    });

    if (!turno) return { error: "Turno no encontrado." };
    if (!turno.cliente) return { error: "Este turno no tiene un cliente reservado." };

    // ENVÍO DE EMAIL AL CLIENTE
    if (turno.cliente.email) {
      const nombreCliente = [turno.cliente.nombre, turno.cliente.apellido]
        .filter(Boolean)
        .join(" ") || `Cliente (CUIL ${turno.cliente.cuil})`;

      await enviarEmailTurno({
        destinatarioEmail: turno.cliente.email,
        destinatarioNombre: nombreCliente,
        fecha: data.fecha,
        hora: data.hora,
        motivo: "El estudio contable ha cancelado este turno.",
      });
    }

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
    return { error: "Error al cancelar el turno." };
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
      include: { contador: true },
    });
    if (!turno) return { error: "El turno no está disponible." };
    
    //notificar al contador que se reservó el turno
    if (turno.contador && turno.contador.email) {
      const nombreCliente = [cliente.nombre, cliente.apellido]
        .filter(Boolean)
        .join(" ") || `CUIL: ${cliente.cuil}`;
        
      const nombreContador = turno.contador.nombre || "Contador";

      await enviarEmailTurno({
        destinatarioEmail: turno.contador.email,
        destinatarioNombre: nombreContador,
        fecha: data.fecha,
        hora: data.hora,
        motivo: `El cliente ${nombreCliente} ha RESERVADO este turno. Ya quedó agendado en el sistema.`,
      });
    }

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

//cliente cancela su propio turno reservado
export async function cancelarTurnoCliente(data: {
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

    const horaDate = new Date(`1970-01-01T${data.hora}:00.000Z`);

    const turno = await db.turno.findFirst({
      where: {
        fecha: new Date(data.fecha),
        hora: horaDate,
        cuil_contador: BigInt(data.cuilContador),
        cuil_cliente: cliente.cuil, // solo puede cancelar SU turno
      },
      include: { contador: true }, // Traemos la info del contador asignado
    });
    if (!turno) return { error: "Turno no encontrado o no te pertenece." };

    // ENVÍO DE EMAIL AL CONTADOR
    if (turno.contador && turno.contador.email) {
      const nombreCliente = [cliente.nombre, cliente.apellido]
        .filter(Boolean)
        .join(" ") || `CUIL: ${cliente.cuil}`;
        
      const nombreContador = turno.contador.nombre || "Contador";

      await enviarEmailTurno({
        destinatarioEmail: turno.contador.email,
        destinatarioNombre: nombreContador,
        fecha: data.fecha,
        hora: data.hora,
        motivo: `El cliente ${nombreCliente} ha cancelado la reserva de este turno. El horario vuelve a estar disponible.`,
      });
    }

    await db.turno.update({
      where: {
        fecha_hora_cuil_contador: {
          fecha: new Date(data.fecha),
          hora: horaDate,
          cuil_contador: BigInt(data.cuilContador),
        },
      },
      data: { cuil_cliente: null }, // vuelve a estar disponible
    });

    revalidatePath("/dashboard/turnos");
    return { success: true };
  } catch {
    return { error: "Error al cancelar el turno." };
  }
}

//limpia turnos vencidos (fecha+hora ya pasada), reservados o no
export async function limpiarTurnosVencidos() {
  try {
    const ahora = new Date();

    // Traemos todos los turnos para comparar fecha+hora combinadas
    // (Prisma no puede comparar fecha+hora por separado en un solo where)
    const turnos = await db.turno.findMany({
      select: { fecha: true, hora: true, cuil_contador: true },
    });

    const vencidos = turnos.filter((t) => {
      const fechaHora = new Date(t.fecha);
      fechaHora.setUTCHours(t.hora.getUTCHours(), t.hora.getUTCMinutes(), 0, 0);
      return fechaHora < ahora;
    });

    if (vencidos.length === 0) return;

    await db.$transaction(
      vencidos.map((t) =>
        db.turno.delete({
          where: {
            fecha_hora_cuil_contador: {
              fecha: t.fecha,
              hora: t.hora,
              cuil_contador: t.cuil_contador,
            },
          },
        })
      )
    );
  } catch {
    
  }
}


