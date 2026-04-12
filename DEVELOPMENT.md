# 🛠️ Fluxo de Desenvolvimento - StrongerNotes

Este documento detalha o processo de colaboração e os padrões técnicos que estabelecemos para garantir a qualidade e a consistência do projeto.

## 🚀 Ciclo de Trabalho

Adotamos o modelo de **Feature Branches**. Nunca trabalhe diretamente na branch `main`.

1.  **Criação de Branch:** Para cada nova funcionalidade ou correção, crie uma branch descritiva (ex: `feat/login-page` ou `fix/db-connection`).
2.  **Desenvolvimento:** Realize suas alterações na sua branch.
3.  **Pull Request (PR):** Ao finalizar, abra um PR para a branch `main` do repositório original.
4.  **Revisão:** Pelo menos um colega deve revisar o código antes do merge.
5.  **Merge:** Após a aprovação e a garantia de que os testes/build estão passando, o código é integrado à `main`.

## 🎨 Padrões de Código e UI

*   **Idioma:** Todo o código (nomes de variáveis, funções, comentários) e a interface do usuário (UI) **devem ser em Inglês**. O README permanece em Português por ser um requisito acadêmico.
*   **Tema Científico:** Utilizamos uma paleta baseada em psicologia das cores para transmitir precisão e foco:
    *   **Primary (Cyan):** Para ações principais e destaque técnico.
    *   **Surface (Slate/Neutral):** Para sobriedade e robustez.
*   **Dark Mode:** O sistema deve sempre suportar os temas Light e Dark de forma consistente.

## 🗺️ Roadmap de Desenvolvimento

Estamos seguindo um plano dividido em fases:

*   **Fase 1 (Atual):** Fundação da API (Fastify) e Conexão com Banco de Dados (Mongoose).
*   **Fase 2:** Sistema de Autenticação (JWT + Bcrypt) e Segurança.
*   **Fase 3:** Engine de Treinos (Criação de fichas e registro de séries).
*   **Fase 4:** Visualização de Dados (Gráficos de evolução e progresso).

---
*Este documento serve como guia para manter a organização do time de 4 pessoas. Vamos evoluir juntos!* 🏋️‍♂️
