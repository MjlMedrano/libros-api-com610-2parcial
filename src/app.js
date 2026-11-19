const express = require('express');
const { validarLibro, parsearId } = require('./validation');
const pkg = require('../package.json');

// createApp recibe el "repositorio" (capa de datos). En producción es MySQL/RDS;
// en las pruebas es un doble en memoria, así no se necesita RDS real.
function createApp({ repo }) {
  const app = express();
  app.use(express.json());

  app.get('/health', (req, res) => {
    res.status(200).json({
      status: 'ok',
      service: 'libros-api',
      version: pkg.version,
      commit: process.env.APP_COMMIT || 'dev',
    });
  });

  app.get('/libros', async (req, res, next) => {
    try {
      res.json(await repo.listar());
    } catch (err) {
      next(err);
    }
  });

  app.get('/libros/:id', async (req, res, next) => {
    try {
      const id = parsearId(req.params.id);
      if (id === null) return res.status(400).json({ error: 'id inválido' });
      const libro = await repo.obtener(id);
      if (!libro) return res.status(404).json({ error: 'Libro no encontrado' });
      res.json(libro);
    } catch (err) {
      next(err);
    }
  });

  app.post('/libros', async (req, res, next) => {
    try {
      const { errores, valor } = validarLibro(req.body);
      if (errores.length) return res.status(400).json({ errores });
      const creado = await repo.crear(valor);
      res.status(201).json(creado);
    } catch (err) {
      next(err);
    }
  });

  app.put('/libros/:id', async (req, res, next) => {
    try {
      const id = parsearId(req.params.id);
      if (id === null) return res.status(400).json({ error: 'id inválido' });
      const { errores, valor } = validarLibro(req.body);
      if (errores.length) return res.status(400).json({ errores });
      const actualizado = await repo.actualizar(id, valor);
      if (!actualizado) return res.status(404).json({ error: 'Libro no encontrado' });
      res.json(actualizado);
    } catch (err) {
      next(err);
    }
  });

  app.delete('/libros/:id', async (req, res, next) => {
    try {
      const id = parsearId(req.params.id);
      if (id === null) return res.status(400).json({ error: 'id inválido' });
      const eliminado = await repo.eliminar(id);
      if (!eliminado) return res.status(404).json({ error: 'Libro no encontrado' });
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  });

  // Ruta inexistente
  app.use((req, res) => res.status(404).json({ error: 'Ruta no encontrada' }));

  // Manejo de errores (JSON mal formado -> 400; el resto -> 500)
  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    if (err.type === 'entity.parse.failed') {
      return res.status(400).json({ error: 'JSON inválido' });
    }
    console.error(err);
    res.status(500).json({ error: 'Error interno del servidor' });
  });

  return app;
}

module.exports = { createApp };
