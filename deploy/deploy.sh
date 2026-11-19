#!/usr/bin/env bash
# Se ejecuta EN la instancia EC2 (el workflow lo envía por SSH).
# Variables requeridas: IMAGE (usuario/libros-api:<sha>). Opcional: EXPECTED_COMMIT, ENV_FILE.
# La configuración de RDS vive en ~/libros.env (fuera del repositorio y de la imagen).
set -uo pipefail

IMAGE="${IMAGE:?Falta IMAGE}"
EXPECTED_COMMIT="${EXPECTED_COMMIT:-}"
ENV_FILE="${ENV_FILE:-$HOME/libros.env}"
APP="libros-api"
CANDIDATA="libros-api-candidata"

[ -f "$ENV_FILE" ] || { echo "No existe $ENV_FILE"; exit 1; }

# Imagen que está corriendo hoy (para poder restaurarla)
PREV_IMAGE="$(docker inspect -f '{{.Config.Image}}' "$APP" 2>/dev/null || true)"
echo "Versión anterior: ${PREV_IMAGE:-ninguna}"

# Comprueba /health y /libros en la URL base indicada (con reintentos)
verificar() {
  local base="$1"
  for _ in $(seq 1 15); do
    if curl -fsS "$base/health" > /tmp/health.json && curl -fsS "$base/libros" > /dev/null; then
      if [ -z "$EXPECTED_COMMIT" ] || grep -q "$EXPECTED_COMMIT" /tmp/health.json; then
        return 0
      fi
    fi
    sleep 2
  done
  return 1
}

arrancar() { # $1 = imagen, $2 = nombre, $3 = puerto publicado en 127.0.0.1
  docker run -d --name "$2" --restart unless-stopped \
    --env-file "$ENV_FILE" -p "127.0.0.1:$3:3000" "$1"
}

echo "== 1. Descargando $IMAGE"
docker pull "$IMAGE" || exit 1

echo "== 2. Probando la imagen nueva en un contenedor candidato (puerto 3001, solo local)"
docker rm -f "$CANDIDATA" > /dev/null 2>&1 || true
arrancar "$IMAGE" "$CANDIDATA" 3001 > /dev/null
if ! verificar "http://127.0.0.1:3001"; then
  echo "La versión nueva NO supera la comprobación. Se conserva la versión anterior."
  docker logs --tail 30 "$CANDIDATA" || true
  docker rm -f "$CANDIDATA" > /dev/null 2>&1 || true
  exit 1
fi
docker rm -f "$CANDIDATA" > /dev/null 2>&1 || true

echo "== 3. Reemplazando el contenedor activo (Nginx -> 127.0.0.1:3000)"
docker rm -f "$APP" > /dev/null 2>&1 || true
arrancar "$IMAGE" "$APP" 3000 > /dev/null

echo "== 4. Verificando a través de Nginx (puerto 80)"
if verificar "http://127.0.0.1"; then
  echo "Despliegue correcto: $IMAGE"
  docker image prune -f > /dev/null 2>&1 || true
  exit 0
fi

echo "Falló la verificación final. Restaurando la versión anterior."
docker rm -f "$APP" > /dev/null 2>&1 || true
if [ -n "$PREV_IMAGE" ]; then
  arrancar "$PREV_IMAGE" "$APP" 3000 > /dev/null
  echo "Restaurada: $PREV_IMAGE"
fi
exit 1
