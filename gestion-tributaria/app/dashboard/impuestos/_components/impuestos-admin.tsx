"use client";

import { useState } from "react";
import {
  crearImpuesto,
  eliminarImpuesto,
  modificarImpuesto,
} from "../../../../lib/actions/impuestos.actions";
import ConfirmarEliminarImpuesto from "./confirmar-eliminar-impuesto";
import ImpuestoForm from "./impuesto-form";
import ImpuestosTable from "./impuestos-table";
import MensajeAlerta from "./mensaje-alerta";
import type { Entidad, Impuesto, Mensaje } from "./types";

interface Props {
  impuestos: Impuesto[];
  entidades: Entidad[];
}

export default function ImpuestosAdmin({ impuestos, entidades }: Props) {
  const [search, setSearch] = useState("");
  const [formato, setFormato] = useState("");
  const [idEntidad, setIdEntidad] = useState("");
  const [editando, setEditando] = useState<Impuesto | null>(null);
  const [impuestoAEliminar, setImpuestoAEliminar] = useState<Impuesto | null>(null);
  const [mensaje, setMensaje] = useState<Mensaje | null>(null);
  const [cargando, setCargando] = useState(false);
  const [eliminando, setEliminando] = useState(false);

  const impuestosFiltrados = impuestos.filter((impuesto) => {
    const query = search.toLowerCase();
    return (
      impuesto.formato.toLowerCase().includes(query) ||
      impuesto.entidadNombre.toLowerCase().includes(query)
    );
  });

  function limpiarFormulario() {
    setFormato("");
    setIdEntidad("");
    setEditando(null);
  }

  function comenzarEdicion(impuesto: Impuesto) {
    setEditando(impuesto);
    setFormato(impuesto.formato);
    setIdEntidad(impuesto.idEntidad ? String(impuesto.idEntidad) : "");
    setMensaje(null);
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setCargando(true);
    setMensaje(null);

    const data = {
      formato,
      idEntidad: Number(idEntidad),
    };

    const resultado = editando
      ? await modificarImpuesto(editando.id, data)
      : await crearImpuesto(data);

    if (resultado.success) {
      setMensaje({
        tipo: "ok",
        texto: editando ? "Impuesto modificado correctamente." : "Impuesto creado correctamente.",
      });
      limpiarFormulario();
    } else {
      setMensaje({
        tipo: "error",
        texto: resultado.error || "No se pudo guardar el impuesto.",
      });
    }

    setCargando(false);
  }

  async function confirmarEliminacion() {
    if (!impuestoAEliminar) return;

    setEliminando(true);
    setMensaje(null);
    const resultado = await eliminarImpuesto(impuestoAEliminar.id);

    if (resultado.success) {
      if (editando?.id === impuestoAEliminar.id) limpiarFormulario();
      setImpuestoAEliminar(null);
      setMensaje({ tipo: "ok", texto: "Impuesto eliminado correctamente." });
    } else {
      setMensaje({
        tipo: "error",
        texto: resultado.error || "No se pudo eliminar el impuesto.",
      });
    }

    setEliminando(false);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
      <ImpuestoForm
        entidades={entidades}
        editando={editando}
        formato={formato}
        idEntidad={idEntidad}
        cargando={cargando}
        onFormatoChange={setFormato}
        onEntidadChange={setIdEntidad}
        onCancelEdit={limpiarFormulario}
        onSubmit={handleSubmit}
      />

      <section className="space-y-4">
        {mensaje && <MensajeAlerta mensaje={mensaje} />}

        <ImpuestosTable
          impuestos={impuestosFiltrados}
          totalImpuestos={impuestos.length}
          search={search}
          onSearchChange={setSearch}
          onEdit={comenzarEdicion}
          onDelete={(impuesto) => {
            setImpuestoAEliminar(impuesto);
            setMensaje(null);
          }}
        />
      </section>

      {impuestoAEliminar && (
        <ConfirmarEliminarImpuesto
          impuesto={impuestoAEliminar}
          eliminando={eliminando}
          onCancel={() => setImpuestoAEliminar(null)}
          onConfirm={confirmarEliminacion}
        />
      )}
    </div>
  );
}
