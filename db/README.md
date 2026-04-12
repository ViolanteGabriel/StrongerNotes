# MongoDB local (Docker)

## Passos para rodar o banco localmente

1. Abrir o Docker Desktop e aguardar ficar em estado `Running`.
2. Entrar na pasta `db`.
3. Subir o banco:

```bash
docker compose up -d
```

4. Confirmar que o container esta ativo:

```bash
docker compose ps
```

5. (Opcional) Acompanhar logs:

```bash
docker compose logs -f mongo
```

6. Usar no backend a URI:

```bash
mongodb://127.0.0.1:27017/strongernotes
```

## Scripts de inicializacao

Os scripts em `db/init` sao executados automaticamente no primeiro startup do volume.
Arquivo atual: `db/init/01-create-users-collection.js`.

Se voce alterar scripts de init e quiser reaplicar em ambiente limpo, rode:

```bash
docker compose down -v
docker compose up -d
```

## Dicionario de comandos importantes

### Subir

```bash
docker compose up -d
```

### Ver status

```bash
docker compose ps
```

### Ver logs

```bash
docker compose logs -f mongo
```

### Parar

```bash
docker compose stop
```

### Iniciar novamente

```bash
docker compose start
```

### Derrubar (mantendo dados)

```bash
docker compose down
```

### Derrubar e apagar dados

```bash
docker compose down -v
```

