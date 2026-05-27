import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("La variable DATABASE_URL no está definida.");
  console.error("Ejecutá: set DATABASE_URL=postgresql://...");
  process.exit(1);
}

const prisma = new PrismaClient({
  adapter: new PrismaNeon({ connectionString: DATABASE_URL }),
});

async function main() {
  const cuil = "20901234569";
  const clerkId = "user_3EJJaBVKdlCqD40E4PglLpJyUPR";

  const estudio = await prisma.estudio_contable.findFirst();
  if (!estudio) {
    console.error("No hay estudio_contable. Ejecutá primero el seed.");
    process.exit(1);
  }

  const clienteExistente = await prisma.cliente.findUnique({ where: { cuil: BigInt(cuil) } });
  if (clienteExistente) {
    console.log("El cliente con CUIL", cuil, "ya existe.");
  } else {
    await prisma.usuario.create({
      data: {
        CUIL_usuario: BigInt(cuil),
        nombre_usuario: "cliente",
        apellido_usuario: null,
        email: "cliente@example.com",
        telefono: null,
      },
    });
    await prisma.cliente.create({
      data: { cuil: BigInt(cuil), id_estudio: estudio.id_estudio },
    });
    console.log("usuario + cliente creados.");
  }

  const clerkExistente = await prisma.clerk_user.findUnique({ where: { id: clerkId } });
  if (clerkExistente) {
    console.log("El clerk_user ya existe. Actualizando CUIL...");
    await prisma.clerk_user.update({
      where: { id: clerkId },
      data: { cuil, rol: "cliente" },
    });
  } else {
    await prisma.clerk_user.create({
      data: {
        id: clerkId,
        email: "cliente@example.com",
        firstName: "cliente",
        lastName: null,
        cuil,
        rol: "cliente",
      },
    });
    console.log("clerk_user creado.");
  }

  console.log("Todo listo. Iniciá sesión con Clerk y usá CUIL:", cuil);
}

main()
  .catch((e) => {
    console.error("Error:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
