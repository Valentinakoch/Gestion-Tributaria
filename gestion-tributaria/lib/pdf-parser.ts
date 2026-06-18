
export function procesarDatosExtraidos(textoRaw: string, montoEsperado?: number) {
  // 1. Normalizar espacios y limpiar el texto crudo
  const texto = textoRaw.replace(/\s+/g, ' ');

  let montoEncontrado: number | null = null;
  let nombre: string | null = null;

  const regexMontos = /\$\s*([\d.]+,\d{2}|[\d,]+\.\d{2}|\d+)/g;
  
  let match;
  const todosLosMontos: number[] = [];

  // Recorremos todo el texto extrayendo cada número que tenga un $ adelante
  while ((match = regexMontos.exec(texto)) !== null) {
    if (match[1]) {
      let montoStr = match[1].replace(/\s/g, '');
      
      // Convertir formato ES-AR (1.250,50 o 1250,50) a flotante válido de JS (1250.50)
      if (montoStr.includes(',') && montoStr.includes('.')) {
        montoStr = montoStr.replace(/\./g, '').replace(',', '.');
      } else if (montoStr.includes(',')) {
        montoStr = montoStr.replace(',', '.');
      }
      
      const valorNumerico = parseFloat(montoStr);
      if (!isNaN(valorNumerico)) {
        todosLosMontos.push(valorNumerico);
      }
    }
  }

  if (todosLosMontos.length > 0) {
    if (montoEsperado !== undefined) {
      // Si conocemos el monto de la liquidación, buscamos si alguno coincide exactamente (con tolerancia de 1 centavo)
      const coincidenciaExacta = todosLosMontos.find(
        (m) => Math.abs(m - montoEsperado) <= 0.01
      );
      
      // Si hubo coincidencia exacta en algún lado del documento, usamos ese.
      // Si no, por fallback nos quedamos con el más alto (suele ser el Total).
      montoEncontrado = coincidenciaExacta !== undefined ? coincidenciaExacta : Math.max(...todosLosMontos);
    } else {
      // Si no hay monto esperado contra el cual comparar, asumimos que el Total es el máximo valor del documento
      montoEncontrado = Math.max(...todosLosMontos);
    }
  }

  const regexNombre = /(?:cliente|contribuyente|a nombre de|razon social|nombre)(?:\s*:\s*|\s+)([A-ZÁÉÍÓÚÑa-záéíóúñ\s]{3,35})/i;
  const matchNombre = texto.match(regexNombre);
  if (matchNombre && matchNombre[1]) {
    nombre = matchNombre[1].trim();
  }

  return {
    monto: montoEncontrado || undefined,
    nombre: nombre || undefined
  };
}