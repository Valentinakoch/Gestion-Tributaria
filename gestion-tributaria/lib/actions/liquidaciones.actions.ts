"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "../prisma";
import { revalidatePath } from "next/cache";
import { createClient } from "@supabase/supabase-js";

// Inicializamos el cliente de Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function crearLiquidacion(formData: FormData) {
  const { userId } = await auth();
  if (!userId) return { error: "No autenticado." };

  try {
    const cuilCliente = formData.get("cuilCliente") as string;
    const idImpuesto = Number(formData.get("idImpuesto"));
    const monto = Number(formData.get("monto"));
    const periodo = formData.get("periodo") as string;
    const archivo = formData.get("archivo") as File;

    // 1. Subir archivo a Supabase Storage
    const fileName = `${cuilCliente}/${periodo}-${Date.now()}.pdf`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("comprobantes")
      .upload(fileName, archivo);

    if (uploadError) throw new Error("Error al subir el archivo.");

    // 2. Obtener la URL pública
    const { data: { publicUrl } } = supabase.storage.from("comprobantes").getPublicUrl(fileName);

    const [anio, mes] = periodo.split("-").map(Number);
    const periodoDate = new Date(anio, mes - 1, 15);

    await db.liquidacion.create({
      data: {
        periodo_fiscal: periodoDate,
        importe: monto,
        estado: "PENDIENTE",
        cuil_cliente: BigInt(cuilCliente),
        id_impuesto: idImpuesto,
        url_archivo: publicUrl, 
      },
    });

    revalidatePath("/dashboard");
    return { success: true };
  } catch (error: any) {
    console.error(error);
    return { error: error.message || "Error al crear la liquidación." };
  }
}
