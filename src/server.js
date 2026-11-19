require('dotenv').config();
const { createApp } = require('./app');
const { createPool } = require('./db');
const { createMysqlRepository } = require('./repository');

const port = Number(process.env.PORT || 3000);
const app = createApp({ repo: createMysqlRepository(createPool()) });

app.listen(port, '0.0.0.0', () => {
  console.log(`libros-api escuchando en el puerto ${port}`);
});
