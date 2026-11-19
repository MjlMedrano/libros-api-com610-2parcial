// Doble de prueba de la capa de datos: guarda los libros en memoria.
// Permite ejecutar las pruebas sin una instancia RDS real.
function createFakeRepo(iniciales = []) {
  let libros = iniciales.map((l) => ({ ...l }));
  let siguienteId = libros.reduce((max, l) => Math.max(max, l.id), 0) + 1;

  return {
    async listar() {
      return libros.map((l) => ({ ...l }));
    },
    async obtener(id) {
      const l = libros.find((x) => x.id === id);
      return l ? { ...l } : null;
    },
    async crear(datos) {
      const nuevo = { id: siguienteId++, ...datos };
      libros.push(nuevo);
      return { ...nuevo };
    },
    async actualizar(id, datos) {
      const i = libros.findIndex((x) => x.id === id);
      if (i === -1) return null;
      libros[i] = { id, ...datos };
      return { ...libros[i] };
    },
    async eliminar(id) {
      const antes = libros.length;
      libros = libros.filter((x) => x.id !== id);
      return libros.length < antes;
    },
  };
}

module.exports = { createFakeRepo };
