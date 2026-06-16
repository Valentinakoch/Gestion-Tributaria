import { auth } from "@clerk/nextjs/server";
import { redirect, notFound } from "next/navigation";
import { db } from "../../../../lib/prisma";
import ClienteDetalle from "./_components/cliente-detalle";

interface Props {
  params: Promise<{ cuil: string }>;
}

export default async function ClienteDetallePage({ params }: Props) {
  const { cuil } = await params;
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const contador = await db.contador.findFirst({ where: { clerk_id: userId } });
  if (!contador) redirect("/dashboard");

  const cliente = await db.cliente.findUnique({
    where: { cuil: BigInt(cuil), contador: contador.cuil },
    include: {
      liquidacion: {
        include: { impuesto: true },
        orderBy: { periodo_fiscal: "desc" },
      },
    },
  });

  if (!cliente) notFound();

  const liquidaciones = cliente.liquidacion.map((l) => ({
    id: l.numero_boleta.toString(),
    impuesto: l.impuesto?.formato ?? "Sin tipo",
    periodo: l.periodo_fiscal
      ? new Date(l.periodo_fiscal).toLocaleDateString("es-AR", { month: "long", year: "numeric" })
      : "Sin período",
    periodoDate: l.periodo_fiscal ? l.periodo_fiscal.toISOString() : null,
    importe: l.importe ?? 0,
    estado: (l.estado?.toUpperCase() === "PAGADO" ? "PAGADO" : "PENDIENTE") as "PAGADO" | "PENDIENTE",
  }));

  return (
    <ClienteDetalle
      cliente={{
        cuil,
        nombre: [cliente.nombre, cliente.apellido].filter(Boolean).join(" ") || `CUIL ${cuil}`,
        email: cliente.email ?? "-",
        telefono: cliente.telefono ?? "-",
      }}
      liquidaciones={liquidaciones}
    />
  );
}
