# Frontend Overview

## Objetivo
Painel mínimo para testar fluxos da API (login, perfil /me, CRUD de usuários e reset de senha) sem precisar de curl manual.

## Stack
- Vite + React + TypeScript
- Axios para chamadas HTTP (env `VITE_API_URL`)
- CSS simples em `src/styles.css`

## Estrutura
- `src/api`: cliente axios com injeção de token e tipos compartilhados.
- `src/pages`: telas de Login, Profile (/me), Users (admin), ResetPassword e troca de senha autenticada.
- `src/components`: UI compartilhada (ex.: navegação).
- `src/styles.css`: tema leve focado em formularios.

## Execução
```bash
cd nexus-admin
cp .env.example .env   # ajuste VITE_API_URL se não usar compose
npm install
npm run dev            # porta 5173
npm run build          # saída em dist/
```

## Docker
- Build manual: `docker build -t nexus-admin .`
- Via compose (recomendado):
```bash
docker-compose up --build admin
# acessível em http://localhost:3000
```
Compose já aponta `VITE_API_URL` para `http://api:8080/api/v1` na mesma rede.

## Uso rápido
1) Faça login (ex.: admin seed `admin@example.com` / `admin123` ou qualquer usuário da base).
2) A aba **Meu Perfil** chama `/me` para ver/editar nome e email; funciona para qualquer role.
3) Dentro do perfil há **Alterar senha** que usa `/me/change-password` com a senha atual + nova.
4) A aba **Reset de Senha** (visível mesmo deslogado) usa `/forgot-password` e `/reset-password`; o token chega por email via SMTP Brevo (configure `SMTP_KEY`, `EMAIL_FROM` e `EMAIL_SEND_ENABLED=true` no backend).
5) A aba **Usuários** só aparece e funciona se o token for de admin (roleId 1); caso contrário, a navegação volta para o perfil com aviso. Nela é possível criar usuários, desativar (soft delete), reativar e remover permanentemente (rota `/users/:id/permanent`).
