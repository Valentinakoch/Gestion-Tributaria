import { auth } from "@clerk/nextjs/server";
import { Building2 } from "lucide-react";
import { redirect } from "next/navigation";
import { db } from "../../../lib/prisma";
import EntidadesAdmin from "./_components/entidades-admin";

export default async function EntidadesPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const contador = await db.contador.findFirst({
    where: { clerk_id: userId },
    select: { cuil: true },
  });
  if (!contador) redirect("/dashboard");

  const entidades = await db.entidad_tributaria.findMany({
    select: {
      id_entidad: true,
      nombre: true,
      url: true,
      _count: { select: { inscripto_en: true } },
    },
    orderBy: { nombre: "asc" },
  });

  const entidadesData = entidades.map((entidad) => ({
    id: entidad.id_entidad,
    nombre: entidad.nombre || "Sin nombre",
    url: entidad.url || "",
    clientesInscriptos: entidad._count.inscripto_en,
  }));

  return (
    <div>
      <header className="flex items-center gap-3 mb-8">
        <div className="h-10 w-10 rounded-xl bg-brand-dark flex items-center justify-center text-white">
          <Building2 className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Entidades Tributarias</h1>
          <p className="text-sm text-slate-500">
            Registrá y administrá los organismos tributarios
          </p>
        </div>
      </header>

      <EntidadesAdmin entidades={entidadesData} />
    </div>
  );
}
