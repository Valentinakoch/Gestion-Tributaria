import { AlertTriangle, CheckCircle } from "lucide-react";
import type { Mensaje } from "./types";

interface Props {
  mensaje: Mensaje;
}

export default function MensajeAlerta({ mensaje }: Props) {
  return (
    <div
      className={`flex items-center gap-2 p-3 rounded-lg text-sm font-medium ${
        mensaje.tipo === "ok"
          ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
          : "bg-red-50 text-red-800 border border-red-200"
      }`}
    >
      {mensaje.tipo === "ok" ? (
        <CheckCircle className="h-4 w-4 shrink-0" />
      ) : (
        <AlertTriangle className="h-4 w-4 shrink-0" />
      )}
      {mensaje.texto}
    </div>
  );
}
