# MongoDB local (Docker)

## Scripts de inicializacao

Os scripts em `db/init` sao executados automaticamente no primeiro startup do volume.
Arquivo atual: `db/init/01-create-users-collection.js`.

## Subir

docker compose up -d

## Ver status

docker compose ps

## Ver logs

docker compose logs -f mongo

## Parar

docker compose stop

## Iniciar novamente

docker compose start

## Derrubar (mantendo dados)

docker compose down

## Derrubar e apagar dados

docker compose down -v

> Use `down -v` quando quiser reaplicar scripts de inicializacao em um ambiente limpo.

## URI para o backend

mongodb://127.0.0.1:27017/strongernotes
