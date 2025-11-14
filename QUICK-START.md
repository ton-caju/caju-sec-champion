# QUICK START - GUIA RÁPIDO
## Caju Security Champions - Sistema de Recuperação de Senha Segura

**Última atualização**: 2025-11-14
**Versão**: 2.0
**Status**: ✅ Sistema 100% Funcional

---

## 🚀 INÍCIO RÁPIDO (5 minutos)

### Opção 1: Makefile (Recomendado)

```bash
# 1. Instalar tudo
make install

# 2. Configurar chaves (obrigatório)
cp bff/.env.example bff/.env
cp frontend/.env.example frontend/.env

# Editar bff/.env:
#   - SESSION_SECRET (gerar: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")
#   - RECAPTCHA_V3_SECRET_KEY (obter em https://www.google.com/recaptcha/admin)
#   - RECAPTCHA_V2_SECRET_KEY (obter em https://www.google.com/recaptcha/admin)

# Editar frontend/.env:
#   - VITE_RECAPTCHA_V3_SITE_KEY
#   - VITE_RECAPTCHA_V2_SITE_KEY

# 3. Iniciar ambiente completo
make start

# 4. Verificar
make status

# 5. Acessar
open http://localhost:3000
```

### Opção 2: Manual

```bash
# 1. Backend Lab-v4
cd Lab-v4
docker compose up -d

# 2. Redis
docker run -d --name caju-redis -p 6379:6379 redis:7-alpine

# 3. BFF
cd bff
npm install
cp .env.example .env
# Editar .env com secrets
npm run dev &

# 4. Frontend
cd frontend
npm install
cp .env.example .env
# Editar .env com chaves reCAPTCHA
npm run dev &

# 5. Verificar
curl http://localhost:4000/health
curl http://localhost:3000
```

---

## 🧪 TESTE RÁPIDO (2 minutos)

### Via Interface Web

```bash
# 1. Abrir navegador
open http://localhost:3000

# 2. Informar CPF de teste
123.456.789-00

# 3. Responder perguntas
- Banco: Sicredi
- Empresa: DataCore Solutions
- Agência: 6802
- Código: 181429
- Última transação: 771.33

# 4. Definir nova senha
NovaSenh@123

# 5. Sucesso!
```

### Via API (curl)

```bash
# 1. Obter CSRF token
curl -c cookies.txt http://localhost:4000/api/csrf-token

# 2. Iniciar recuperação
curl -X POST http://localhost:4000/api/recovery/init \
  -H "Content-Type: application/json" \
  -H "X-CSRF-Token: <token>" \
  -d '{"cpf":"123.456.789-00","recaptcha_token":"test"}' \
  --cookie cookies.txt --cookie-jar cookies.txt

# 3. Validar respostas
curl -X POST http://localhost:4000/api/recovery/validate \
  -H "Content-Type: application/json" \
  -H "X-CSRF-Token: <token>" \
  -d '{
    "cpf":"123.456.789-00",
    "respostas":["Sicredi","DataCore Solutions","6802","181429","771.33"],
    "recaptcha_token":"test"
  }' \
  --cookie cookies.txt --cookie-jar cookies.txt

# 4. Resetar senha
curl -X POST http://localhost:4000/api/recovery/reset-password \
  -H "Content-Type: application/json" \
  -H "X-CSRF-Token: <token>" \
  -d '{
    "reset_token":"<token_do_passo_3>",
    "new_password":"NovaSenh@123"
  }' \
  --cookie cookies.txt
```

---

## 🧪 TESTES E2E (10 minutos)

```bash
# Executar todos os testes automatizados
make test-e2e

# Ou testes específicos
make test-functional       # Fluxo completo
make test-rate-limiting    # Limites de requisições
make test-validation       # CPF, senha, inputs
make test-csrf             # Proteção CSRF
```

**Resultado esperado**:
```
✓ Rate limiting por IP funcionando (11ª tentativa bloqueada)
✓ Rate limiting por CPF funcionando (4ª tentativa bloqueada)
✓ CPFs inválidos rejeitados
✓ CSRF sem token bloqueado
```

