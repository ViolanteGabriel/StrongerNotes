# Frontend - StrongerNotes

Aplicacao frontend em React + Vite + TypeScript.

## Estrutura de arquivos

Estrutura principal dentro de `src`:

```text
src/
	assets/
	components/
	pages/
	services/
	App.tsx
	main.tsx
	index.css
```

### Responsabilidade de cada pasta

- `pages/`
	- Telas da aplicacao (exemplo: login, cadastro, landing).
	- Cada pagina representa uma rota ou uma secao principal da interface.

- `services/`
	- Integracoes externas, principalmente chamadas HTTP para o backend.
	- Exemplo atual: cliente Axios em `services/requests/api.tsx`.

- `assets/`
	- Recursos estaticos usados na interface.
	- Exemplo: imagens, icones, ilustracoes e arquivos de fonte.

- `components/`
	- Componentes reutilizaveis de UI e blocos compartilhados entre paginas.
	- Exemplo: botoes, inputs, modais, cards, layout wrappers.
	- Observacao: se a pasta ainda nao existir no projeto, crie quando comecar a extrair componentes compartilhados.

### Arquivos de entrada

- `main.tsx`
	- Ponto de entrada do React.
	- Inicializa providers globais e renderiza a aplicacao.

- `App.tsx`
	- Composicao principal da aplicacao (roteamento, layout raiz e estado global de alto nivel).

- `index.css`
	- Estilos globais.

## Primeira execucao local

1. Entre na pasta `front`.
2. Instale as dependencias:

```bash
npm install
```

3. Crie o arquivo `.env` com base no `.env.example`.

Opcao manual:
- Crie um arquivo chamado `.env` na raiz do front.
- Copie o conteudo de `.env.example` para `.env`.

Opcao via PowerShell:

```powershell
Copy-Item .env.example .env
```

4. Confira a variavel obrigatoria:

```env
VITE_API_URL=http://localhost:3333
```

5. Rode o projeto:

```bash
npm run dev
```

6. Abra no navegador a URL exibida pelo Vite (geralmente `http://localhost:5173`).