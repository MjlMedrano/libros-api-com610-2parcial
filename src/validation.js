// Validación de datos de un libro. Devuelve { errores, valor }.
function esEnteroValido(v) {
  if (typeof v === 'number') return Number.isInteger(v);
  if (typeof v === 'string') return /^-?\d+$/.test(v.trim());
  return false;
}

function validarLibro(body) {
  const errores = [];
  const b = body && typeof body === 'object' ? body : {};

  if (typeof b.titulo !== 'string' || b.titulo.trim() === '') {
    errores.push('titulo es obligatorio y no puede estar vacío');
  }
  if (typeof b.autor !== 'string' || b.autor.trim() === '') {
    errores.push('autor es obligatorio y no puede estar vacío');
  }
  if (!esEnteroValido(b.anio_publicacion)) {
    errores.push('anio_publicacion debe ser un número entero');
  }

  if (errores.length > 0) return { errores, valor: null };

  return {
    errores,
    valor: {
      titulo: b.titulo.trim(),
      autor: b.autor.trim(),
      anio_publicacion: Number(b.anio_publicacion),
    },
  };
}

// Devuelve un entero positivo o null si el id no es válido.
function parsearId(texto) {
  if (!/^\d+$/.test(texto)) return null;
  const n = Number(texto);
  return Number.isSafeInteger(n) && n > 0 ? n : null;
}

module.exports = { validarLibro, parsearId };
