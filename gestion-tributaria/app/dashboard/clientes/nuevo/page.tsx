import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "../../../../lib/prisma";
import ClienteForm from "../_components/cliente-form";

export default async function NuevoClientePage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const contador = await db.contador.findFirst({ where: { clerk_id: userId } });
  if (!contador) redirect("/dashboard");

  return <ClienteForm />;
}
