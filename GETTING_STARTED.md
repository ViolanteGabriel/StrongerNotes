# 🏁 Como Rodar o Projeto Localmente

Siga este guia para configurar o ambiente de desenvolvimento do **StrongerNotes** na sua máquina.

## 📋 Pré-requisitos

Antes de começar, você precisará ter instalado:
*   **Node.js** (Versão 18 ou superior)
*   **NPM** (Vem junto com o Node)
*   Uma conta no **MongoDB Atlas** (ou MongoDB instalado localmente)

## 📥 Instalação

1.  **Clone o repositório:**
    ```bash
    git clone https://github.com/ViolanteGabriel/StrongerNotes.git
    cd StrongerNotes
    ```

2.  **Configuração do Frontend:**
    ```bash
    cd front
    npm install
    ```

3.  **Configuração do Backend:**
    ```bash
    cd ../back
    npm install
    ```

## ⚙️ Variáveis de Ambiente

No diretório `back/`, crie um arquivo chamado `.env` baseado no `.env.example`:
```env
PORT=3333
MONGODB_URI=sua_url_do_mongodb_aqui
```

## 🚀 Executando o Projeto

Você precisará de dois terminais abertos:

### Terminal 1: Backend
```bash
cd back
npm run dev
```
O servidor rodará em `http://localhost:3333`

### Terminal 2: Frontend
```bash
cd front
npm run dev
```
A interface estará disponível em `http://localhost:5173` (ou a porta indicada no terminal).

## 🛠️ Comandos Úteis

*   `npm run build`: Verifica erros de TypeScript e gera a versão de produção.
*   `npm run lint`: Verifica padrões de código.
