const mysql = require('mysql2/promise');

// La conexión se configura SOLO con variables de entorno (nada de credenciales en el código).
function createPool() {
  return mysql.createPool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    connectTimeout: 10000,
  });
}

module.exports = { createPool };
