<p align="center">
  <a href="README.md">🇺🇸 Read in English</a>
</p>

# Nexus Admin

O **Nexus Admin** é a interface administrativa da plataforma Nexus. Ele é usado para operar o sistema (fluxos restritos a admin) e validar o comportamento da API sem precisar de `curl` manual.

## Responsabilidades
- Fornecer uma interface web de administração conectada à `nexus-api`.
- Cobrir fluxos administrativos comuns (login, gestão de usuários, reset de senha, perfil).
- Servir os arquivos estáticos via Nginx quando executado em Docker.
- Aplicar um gate de UI baseado no `/me` e no papel Super Admin (role 1).

## Requisitos
- Node.js + npm (para desenvolvimento local) ou Docker (recomendado).
- `nexus-api` rodando (e suas dependências).

## Rodar Localmente
Pela raiz da plataforma (recomendado):
```bash
docker-compose up --build admin
```
Depois acesse:
- `http://localhost:3000`

Servidor de desenvolvimento:
```bash
cd nexus-admin
npm install
VITE_API_URL=http://localhost:8080/api/v1 npm run dev
```

## Variáveis de Ambiente
- `VITE_API_URL`: URL base da API (exemplo: `http://localhost:8080/api/v1`)

## Acesso e segurança
- A UI administrativa é destinada apenas a usuários Super Admin (role 1).
- A validação de papel é feita via `GET /me` antes de renderizar telas protegidas; usuários não-admin são bloqueados.
- O backend continua sendo a fonte de verdade para autorização.
- O token de acesso é armazenado em `sessionStorage` (chave: `nexus-token`) e é removido no logout.

## Observações
- Para detalhes de stack/UI, veja `nexus-admin/docs/README.md`.
