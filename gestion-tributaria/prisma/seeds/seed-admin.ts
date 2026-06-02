import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL no definida");
  process.exit(1);
}

const prisma = new PrismaClient({
  adapter: new PrismaNeon({ connectionString: DATABASE_URL }),
});

async function main() {
  const cuil = "12345678911";
  const cuilNum = BigInt(cuil);
  const clerkId = "user_3EJJs1npSpJinSKMvobwUsFwrJj";

  // 1. Crear usuario
  const usuarioExistente = await prisma.usuario.findUnique({ where: { CUIL_usuario: cuilNum } });
  if (!usuarioExistente) {
    await prisma.usuario.create({
      data: {
        CUIL_usuario: cuilNum,
        nombre_usuario: "admin",
        apellido_usuario: null,
        email: "admin@example.com",
        telefono: null,
      },
    });
    console.log("usuario creado");
  }

  // 2. Crear administrador
  const adminExistente = await prisma.contador.findUnique({ where: { cuil: cuilNum } });
  if (!adminExistente) {
    await prisma.contador.create({
      data: { cuil: cuilNum, id_estudio: 3 },
    });
    console.log("administrador creado");
  }

  // 3. Crear clerk_user
  await prisma.clerk_user.upsert({
    where: { id: clerkId },
    create: { id: clerkId, email: "admin@example.com", firstName: "admin", cuil, rol: "admin" },
    update: { cuil, rol: "admin" },
  });
  console.log("clerk_user actualizado");

  // 4. Obtener algunos clientes para crear turnos
  const clientes = await prisma.cliente.findMany({ take: 2 });
  if (clientes.length === 0) {
    console.log("No hay clientes para asignar turnos.");
    return;
  }

  for (let i = 0; i < clientes.length; i++) {
    const cliente = clientes[i];
    const fecha = new Date(2025, 5, 20 + i);
    const hora = new Date();
    hora.setHours(11 + i, 0, 0, 0);

    const exists = await prisma.turno.findUnique({
      where: {
        fecha_hora_cuil_contador_cuil_cliente: {
          fecha, hora, cuil_contador: cuilNum, cuil_cliente: cliente.cuil,
        },
      },
    });

    if (!exists) {
      await prisma.turno.create({
        data: { cuil_cliente: cliente.cuil, cuil_contador: cuilNum, fecha, hora },
      });
      console.log(`turno creado: ${fecha.toISOString().slice(0, 10)} ${hora.toISOString().slice(11, 16)} cliente=${cliente.cuil}`);
    }
  }

  console.log("Admin de prueba listo. CUIL:", cuil);
}

main()
  .catch((e) => {
    console.error("Error:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
