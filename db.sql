-- Crea la base de datos y la tabla `libros` (MySQL / MariaDB).
-- Uso:  mysql -h <ENDPOINT_RDS> -u admin -p < db.sql
CREATE DATABASE IF NOT EXISTS libros_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE libros_db;

CREATE TABLE IF NOT EXISTS libros (
  id INT AUTO_INCREMENT PRIMARY KEY,
  titulo VARCHAR(200) NOT NULL,
  autor VARCHAR(150) NOT NULL,
  anio_publicacion INT NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