---

## 📊 MONITORAMENTO

```bash
# Status de todos os serviços
make status

# Logs do BFF em tempo real
make logs

# Métricas Prometheus
make metrics

# Logs do Backend
make logs-backend
```

---

## 🛑 PARAR TUDO

```bash
# Parar ambiente completo
make stop

# Parar serviços individuais
make stop-frontend
make stop-bff
make stop-backend
make stop-redis
```

---

## 🆘 TROUBLESHOOTING

### Problema: BFF não inicia

**Erro**: `Error: connect ECONNREFUSED localhost:6379`

**Solução**:
```bash
# Verificar se Redis está rodando
docker ps | grep redis

# Se não estiver, iniciar
make start-redis
```

---

### Problema: Frontend não carrega

**Erro**: `Network Error` ao fazer requisições

**Solução**:
```bash
# Verificar se BFF está rodando
curl http://localhost:4000/health

# Verificar CORS no BFF
# Editar bff/src/config/cors.ts se necessário
```

---

### Problema: reCAPTCHA não funciona

**Erro**: `reCAPTCHA validation failed`

**Solução**:
```bash
# 1. Verificar se chaves estão corretas
cat bff/.env | grep RECAPTCHA
cat frontend/.env | grep RECAPTCHA

# 2. Garantir que localhost está registrado no Google reCAPTCHA Admin
# https://www.google.com/recaptcha/admin

# 3. Usar chaves de teste em desenvolvimento (opcional)
# Site key: 6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI
# Secret key: 6LeIxAcTAAAAAGG-vFI1TnRWxMZNFuojJ4WifJWe
```

---

### Problema: Testes E2E falham

**Erro**: `Connection refused` nos testes

**Solução**:
```bash
# 1. Verificar se todos os serviços estão rodando
make status

# 2. Aguardar 10 segundos após start
sleep 10

# 3. Re-executar testes
make test-e2e
```

---

## 📚 DOCUMENTAÇÃO COMPLETA

### Por Etapa

1. **Análise de Ameaças**: `ETAPA1-MODELAGEM-AMEACAS.md`
2. **Avaliação de Riscos**: `ETAPA2-OWASP-Risk-Rating.xlsx`
3. **Design da Solução**: `ETAPA3-DESIGN-SOLUCAO.md`
4. **Implementação BFF**: `ETAPA4-IMPLEMENTACAO.md`
5. **Testes E2E**: `ETAPA5-TESTES-E2E.md`

### Por Componente

- **Frontend**: `FRONTEND-COMPLETO.md`
- **Makefile**: `MAKEFILE-GUIA.md`
- **Perguntas Secretas**: `PERGUNTAS-SECRETAS-README.md`
- **Resumo Executivo**: `RESUMO-EXECUTIVO.md`
- **Entrega Final**: `ENTREGA-FINAL.md`

### Changelog

- **Mudanças Recentes**: `CHANGELOG-FRONTEND.md`

---

## 🎯 COMANDOS MAIS USADOS

```bash
# Setup inicial (apenas 1 vez)
make install

# Dia a dia
make start              # Iniciar tudo
make status             # Verificar status
make logs               # Ver logs
make test-e2e           # Executar testes
make stop               # Parar tudo

# Desenvolvimento
make dev-bff            # BFF com hot reload
make dev-frontend       # Frontend com hot reload

# Produção
make build              # Build de produção
make clean              # Limpeza completa
```

---

## 🏗️ ARQUITETURA VISUAL

