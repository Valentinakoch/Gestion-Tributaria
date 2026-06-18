export interface Impuesto {
  id: number;
  formato: string;
  idEntidad: number | null;
  entidadNombre: string;
  entidadUrl: string;
  liquidacionesAsociadas: number;
}

export interface Entidad {
  id: number;
  nombre: string;
}

export type Mensaje = { tipo: "ok" | "error"; texto: string };
