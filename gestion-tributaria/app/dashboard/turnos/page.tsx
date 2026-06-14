import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "../../../lib/prisma";
import { Calendar } from "lucide-react";
import TurnoForm from "./_components/turno-form";
import TurnosAdminList from "./_components/turnos-admin-list";

export default async function TurnosPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const user = await currentUser();
  const nombreUsuario = `${user?.firstName || ""} ${user?.lastName || ""}`.trim() || "Usuario";

  const contador = await db.contador.findFirst({ where: { clerk_id: userId } });

  if (contador) {
    const [turnos, admins] = await Promise.all([
      db.turno.findMany({
        include: {
          cliente: { select: { nombre: true, apellido: true } },
          contador: { select: { nombre: true, apellido: true } },
        },
        orderBy: [{ fecha: "desc" }, { hora: "desc" }],
      }),
      db.contador.findMany({ select: { cuil: true, nombre: true, apellido: true } }),
    ]);

    const turnosData = turnos.map((t) => ({
      id: `${t.fecha.toISOString()}-${t.hora.toISOString()}-${t.cuil_cliente}-${t.cuil_contador}`,
      cliente:
        [t.cliente?.nombre, t.cliente?.apellido]
          .filter(Boolean)
          .join(" ") || `CUIL: ${t.cuil_cliente}`,
      fecha: t.fecha.toLocaleDateString("es-AR"),
      hora: t.hora.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" }),
      fechaIso: t.fecha.toISOString().slice(0, 10),
      horaIso: t.hora.toISOString().slice(11, 16),
      cuilCliente: t.cuil_cliente?.toString() ?? "",
      cuilAdmin: t.cuil_contador.toString(),
      adminNombre:
        [t.contador?.nombre, t.contador?.apellido]
          .filter(Boolean)
          .join(" ") || `Admin CUIL: ${t.cuil_contador}`,
    }));

    const adminsData = admins.map((a) => ({
      cuil: a.cuil.toString(),
      nombre: [a.nombre, a.apellido].filter(Boolean).join(" ") || `Admin CUIL: ${a.cuil}`,
    }));

    return (
      <div>
        <header className="flex items-center gap-3 mb-8">
          <div className="h-10 w-10 rounded-xl bg-brand-dark flex items-center justify-center text-white">
            <Calendar className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Turnos Solicitados</h1>
            <p className="text-sm text-slate-500">Administrá las citas de los clientes</p>
          </div>
        </header>

        <TurnosAdminList turnos={turnosData} admins={adminsData} />
      </div>
    );
  }

  const cliente = await db.cliente.findFirst({ where: { clerk_id: userId } });
  if (!cliente) redirect("/dashboard");

  const turnosCliente = await db.turno.findMany({
    where: { cuil_cliente: cliente.cuil },
    include: {
      contador: { select: { nombre: true, apellido: true } },
    },
    orderBy: [{ fecha: "asc" }, { hora: "asc" }],
  });

  const turnosClienteData = turnosCliente.map((t) => ({
    id: `${t.fecha.toISOString()}-${t.hora.toISOString()}-${t.cuil_cliente}-${t.cuil_contador}`,
    fecha: t.fecha.toLocaleDateString("es-AR"),
    hora: t.hora.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" }),
    adminNombre:
      [t.contador?.nombre, t.contador?.apellido].filter(Boolean).join(" ") || "Admin",
  }));

  return (
    <div>
      <header className="flex items-center gap-3 mb-8">
        <div className="h-10 w-10 rounded-xl bg-brand-dark flex items-center justify-center text-white">
          <Calendar className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Turnos</h1>
          <p className="text-sm text-slate-500">Reservá una cita, {nombreUsuario}</p>
        </div>
      </header>
      <TurnoForm turnos={turnosClienteData} />
    </div>
  );
}
