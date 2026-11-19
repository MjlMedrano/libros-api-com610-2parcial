const request = require('supertest');
const { createApp } = require('../src/app');
const { createFakeRepo } = require('./helpers/fakeRepo');

const libroValido = {
  titulo: 'Cien años de soledad',
  autor: 'Gabriel García Márquez',
  anio_publicacion: 1967,
};

let app;
beforeEach(() => {
  app = createApp({ repo: createFakeRepo() });
});

describe('GET /health', () => {
  test('responde 200 e indica que el servicio está activo', async () => {
    const res = await request(app).get('/health');
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.version).toBeDefined();
  });
});

describe('POST /libros', () => {
  test('crea un libro válido y responde 201 con el registro creado', async () => {
    const res = await request(app).post('/libros').send(libroValido);
    expect(res.statusCode).toBe(201);
    expect(res.body).toMatchObject(libroValido);
    expect(res.body.id).toBeDefined();
  });

  test.each([
    ['titulo vacío', { ...libroValido, titulo: '   ' }],
    ['autor vacío', { ...libroValido, autor: '' }],
    ['sin titulo', { autor: 'X', anio_publicacion: 2000 }],
    ['anio no numérico', { ...libroValido, anio_publicacion: 'abc' }],
    ['anio decimal', { ...libroValido, anio_publicacion: 1999.5 }],
    ['anio ausente', { titulo: 'X', autor: 'Y' }],
  ])('rechaza datos inválidos con 400 (%s)', async (_nombre, body) => {
    const res = await request(app).post('/libros').send(body);
    expect(res.statusCode).toBe(400);
    expect(res.body.errores).toBeDefined();
  });

  test('rechaza un JSON mal formado con 400', async () => {
    const res = await request(app)
      .post('/libros')
      .set('Content-Type', 'application/json')
      .send('{"titulo": ');
    expect(res.statusCode).toBe(400);
  });
});

describe('GET /libros y GET /libros/:id', () => {
  test('lista los libros almacenados', async () => {
    await request(app).post('/libros').send(libroValido);
    const res = await request(app).get('/libros');
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveLength(1);
  });

  test('devuelve un libro existente', async () => {
    const { body } = await request(app).post('/libros').send(libroValido);
    const res = await request(app).get(`/libros/${body.id}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.titulo).toBe(libroValido.titulo);
  });

  test('responde 404 al consultar un libro inexistente', async () => {
    const res = await request(app).get('/libros/9999');
    expect(res.statusCode).toBe(404);
  });
});

describe('PUT /libros/:id', () => {
  test('actualiza un libro existente', async () => {
    const { body } = await request(app).post('/libros').send(libroValido);
    const res = await request(app)
      .put(`/libros/${body.id}`)
      .send({ ...libroValido, titulo: 'Título nuevo' });
    expect(res.statusCode).toBe(200);
    expect(res.body.titulo).toBe('Título nuevo');
  });

  test('responde 404 si el libro no existe', async () => {
    const res = await request(app).put('/libros/9999').send(libroValido);
    expect(res.statusCode).toBe(404);
  });

  test('responde 400 con datos inválidos', async () => {
    const { body } = await request(app).post('/libros').send(libroValido);
    const res = await request(app).put(`/libros/${body.id}`).send({ titulo: '' });
    expect(res.statusCode).toBe(400);
  });
});

describe('DELETE /libros/:id', () => {
  test('elimina un libro existente', async () => {
    const { body } = await request(app).post('/libros').send(libroValido);
    const res = await request(app).delete(`/libros/${body.id}`);
    expect(res.statusCode).toBe(204);
    const consulta = await request(app).get(`/libros/${body.id}`);
    expect(consulta.statusCode).toBe(404);
  });

  test('responde 404 si el libro no existe', async () => {
    const res = await request(app).delete('/libros/9999');
    expect(res.statusCode).toBe(404);
  });
});
