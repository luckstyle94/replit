<p align="center">
  <a href="README.md">🇺🇸 Read in English</a>
</p>

# Nexus Frontend

O **Nexus Frontend** é a interface web para usuários finais da plataforma Nexus. Ele integra diretamente com a `nexus-api` (`/api/v1`) e implementa o fluxo de autenticação do usuário (incluindo telas de setup/desafio de MFA guiadas pelo estado retornado pelo backend).

## Responsabilidades
- Fornecer a experiência do usuário final (login, MFA, home menu, perfil e telas de uso).
- Consumir a `nexus-api` usando `VITE_API_URL` como URL base.
- Integrar módulos de features como o Nexus Bridge via `VITE_BRIDGE_API_URL`.
- Servir arquivos estáticos via Nginx quando executado em Docker.
- Permitir que o usuário liste e encerre suas próprias sessões ativas via API.

## Requisitos
- Node.js + npm (para desenvolvimento local) ou Docker (recomendado).
- `nexus-api` rodando (e suas dependências).

## Rodar Localmente
Pela raiz da plataforma (recomendado):
```bash
docker-compose up --build frontend
```
Depois acesse:
- `http://localhost:3001`

Servidor de desenvolvimento:
```bash
cd nexus-frontend
npm install
VITE_API_URL=http://localhost:8080/api/v1 npm run dev
```

## Variáveis de Ambiente
- `VITE_API_URL`: URL base da API.
  - Docker (recomendado): `/api/v1` (usa proxy do Nginx, mesma origem)
  - Fora do Docker: `http://localhost:8080/api/v1`
- `VITE_BRIDGE_API_URL`: URL base da API do Bridge.
  - Docker (compose): `http://localhost:8090/api/v1`
  - Fora do Docker: `http://localhost:8090/api/v1`

## Autenticação e MFA (referência de desenvolvimento)
- O fluxo de MFA é dirigido pela API e pode exigir:
  - Configuração do autenticador (primeiro acesso), ou
  - Confirmação de código no autenticador (usuário já habilitado).
- Quando permitido pela API durante o primeiro acesso, pode existir opção temporária por e-mail. Depois de habilitar o autenticador, essa opção deixa de aparecer.

## Gerenciamento de Sessões (usuário)
- O dashboard exibe sessões ativas com base em `GET /sessions`.
- O usuário pode revogar qualquer sessão via `DELETE /sessions/{id}` (inclusive a sessão atual).

## Troubleshooting (referência de desenvolvimento)
- **Request ID**: a API pode retornar `X-Request-ID` nas respostas. Em caso de erro, verifique esse header no DevTools (Network) para facilitar investigação.
- **Recuperação de senha no ambiente local**: dependendo da configuração da `nexus-api`, a mensagem de recuperação pode não ser enviada por e-mail em ambiente local. Use o fluxo de reset conforme configurado na API (ex.: token/código disponibilizado em logs).

## Observações
- A imagem Docker usa Nginx e faz proxy de `/api/` para o serviço da API quando iniciado via Compose.
- Por segurança, o token de acesso é armazenado em `sessionStorage` (não persiste após fechar o navegador). Tokens antigos em `localStorage` são migrados uma vez e removidos.
