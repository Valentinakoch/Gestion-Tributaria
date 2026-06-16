import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "../../../lib/prisma";
import ClientesTable from "./_components/clientes-table";

export default async function ClientesPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const contador = await db.contador.findFirst({ where: { clerk_id: userId } });
  if (!contador) redirect("/dashboard");

  const clientes = await db.cliente.findMany({
    where: { contador: contador.cuil },
    select: {
      cuil: true,
      nombre: true,
      apellido: true,
      email: true,
      liquidacion: { select: { estado: true } },
    },
    orderBy: [{ apellido: "asc" }, { nombre: "asc" }],
  });

  const clientesData = clientes.map((c) => ({
    cuil: c.cuil.toString(),
    nombre: [c.nombre, c.apellido].filter(Boolean).join(" ") || `CUIL ${c.cuil}`,
    email: c.email ?? "-",
    estado: c.liquidacion.some((l) => l.estado?.toUpperCase() === "PENDIENTE")
      ? ("pendiente" as const)
      : ("al_dia" as const),
  }));

  return <ClientesTable clientes={clientesData} />;
}
