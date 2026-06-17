import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "../../../lib/prisma";
import { Upload } from "lucide-react";
import SubirForm from "./_components/subir-form";

export default async function SubirPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const contador = await db.contador.findFirst({
    where: { clerk_id: userId },
    select: { cuil: true, id_estudio: true },
  });
  if (!contador) redirect("/dashboard");

  const [clientes, impuestos] = await Promise.all([
    db.cliente.findMany({
      where: { id_estudio: contador.id_estudio },
      select: { cuil: true, nombre: true, apellido: true },
    }),
    db.impuesto.findMany({ select: { id_impuesto: true, formato: true } }),
  ]);

  const clientesData = clientes.map((c) => ({
    id: c.cuil.toString(),
    nombre: [c.nombre, c.apellido].filter(Boolean).join(" ") || `Cliente CUIL: ${c.cuil}`,
  }));

  return (
    <div>
      <header className="flex items-center gap-3 mb-8">
        <div className="h-10 w-10 rounded-xl bg-brand-dark flex items-center justify-center text-white">
          <Upload className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Subir Liquidación</h1>
          <p className="text-sm text-slate-500">Nuevo registro impositivo</p>
        </div>
      </header>
      <SubirForm clientes={clientesData} impuestos={impuestos} />
    </div>
  );
}
