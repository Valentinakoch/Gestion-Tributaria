import { auth } from "@clerk/nextjs/server";
import { ArrowLeft, Receipt } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "../../../lib/prisma";
import ImpuestosAdmin from "./_components/impuestos-admin";

export default async function ImpuestosPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const contador = await db.contador.findFirst({
    where: { clerk_id: userId },
    select: { cuil: true },
  });
  if (!contador) redirect("/dashboard");

  const [impuestos, entidades] = await Promise.all([
    db.impuesto.findMany({
      select: {
        id_impuesto: true,
        formato: true,
        id_entidad: true,
        entidad_tributaria: { select: { nombre: true, url: true } },
        _count: { select: { liquidacion: true } },
      },
      orderBy: { formato: "asc" },
    }),
    db.entidad_tributaria.findMany({
      select: { id_entidad: true, nombre: true },
      orderBy: { nombre: "asc" },
    }),
  ]);

  const impuestosData = impuestos.map((impuesto) => ({
    id: impuesto.id_impuesto,
    formato: impuesto.formato || "Sin nombre",
    idEntidad: impuesto.id_entidad,
    entidadNombre: impuesto.entidad_tributaria?.nombre || "Sin entidad",
    entidadUrl: impuesto.entidad_tributaria?.url || "",
    liquidacionesAsociadas: impuesto._count.liquidacion,
  }));

  const entidadesData = entidades.map((entidad) => ({
    id: entidad.id_entidad,
    nombre: entidad.nombre || "Sin nombre",
  }));

  return (
    <div>
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 transition-colors mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver al panel
      </Link>
      <header className="flex items-center gap-3 mb-8">
        <div className="h-10 w-10 rounded-xl bg-brand-dark flex items-center justify-center text-white">
          <Receipt className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Impuestos</h1>
          <p className="text-sm text-slate-500">
            Asociá cada impuesto con su entidad tributaria
          </p>
        </div>
      </header>

      <ImpuestosAdmin impuestos={impuestosData} entidades={entidadesData} />
    </div>
  );
}
