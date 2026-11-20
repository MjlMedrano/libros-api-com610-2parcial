# API de Libros — COM610, Segundo Examen Parcial

**Autor:** Adrian Mijael Medrano Medrano · **Asignatura:** Trabajando en la Nube (COM610) · USFX

API REST de libros (Node.js + Express) desplegada en **Amazon EC2** con persistencia en **Amazon RDS (MySQL)**, publicada con **Nginx** (proxy inverso, puerto 80) y entregada con **GitHub Actions** (CI/CD con Docker).

## Enlaces de la entrega

| Elemento | Enlace |
|---|---|
| URL pública de la API | `http://http://54.20.111.181/` |
| Health check | `http://http://54.20.111.181/health` |
| Ejecución exitosa de CI | `https://github.com/MjlMedrano/libros-api-com610-2parcial/actions/runs/44620492398` |
| Ejecución exitosa de CD | `https://github.com/MjlMedrano/libros-api-com610-2parcial/actions/runs/44620492219` |
| Imagen en Docker Hub | `https://hub.docker.com/repository/docker/adrianmedrano15/libros-api` |

## Endpoints

| Método y ruta | Descripción | Respuestas |
|---|---|---|
| `GET /health` | Estado del servicio, versión y commit | 200 |
| `GET /libros` | Lista los libros de RDS | 200 |
| `GET /libros/:id` | Obtiene un libro | 200 / 400 / 404 |
| `POST /libros` | Crea un libro | 201 / 400 |
| `PUT /libros/:id` | Actualiza un libro | 200 / 400 / 404 |
| `DELETE /libros/:id` | Elimina un libro | 204 / 404 |

Cuerpo JSON: `{ "titulo": "...", "autor": "...", "anio_publicacion": 1967 }`.
Validación: `titulo` y `autor` no vacíos, `anio_publicacion` entero; si no, `400`. Todas las consultas SQL son parametrizadas.

## Estructura

```
src/            código de la API (app.js, repository.js, db.js, server.js, validation.js)
tests/          pruebas Jest + Supertest con un doble de la capa de datos (sin RDS real)
deploy/         deploy.sh (despliegue con health check y rollback) y nginx-libros.conf
db.sql          creación de la base de datos y la tabla `libros`
Dockerfile      imagen multi-stage
.github/workflows/ci.yml, cd.yml
evidencias/     capturas de pantalla
```

## Ejecutar localmente

```bash
npm ci
cp .env.example .env      #  (el archivo .env NO se sube al repositorio)
npm start                 # http://localhost:3000/health
```

## Ejecutar las pruebas

```bash
npm test
```

Las pruebas usan un repositorio en memoria (`tests/helpers/fakeRepo.js`), por lo que **no requieren RDS**.

## Docker

```bash
docker build -t libros-api:local .
docker run -d --name libros-local -p 3000:3000 --env-file .env libros-api:local
curl http://localhost:3000/health
```

La configuración de RDS entra solo por variables de entorno (`DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`).

## Recursos de AWS utilizados

| Recurso | Nombre | Detalle |
|---|---|---|
| EC2 | `amm-libros-ec2` | Ubuntu 24.04, t3.micro/t2.micro, Nginx + Docker |
| RDS | `amm-libros-rds` | MySQL, **acceso público deshabilitado**, misma VPC que EC2 |
| SG de EC2 | (`amm-ec2-sg`)  | 22 solo desde mi IP; 80 desde Internet |
| SG de RDS | (`amm-rds-sg`)  | 3306 únicamente desde el SG de EC2 |

Los puertos 3000 y 3306 no se publican a Internet: la API escucha en `127.0.0.1:3000` y solo Nginx (puerto 80) la expone.

## Pipeline

- **CI (`ci.yml`)**: en cada `push` y `pull_request` hacia `main` ejecuta `npm ci` y `npm test`.
- **CD (`cd.yml`)**, solo en `push` a `main`: `test` → `build-push` (imagen `usuario/libros-api:<SHA>` en Docker Hub) → `deploy` (SSH a EC2 y ejecución de `deploy/deploy.sh`).
- **Despliegue seguro**: la imagen nueva se prueba primero en un contenedor candidato (puerto 3001, solo local) con `/health` y `/libros`; si falla, el workflow falla y la versión anterior sigue activa. Tras reemplazarla se verifica de nuevo por Nginx y, si falla, se restaura la imagen anterior.
- **SSH**: el puerto 22 permanece abierto solo para mi IP; el workflow abre la IP del runner de forma temporal y la cierra siempre al terminar.
- **Secrets de GitHub Actions** (solo nombres): `DOCKERHUB_USERNAME`, `DOCKERHUB_TOKEN`, `EC2_HOST`, `EC2_USER`, `EC2_SSH_KEY`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`, `EC2_SG_ID`.
- La configuración de RDS vive en `~/libros.env` dentro de EC2, fuera del repositorio y de la imagen.

## Cómo verificar el despliegue

```bash
curl http://54.20.111.181/health       # {"status":"ok","service":"libros-api","version":"...","commit":"<sha>"}
curl http://54.20.111.181/libros
```

El campo `commit` coincide con el SHA del último despliegue exitoso y `version` refleja `package.json`.

## Evidencias

Ver la carpeta [`evidencias/`](./evidencias).
