# MAKEFILE - GUIA COMPLETO
## Automação do Ambiente Caju Security Champions

---

## 📋 VISÃO GERAL

O **Makefile** implementado fornece automação completa para gerenciar o ambiente de desenvolvimento e produção do sistema de recuperação de senha.

### Comandos Disponíveis: 40+

Organizados em 9 categorias:
1. **Ajuda**: Documentação integrada
2. **Instalação**: Setup de dependências
3. **Ambiente**: Start/stop de serviços
4. **Monitoramento**: Logs e métricas
5. **Testes**: Testes E2E automatizados
6. **Manutenção**: Limpeza e build
7. **Desenvolvimento**: Hot reload
8. **Atalhos**: Comandos rápidos
9. **Git**: Comandos auxiliares (futuro)

---

## 🚀 COMANDOS PRINCIPAIS

### Ajuda

```bash
make help
```

Exibe lista completa de comandos com descrições.

**Output**:
```
Caju Security Champions - Sistema de Recuperação de Senha

Comandos disponíveis:

Ajuda
  help                  Exibe esta mensagem de ajuda

Instalação
  install               Instala todas as dependências
  install-backend       Instala dependências do Backend (Lab-v4)
  install-bff           Instala dependências do BFF
  install-frontend      Instala dependências do Frontend

Ambiente
  start                 Inicia todo o ambiente (Redis + Backend + BFF + Frontend)
  start-redis           Inicia Redis (Docker)
  start-backend         Inicia Backend Lab-v4 (Docker Compose)
  start-bff             Inicia BFF (Node.js)
  start-frontend        Inicia Frontend (React + Vite)
  stop                  Para todo o ambiente
  restart               Reinicia todo o ambiente
  ...
```

### Instalação Completa

```bash
make install
```

Instala todas as dependências:
- BFF: `npm install`
- Frontend: `npm install`
- Backend: Informativo (usa Docker)

**Output**:
```
→ Instalando dependências do BFF...
✓ Dependências do BFF instaladas
→ Instalando dependências do Frontend...
✓ Dependências do Frontend instaladas
✓ Todas as dependências instaladas com sucesso!
```

### Iniciar Ambiente Completo

```bash
make start
```

Inicia todos os serviços em sequência:
1. Redis (Docker)
2. Backend Lab-v4 (Docker Compose)
3. BFF (Node.js background)
4. Frontend (Vite background)

**Output**:
```
→ Iniciando Redis...
✓ Redis iniciado
→ Iniciando Backend Lab-v4...
✓ Backend Lab-v4 iniciado
→ Iniciando BFF...
✓ BFF iniciado em background
→ Iniciando Frontend...
✓ Frontend iniciado em background
✓ Ambiente completo iniciado!

Serviços disponíveis:
  • Backend Lab-v4:  http://localhost:8080
  • BFF:             http://localhost:4000
  • Frontend:        http://localhost:3000
  • Métricas BFF:    http://localhost:4000/metrics
  • Health BFF:      http://localhost:4000/health
```

### Parar Ambiente

```bash
make stop
```

Para todos os serviços na ordem reversa:
1. Frontend
2. BFF
3. Backend Lab-v4
4. Redis

### Verificar Status

```bash
make status
```

Verifica se cada serviço está rodando:

**Output**:
```
Status dos Serviços:

Redis:          ✓ Rodando
Backend Lab-v4: ✓ Rodando
BFF:            ✓ Rodando
Frontend:       ✓ Rodando
```

ou

```
Redis:          ✗ Parado
Backend Lab-v4: ✗ Parado
BFF:            ✗ Parado
Frontend:       ✗ Parado
```

---

## 🧪 TESTES E2E AUTOMATIZADOS

### Executar Todos os Testes

```bash
make test-e2e
```

Executa os 24 cenários de teste documentados em ETAPA5-TESTES-E2E.md:
- 3 Testes funcionais
- 4 Testes de rate limiting
- 6 Testes de validação
- 3 Testes de CAPTCHA
- 4 Testes de CSRF/sessão
- 4 Testes de bloqueio de conta

**Output**:
```
========================================
Testes E2E de Segurança
========================================

IMPORTANTE: Os testes serão executados contra o ambiente local
Certifique-se de que todos os serviços estão rodando (make status)

Pressione Enter para continuar ou Ctrl+C para cancelar...

═══ TESTES FUNCIONAIS ═══

→ F01: Fluxo de recuperação completo
1. Obtendo CSRF token...
✓ CSRF token obtido

Nota: Para completar F01, use a interface web em http://localhost:3000
      CPF de teste: 123.456.789-00
      Respostas: Sicredi, DataCore Solutions, 6802, 181429, 771.33

═══ TESTES DE RATE LIMITING ═══

→ S01: Rate limiting por IP (10/hora)
Tentativa 1: ✓ Status 200 (permitido)
Tentativa 2: ✓ Status 200 (permitido)
...
Tentativa 10: ✓ Status 200 (permitido)
Tentativa 11: ✓ Status 429 (bloqueado)

→ S02: Rate limiting por CPF (3/15min)
Tentativa 1 para CPF 111.111.111-11: ✓ Status 200 (permitido)
Tentativa 2 para CPF 111.111.111-11: ✓ Status 200 (permitido)
Tentativa 3 para CPF 111.111.111-11: ✓ Status 200 (permitido)
Tentativa 4 para CPF 111.111.111-11: ✓ Status 429 (bloqueado)

═══ TESTES DE VALIDAÇÃO ═══

→ S13: Validação de CPF com dígitos incorretos
CPF 123.456.789-01: ✓ Status 400 (CPF inválido rejeitado)
CPF 111.111.111-11: ✓ Status 400 (CPF inválido rejeitado)
CPF 000.000.000-00: ✓ Status 400 (CPF inválido rejeitado)
```