```
┌─────────────────────────────────────────┐
│           USUÁRIO / ATACANTE            │
└────────────────┬────────────────────────┘
                 │
                 │ HTTPS
                 ▼
        ┌────────────────────┐
        │  Frontend (React)  │
        │  Port 3000         │
        │  - CPF Form        │
        │  - Questions Form  │
        │  - Password Form   │
        └────────┬───────────┘
                 │
                 │ HTTPS + CSRF
                 ▼
        ┌────────────────────┐
        │   BFF (Node.js)    │  🛡️ CAMADA DE PROTEÇÃO
        │   Port 4000        │
        │                    │
        │ ✅ Rate Limiting   │
        │ ✅ CAPTCHA         │
        │ ✅ Validation      │
        │ ✅ Lockout         │
        │ ✅ CSRF            │
        │ ✅ Session (Redis) │
        │ ✅ Logging         │
        │ ✅ Metrics         │
        └────────┬───────────┘
                 │
                 │ HTTP Interno
                 ▼
        ┌────────────────────┐
        │ Backend (Kotlin)   │
        │ Port 8080          │
        │ ⚠️ Vulnerável       │
        └────────────────────┘
```

---

## ✅ CHECKLIST DE VALIDAÇÃO

Após setup, verifique:

- [ ] Backend Lab-v4 rodando em http://localhost:8080
- [ ] Redis rodando (docker ps | grep redis)
- [ ] BFF rodando em http://localhost:4000
- [ ] Frontend rodando em http://localhost:3000
- [ ] Health check BFF: `curl http://localhost:4000/health`
- [ ] Métricas BFF: `curl http://localhost:4000/metrics`
- [ ] Interface web acessível
- [ ] Testes E2E passando: `make test-e2e`

---

## 🎓 RECURSOS ADICIONAIS

### Chaves reCAPTCHA

**Produção**:
1. Acessar: https://www.google.com/recaptcha/admin
2. Criar 2 sites (v2 checkbox + v3 score)
3. Domínio: seu-dominio.com
4. Copiar Site Key e Secret Key

**Desenvolvimento** (opcional):
- Site key (v2): `6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI`
- Secret key (v2): `6LeIxAcTAAAAAGG-vFI1TnRWxMZNFuojJ4WifJWe`
- ⚠️ Aceita todas as requisições (apenas para testes)

### Usuários de Teste

| Username | CPF | Respostas |
|----------|-----|-----------|
| admin | 123.456.789-00 | Sicredi, DataCore Solutions, 6802, 181429, 771.33 |
| alice | 234.567.890-11 | Ver `Lab-v4/uploads/alice_secrets.json` |
| bob | 345.678.901-22 | Ver `Lab-v4/uploads/bob_secrets.json` |

### Portas Usadas

| Serviço | Porta | URL |
|---------|-------|-----|
| Frontend | 3000 | http://localhost:3000 |
| BFF | 4000 | http://localhost:4000 |
| BFF Metrics | 4000 | http://localhost:4000/metrics |
| Backend Lab-v4 | 8080 | http://localhost:8080 |
| Redis | 6379 | localhost:6379 |
| PostgreSQL | 5432 | localhost:5432 |

---

## 📞 SUPORTE

### Documentação

- **Leia Primeiro**: `README.md`
- **Problemas Comuns**: Esta seção (Troubleshooting)
- **Guia Completo**: `ENTREGA-FINAL.md`

### Logs

```bash
# Logs estruturados do BFF
tail -f bff/logs/bff-combined.log | jq

# Logs do Backend
cd Lab-v4 && docker compose logs -f

# Logs do Redis
docker logs -f caju-redis
```

---

## 🎉 CONCLUSÃO

Você está pronto para usar o **Sistema de Recuperação de Senha Segura**!

**Em 5 minutos você tem**:
- ✅ Ambiente completo rodando
- ✅ Frontend funcional
- ✅ 13 mitigações de segurança ativas
- ✅ Testes automatizados

**Comandos essenciais**:
```bash
make start    # 🚀 Começar
make test-e2e # 🧪 Testar
make logs     # 📊 Monitorar
make stop     # 🛑 Parar
```

---

**Data**: 2025-11-14
**Versão**: 2.0
**Autor**: Security Champions Team - Caju
**Tempo de Setup**: ~5 minutos
**Tempo de Teste**: ~2 minutos

🏆 **Pronto para usar em Produção** (após configuração de secrets e TLS)
