// Capa de datos real: MySQL/MariaDB en RDS. Todas las consultas son parametrizadas.
const COLUMNAS = 'id, titulo, autor, anio_publicacion';

function createMysqlRepository(pool) {
  async function obtener(id) {
    const [rows] = await pool.execute(`SELECT ${COLUMNAS} FROM libros WHERE id = ?`, [id]);
    return rows[0] || null;
  }

  return {
    async listar() {
      const [rows] = await pool.execute(`SELECT ${COLUMNAS} FROM libros ORDER BY id`);
      return rows;
    },

    obtener,

    async crear({ titulo, autor, anio_publicacion }) {
      const [result] = await pool.execute(
        'INSERT INTO libros (titulo, autor, anio_publicacion) VALUES (?, ?, ?)',
        [titulo, autor, anio_publicacion]
      );
      return obtener(result.insertId);
    },

    async actualizar(id, { titulo, autor, anio_publicacion }) {
      if (!(await obtener(id))) return null;
      await pool.execute(
        'UPDATE libros SET titulo = ?, autor = ?, anio_publicacion = ? WHERE id = ?',
        [titulo, autor, anio_publicacion, id]
      );
      return obtener(id);
    },

    async eliminar(id) {
      const [result] = await pool.execute('DELETE FROM libros WHERE id = ?', [id]);
      return result.affectedRows > 0;
    },
  };
}

module.exports = { createMysqlRepository };
