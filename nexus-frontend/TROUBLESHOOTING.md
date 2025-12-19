# 🔧 Guia de Troubleshooting - Login

## ❌ Problema: Erro ao Fazer Login

Se você recebeu um erro ao tentar fazer login, siga os passos:

### 1️⃣ **Abra o DevTools** (F12 ou Cmd+Shift+I)
Vá para a aba **Console** e procure por mensagens como:
- `[MOCK LOGIN] Autenticação bem-sucedida`
- `[MOCK LOGIN] Usuário não encontrado`
- `[MOCK] Interceptando: /auth/login`

### 2️⃣ **Verifique as Credenciais**

```
✅ Email correto: test@example.com (sem espaços!)
✅ Senha correta: Test123! (com maiúscula e ponto de exclamação)
```

❌ **Erros comuns:**
- `test@example.com ` (com espaço no final)
- `test123!` (sem maiúscula)
- `Test123` (sem exclamação)

### 3️⃣ **Se Ainda Der Erro**

Se você ver no console uma mensagem como:
```
[MOCK LOGIN] Usuário não encontrado: seu@email.com
```

Significa que o email está errado. Use **exatamente**:
- `test@example.com` (sem MFA)
- `mfa@example.com` (com MFA)

### 4️⃣ **Recarregue a Página**
Pressione **Ctrl+Shift+R** (ou **Cmd+Shift+R** no Mac) para fazer um reload completo.

---

## 📝 Checklist Rápido

- [ ] Email: `test@example.com` ✓
- [ ] Senha: `Test123!` ✓  
- [ ] Sem espaços antes/depois ✓
- [ ] Página recarregada ✓
- [ ] DevTools aberto vendo logs ✓

---

## 💡 O Texto Ficou Mais Escuro?

**Sim!** Aumentei o contraste:
- Cor primária: de `#1f2937` para `#111827` (muito mais escuro)
- Cor secundária: de `#6b7280` para `#374151` (mais escuro)

Agora o texto está **muito mais legível**. ✅

---

## 🚀 Próximo Passo

Quando conectar ao backend real, remova os arquivos de mock:
- `src/api/mock.ts`
- `src/api/mock-interceptor.ts`

E configure a variável de ambiente:
```bash
VITE_API_URL=sua-api-url.com/api/v1
```

O mock desliga automaticamente em produção, então você pode deixar os imports do mock no `http.ts` sem problema.
