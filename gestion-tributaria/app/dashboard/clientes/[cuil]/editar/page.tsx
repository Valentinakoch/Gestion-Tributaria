import { auth } from "@clerk/nextjs/server";
import { redirect, notFound } from "next/navigation";
import { db } from "../../../../../lib/prisma";
import ClienteForm from "../../_components/cliente-form";

interface Props {
  params: Promise<{ cuil: string }>;
}

export default async function EditarClientePage({ params }: Props) {
  const { cuil } = await params;
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const contador = await db.contador.findFirst({ where: { clerk_id: userId } });
  if (!contador) redirect("/dashboard");

  const cliente = await db.cliente.findUnique({
    where: { cuil: BigInt(cuil), contador: contador.cuil },
  });

  if (!cliente) notFound();

  return (
    <ClienteForm
      initialData={{
        cuil,
        nombre: cliente.nombre ?? "",
        apellido: cliente.apellido ?? "",
        email: cliente.email ?? "",
        telefono: cliente.telefono ?? "",
      }}
    />
  );
}
