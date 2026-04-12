# Backend README

## Estrutura recomendada para crescer o backend

Para manter organização por domínio, adotar a estrutura abaixo:

```text
src/
    app.ts
    server.ts
    env/
        index.ts
    modules/
        users/
            users.routes.ts
            users.controller.ts
            users.service.ts
            users.schema.ts
            users.model.ts
```

## Convenções por camada

- Rotas
    - Local: `src/modules/<dominio>/<dominio>.routes.ts`
    - Responsabilidade: mapear método e caminho HTTP, delegar para controller.

- Controllers
    - Local: `src/modules/<dominio>/<dominio>.controller.ts`
    - Responsabilidade: receber request, chamar service, montar response.

- Services
    - Local: `src/modules/<dominio>/<dominio>.service.ts`
    - Responsabilidade: regra de negócio e orquestração de operações.

- Schemas (validação)
    - Local: `src/modules/<dominio>/<dominio>.schema.ts`
    - Responsabilidade: validar body, params e querystring com Zod.

- Models
    - Local: `src/modules/<dominio>/<dominio>.model.ts` ou `src/models/`
    - Responsabilidade: schema Mongoose e acesso à coleção.

## Padrão de rotas

- Prefixo de API: `/api/v1`
- Exemplo para usuários:
    - `GET /api/v1/users`
    - `POST /api/v1/users`
    - `GET /api/v1/users/:id`

## Padrão de respostas

- Sucesso: `{ data, message? }`
- Erro: `{ error, details? }`

## Códigos HTTP sugeridos

- `200` e `201` para sucesso
- `400` para erro de validação
- `401` e `403` para autenticação/autorização
- `404` para recurso não encontrado
- `409` para conflito de dados