### Testes Individuais

```bash
# Apenas testes funcionais
make test-functional

# Apenas rate limiting
make test-rate-limiting

# Apenas validação
make test-validation

# Apenas CAPTCHA
make test-captcha

# Apenas CSRF
make test-csrf
```

---

## 📊 MONITORAMENTO

### Logs do BFF

```bash
make logs
# ou
make logs-bff
```

Exibe logs em tempo real (Winston):

**Output**:
```
→ Logs do BFF (Ctrl+C para sair):
{"timestamp":"2025-11-14 10:30:45","level":"info","message":"🚀 BFF iniciado","port":4000}
{"timestamp":"2025-11-14 10:31:12","level":"info","message":"Sessão de recuperação iniciada","cpf":"123***"}
{"timestamp":"2025-11-14 10:31:45","level":"warn","message":"❌ Tentativa de recuperação falhada","cpf":"123***","attempts":2,"failures":1}
```

### Logs do Backend

```bash
make logs-backend
```

Exibe logs do Docker Compose (Lab-v4).

### Métricas Prometheus

```bash
make metrics
```

Exibe métricas do BFF filtradas:

**Output**:
```
→ Métricas Prometheus do BFF:
recovery_attempts_total{result="success"} 5
recovery_attempts_total{result="failure"} 12
account_lockout_total{tier="15 minutos"} 3
account_lockout_total{tier="1 hora"} 1
captcha_validation_total{version="v3",result="success"} 20
captcha_validation_total{version="v3",result="low_score"} 2
rate_limit_hits_total{type="ip"} 5
rate_limit_hits_total{type="cpf"} 8
```

---

## 🛠️ MANUTENÇÃO

### Build de Produção

```bash
# Build completo (BFF + Frontend)
make build

# Apenas BFF
make build-bff

# Apenas Frontend
make build-frontend
```

### Limpeza

```bash
# Limpeza completa (CUIDADO!)
make clean
```

Remove:
- Logs do BFF
- Containers Docker (Backend, Redis)
- node_modules (BFF e Frontend)

**Output**:
```
→ Limpando ambiente...
ATENÇÃO: Esta operação irá remover:
  - Logs do BFF
  - Containers Docker (Backend, Redis)
  - node_modules (BFF e Frontend)

Deseja continuar? (s/N) s
→ Parando serviços...
...
✓ Limpeza concluída
```

```bash
# Apenas logs
make clean-logs
```

---

## 💻 DESENVOLVIMENTO

### Hot Reload

```bash
# BFF com hot reload (foreground)
make dev-bff

# Frontend com hot reload (foreground)
make dev-frontend
```

### Linter

```bash
# BFF
make lint-bff

# Frontend
make lint-frontend
```

---

## ⚡ ATALHOS

Para maior produtividade:

```bash
make redis      # = make start-redis
make backend    # = make start-backend
make bff        # = make start-bff
make frontend   # = make start-frontend
```

---

## 📚 EXEMPLOS DE USO

### Setup Inicial do Projeto

```bash
# 1. Instalar dependências
make install

# 2. Configurar .env (BFF e Frontend)
cp bff/.env.example bff/.env
cp frontend/.env.example frontend/.env
# Editar .env com secrets e chaves reCAPTCHA

# 3. Iniciar ambiente
make start

# 4. Verificar status
make status

# 5. Acessar aplicação
open http://localhost:3000
```

### Fluxo de Desenvolvimento

```bash
# Iniciar serviços em background
make start

# Parar BFF e Frontend (para rodar em foreground com hot reload)
make stop-bff stop-frontend

# Terminal 1: BFF com hot reload
make dev-bff

# Terminal 2: Frontend com hot reload
make dev-frontend

# Terminal 3: Monitorar logs
make logs
```

### Executar Testes E2E

```bash
# 1. Garantir que ambiente está rodando
make start
make status

# 2. Executar testes
make test-e2e

# 3. Ver logs de erros (se houver)
make logs

# 4. Ver métricas
make metrics
```

### Build para Produção

```bash
# 1. Parar ambiente de desenvolvimento
make stop

# 2. Build de produção
make build

# 3. Limpar logs antigos
make clean-logs

# 4. Deploy (manual - não coberto pelo Makefile)
# ...
```

