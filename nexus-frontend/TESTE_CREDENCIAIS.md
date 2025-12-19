# 🧪 Credenciais de Teste - Login Interface

## Como Testar o Login

O frontend está configurado com **Mock API** em desenvolvimento. Você pode fazer login usando as credenciais abaixo:

### ✅ Login Simples (Sem MFA)

```
Email: test@example.com
Senha: Test123!
```

**O que acontece:**
- Login bem-sucedido
- Acesso direto ao dashboard
- Sem autenticação de dois fatores

---

### 🔐 Login com MFA (Autenticador)

```
Email: mfa@example.com
Senha: Test123!
```

**O que acontece:**
1. Você vai para a tela de **configuração de MFA**
2. Escaneia o código QR com seu autenticador (Google Authenticator, Authy, etc.)
3. Insere o código de 6 dígitos para confirmar

**Código válido para teste:** `123456`  
(Ou qualquer código de 6 dígitos - 70% de chance de sucesso para simular TOTP real)

---

## 🎨 Recursos de UI Testáveis

### Validação em Tempo Real
- Digite um email inválido e veja o erro aparecer
- Os campos mostram ✓ quando preenchidos corretamente
- Mensagens de erro em vermelho com ícones

### Estados de Carregamento
- Clique em "Entrar" e veja o spinner animado
- Botão fica desabilitado durante o carregamento

### Mensagens de Feedback
- Sucessos aparecem em verde
- Erros aparecem em vermelho
- Avisos em amarelo

---

## 🔄 Fluxos Testáveis

### Fluxo 1: Login Simples → Dashboard
```
test@example.com + Test123! → ✅ Dashboard
```

### Fluxo 2: Login com MFA
```
mfa@example.com + Test123! → 🔐 Setup MFA → 📱 Confirmar Código → ✅ Dashboard
```

### Fluxo 3: Erro de Validação
```
Deixe campos vazios → Submeta → Veja validações aparecerem
```

### Fluxo 4: Email/Senha Inválidos
```
invalid@test.com + WrongPass → ❌ "Usuário ou senha inválidos"
```

---

## ⚙️ Configuração Técnica

### Mock API Automático
- Em **desenvolvimento** (`npm run dev`), todas as requisições de autenticação são interceptadas
- Nenhuma chamada real é feita ao backend
- Em **produção**, o mock é desabilitado e faz requisições reais

### Onde está o Mock?
- `src/api/mock.ts` - Lógica de mock
- `src/api/mock-interceptor.ts` - Interceptador de requisições
- `src/api/http.ts` - Usa o interceptador em dev

### Remover Mock em Produção
O mock é automaticamente desabilitado quando `import.meta.env.DEV` é `false`.

---

## 💡 Dicas de Teste

1. **Teste responsividade:** Redimensione a janela - o layout se adapta
2. **Teste acessibilidade:** Use `Tab` para navegar entre campos
3. **Teste validações:** Veja os ícones de erro/sucesso
4. **Teste MFA:** Teste o fluxo completo de configuração
5. **Teste Google Login:** O botão aparece mas redireciona para seu backend real

---

## 🚀 Pronto para Produção?

Quando conectar ao backend real:
1. Configure `VITE_API_URL` com a URL real da API
2. O mock desliga automaticamente
3. Todas as requisições vão para o backend

**Nada de código para remover** - o mock é limpo automaticamente!
