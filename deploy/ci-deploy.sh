#!/usr/bin/env bash
#
# Único comando que puede ejecutar la clave SSH del CI. En authorized_keys del
# usuario `ci` va restringida con:
#
#   command="/opt/daodent/ci-deploy.sh",no-agent-forwarding,no-port-forwarding,no-pty,no-X11-forwarding ssh-ed25519 AAAA... gh-actions
#
# Con eso, quien robe el secreto de GitHub no obtiene una shell: obtiene el
# derecho a desplegar. Por eso el fichero debe pertenecer a `deploy` y NO ser
# escribible por `ci` — si el CI pudiera reescribirlo, la restricción no valdría
# nada:
#   sudo chown deploy:daodent /opt/daodent/ci-deploy.sh
#   sudo chmod 750 /opt/daodent/ci-deploy.sh
#
set -euo pipefail

cd /opt/daodent

# SSH_ORIGINAL_COMMAND lo manda el cliente y no es de fiar: se compara contra una
# lista blanca y nunca se interpola dentro de otro comando.
TARGET="${SSH_ORIGINAL_COMMAND:-}"

deploy_service() {
  local svc="$1"
  echo ">> Descargando imagen de $svc"
  docker compose pull "$svc"

  echo ">> Recreando $svc"
  # `up -d` para el contenedor viejo antes de arrancar el nuevo, que es justo lo
  # que exige la regla de una sola instancia del backend.
  docker compose up -d "$svc"

  echo ">> Estado"
  docker compose ps "$svc"
}

case "$TARGET" in
  back)
    deploy_service backend
    ;;
  front)
    deploy_service frontend
    ;;
  *)
    echo "Destino invalido: '$TARGET' (use back|front)" >&2
    exit 1
    ;;
esac

# Sin esto el disco se llena de imágenes viejas en cuestión de meses. La ventana
# de 7 días deja margen para volver atrás a una etiqueta anterior.
docker image prune -f --filter "until=168h" >/dev/null

echo ">> OK"