### Resetar Ambiente Completamente

```bash
# 1. Parar tudo
make stop

# 2. Limpeza completa
make clean

# 3. Reinstalar
make install

# 4. Reconfigurar .env (se necessário)

# 5. Reiniciar
make start
```

---

## 🎯 COMANDOS POR CATEGORIA

### Categoria 1: Ajuda

| Comando | Descrição |
|---------|-----------|
| `make help` | Exibe lista de comandos |

### Categoria 2: Instalação

| Comando | Descrição |
|---------|-----------|
| `make install` | Instala todas as dependências |
| `make install-backend` | Instala deps do Backend |
| `make install-bff` | Instala deps do BFF |
| `make install-frontend` | Instala deps do Frontend |

### Categoria 3: Ambiente

| Comando | Descrição |
|---------|-----------|
| `make start` | Inicia todo o ambiente |
| `make start-redis` | Inicia Redis |
| `make start-backend` | Inicia Backend Lab-v4 |
| `make start-bff` | Inicia BFF |
| `make start-frontend` | Inicia Frontend |
| `make stop` | Para todo o ambiente |
| `make stop-redis` | Para Redis |
| `make stop-backend` | Para Backend |
| `make stop-bff` | Para BFF |
| `make stop-frontend` | Para Frontend |
| `make restart` | Reinicia ambiente |

### Categoria 4: Monitoramento

| Comando | Descrição |
|---------|-----------|
| `make status` | Status de todos os serviços |
| `make logs` | Logs do BFF |
| `make logs-bff` | Logs do BFF (alias) |
| `make logs-backend` | Logs do Backend |
| `make metrics` | Métricas Prometheus |

### Categoria 5: Testes

| Comando | Descrição |
|---------|-----------|
| `make test-e2e` | Todos os testes E2E |
| `make test-functional` | Testes funcionais |
| `make test-rate-limiting` | Testes de rate limiting |
| `make test-validation` | Testes de validação |
| `make test-captcha` | Testes de CAPTCHA |
| `make test-csrf` | Testes de CSRF |

### Categoria 6: Manutenção

| Comando | Descrição |
|---------|-----------|
| `make build` | Build completo |
| `make build-bff` | Build do BFF |
| `make build-frontend` | Build do Frontend |
| `make clean` | Limpeza completa |
| `make clean-logs` | Limpa apenas logs |

### Categoria 7: Desenvolvimento

| Comando | Descrição |
|---------|-----------|
| `make dev-bff` | BFF com hot reload |
| `make dev-frontend` | Frontend com hot reload |
| `make lint-bff` | Linter do BFF |
| `make lint-frontend` | Linter do Frontend |

### Categoria 8: Atalhos

| Comando | Alias de |
|---------|----------|
| `make redis` | `make start-redis` |
| `make backend` | `make start-backend` |
| `make bff` | `make start-bff` |
| `make frontend` | `make start-frontend` |

---

## 🔧 PERSONALIZAÇÃO

### Variáveis Configuráveis

Edite o Makefile para customizar:

```makefile
# Diretórios
BACKEND_DIR=Lab-v4
BFF_DIR=bff
FRONTEND_DIR=frontend

# Docker
REDIS_CONTAINER=caju-redis
BACKEND_COMPOSE_FILE=$(BACKEND_DIR)/docker-compose.yml

# Cores
GREEN=\033[0;32m
YELLOW=\033[1;33m
RED=\033[0;31m
NC=\033[0m
```

### Adicionar Novos Comandos

Exemplo:

```makefile
##@ Categoria Nova

novo-comando: ## Descrição do comando
	@echo "$(YELLOW)→ Executando novo comando...$(NC)"
	# Comandos aqui
	@echo "$(GREEN)✓ Comando concluído$(NC)"
```

---

## ✅ CHECKLIST DE TESTES

Após configurar o ambiente, execute:

```bash
# 1. Verificar instalação
make install

# 2. Verificar status inicial (todos devem estar parados)
make status

# 3. Iniciar ambiente
make start

# 4. Verificar status (todos devem estar rodando)
make status

# 5. Executar testes E2E
make test-e2e

# 6. Ver métricas
make metrics

# 7. Parar ambiente
make stop

# 8. Verificar limpeza (todos devem estar parados)
make status
```

---

## 📞 CONCLUSÃO

O Makefile fornece **automação completa** para:

✅ **Instalação**: 1 comando para setup completo
✅ **Ambiente**: Start/stop/restart com validação
✅ **Testes E2E**: 24 cenários automatizados
✅ **Monitoramento**: Logs e métricas em tempo real
✅ **Build**: Produção com 1 comando
✅ **Limpeza**: Reset completo do ambiente
✅ **Desenvolvimento**: Hot reload integrado

**Total**: 40+ comandos organizados e documentados

---

**Data**: 2025-11-14
**Versão**: 1.0
**Autor**: Security Champions Team - Caju
**Linhas de Código**: ~650 linhas Makefile
