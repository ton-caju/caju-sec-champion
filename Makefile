# Makefile - Caju Security Champions
# Sistema de Recuperação de Senha com Validação de Identidade (PID)

.PHONY: help install start stop restart logs status test-e2e clean

# Cores para output
GREEN=\033[0;32m
YELLOW=\033[1;33m
RED=\033[0;31m
NC=\033[0m # No Color

# Variáveis
BACKEND_DIR=Lab-v4
BFF_DIR=bff
FRONTEND_DIR=frontend
REDIS_CONTAINER=caju-redis
BACKEND_COMPOSE_FILE=$(BACKEND_DIR)/docker-compose.yml

##@ Ajuda

help: ## Exibe esta mensagem de ajuda
	@echo "$(GREEN)Caju Security Champions - Sistema de Recuperação de Senha$(NC)"
	@echo ""
	@echo "$(YELLOW)Comandos disponíveis:$(NC)"
	@awk 'BEGIN {FS = ":.*##"; printf "\n"} /^[a-zA-Z_-]+:.*?##/ { printf "  $(GREEN)%-20s$(NC) %s\n", $$1, $$2 } /^##@/ { printf "\n$(YELLOW)%s$(NC)\n", substr($$0, 5) } ' $(MAKEFILE_LIST)

##@ Instalação

install: install-backend install-bff install-frontend ## Instala todas as dependências
	@echo "$(GREEN)✓ Todas as dependências instaladas com sucesso!$(NC)"

install-backend: ## Instala dependências do Backend (Lab-v4)
	@echo "$(YELLOW)→ Backend Lab-v4 será executado via Docker (sem necessidade de instalar dependências localmente)$(NC)"

install-bff: ## Instala dependências do BFF
	@echo "$(YELLOW)→ Instalando dependências do BFF...$(NC)"
	@cd $(BFF_DIR) && npm install
	@echo "$(GREEN)✓ Dependências do BFF instaladas$(NC)"

install-frontend: ## Instala dependências do Frontend
	@echo "$(YELLOW)→ Instalando dependências do Frontend...$(NC)"
	@cd $(FRONTEND_DIR) && npm install
	@echo "$(GREEN)✓ Dependências do Frontend instaladas$(NC)"

##@ Ambiente

start: start-redis start-backend start-bff start-frontend ## Inicia todo o ambiente (Redis + Backend + BFF + Frontend)
	@echo "$(GREEN)✓ Ambiente completo iniciado!$(NC)"
	@echo ""
	@echo "$(YELLOW)Serviços disponíveis:$(NC)"
	@echo "  • Backend Lab-v4:  http://localhost:8080"
	@echo "  • BFF:             http://localhost:4000"
	@echo "  • Frontend:        http://localhost:3000"
	@echo "  • Métricas BFF:    http://localhost:4000/metrics"
	@echo "  • Health BFF:      http://localhost:4000/health"

start-redis: ## Inicia Redis (Docker)
	@echo "$(YELLOW)→ Iniciando Redis...$(NC)"
	@docker ps -q -f name=$(REDIS_CONTAINER) > /dev/null 2>&1 && echo "$(YELLOW)⚠ Redis já está rodando$(NC)" || \
	(docker run -d --name $(REDIS_CONTAINER) -p 6379:6379 redis:7-alpine && echo "$(GREEN)✓ Redis iniciado$(NC)")

start-backend: ## Inicia Backend Lab-v4 (Docker Compose)
	@echo "$(YELLOW)→ Iniciando Backend Lab-v4...$(NC)"
	@cd $(BACKEND_DIR) && docker compose up -d
	@echo "$(GREEN)✓ Backend Lab-v4 iniciado$(NC)"

start-bff: ## Inicia BFF (Node.js)
	@echo "$(YELLOW)→ Iniciando BFF...$(NC)"
	@if [ ! -f $(BFF_DIR)/.env ]; then \
		echo "$(RED)✗ Arquivo .env não encontrado no BFF!$(NC)"; \
		echo "$(YELLOW)→ Copie $(BFF_DIR)/.env.example para $(BFF_DIR)/.env e configure as variáveis$(NC)"; \
		exit 1; \
	fi
	@cd $(BFF_DIR) && npm run dev > /dev/null 2>&1 & echo "$(GREEN)✓ BFF iniciado em background$(NC)"

start-frontend: ## Inicia Frontend (React + Vite)
	@echo "$(YELLOW)→ Iniciando Frontend...$(NC)"
	@if [ ! -f $(FRONTEND_DIR)/.env ]; then \
		echo "$(RED)✗ Arquivo .env não encontrado no Frontend!$(NC)"; \
		echo "$(YELLOW)→ Copie $(FRONTEND_DIR)/.env.example para $(FRONTEND_DIR)/.env e configure as variáveis$(NC)"; \
		exit 1; \
	fi
	@cd $(FRONTEND_DIR) && npm run dev > /dev/null 2>&1 & echo "$(GREEN)✓ Frontend iniciado em background$(NC)"

stop: stop-frontend stop-bff stop-backend stop-redis ## Para todo o ambiente
	@echo "$(GREEN)✓ Ambiente completo parado!$(NC)"

stop-redis: ## Para Redis
	@echo "$(YELLOW)→ Parando Redis...$(NC)"
	@docker stop $(REDIS_CONTAINER) > /dev/null 2>&1 && docker rm $(REDIS_CONTAINER) > /dev/null 2>&1 && echo "$(GREEN)✓ Redis parado$(NC)" || echo "$(YELLOW)⚠ Redis não estava rodando$(NC)"

stop-backend: ## Para Backend Lab-v4
	@echo "$(YELLOW)→ Parando Backend Lab-v4...$(NC)"
	@cd $(BACKEND_DIR) && docker compose down
	@echo "$(GREEN)✓ Backend Lab-v4 parado$(NC)"

stop-bff: ## Para BFF
	@echo "$(YELLOW)→ Parando BFF...$(NC)"
	@pkill -f "node.*$(BFF_DIR)" || echo "$(YELLOW)⚠ BFF não estava rodando$(NC)"
	@echo "$(GREEN)✓ BFF parado$(NC)"

stop-frontend: ## Para Frontend
	@echo "$(YELLOW)→ Parando Frontend...$(NC)"
	@pkill -f "vite.*$(FRONTEND_DIR)" || echo "$(YELLOW)⚠ Frontend não estava rodando$(NC)"
	@echo "$(GREEN)✓ Frontend parado$(NC)"

restart: stop start ## Reinicia todo o ambiente

##@ Monitoramento

status: ## Verifica status de todos os serviços
	@echo "$(YELLOW)Status dos Serviços:$(NC)"
	@echo ""
	@echo -n "Redis:          "
	@docker ps -q -f name=$(REDIS_CONTAINER) > /dev/null 2>&1 && echo "$(GREEN)✓ Rodando$(NC)" || echo "$(RED)✗ Parado$(NC)"
	@echo -n "Backend Lab-v4: "
	@curl -s http://localhost:8080/health > /dev/null 2>&1 && echo "$(GREEN)✓ Rodando$(NC)" || echo "$(RED)✗ Parado$(NC)"
	@echo -n "BFF:            "
	@curl -s http://localhost:4000/health > /dev/null 2>&1 && echo "$(GREEN)✓ Rodando$(NC)" || echo "$(RED)✗ Parado$(NC)"
	@echo -n "Frontend:       "
	@curl -s http://localhost:3000 > /dev/null 2>&1 && echo "$(GREEN)✓ Rodando$(NC)" || echo "$(RED)✗ Parado$(NC)"

logs: logs-bff ## Exibe logs do BFF

logs-bff: ## Exibe logs do BFF (Winston)
	@echo "$(YELLOW)→ Logs do BFF (Ctrl+C para sair):$(NC)"
	@tail -f $(BFF_DIR)/logs/bff-combined.log 2>/dev/null || echo "$(RED)✗ Arquivo de log não encontrado$(NC)"

logs-backend: ## Exibe logs do Backend Lab-v4
	@echo "$(YELLOW)→ Logs do Backend Lab-v4:$(NC)"
	@cd $(BACKEND_DIR) && docker compose logs -f

metrics: ## Exibe métricas Prometheus do BFF
	@echo "$(YELLOW)→ Métricas Prometheus do BFF:$(NC)"
	@curl -s http://localhost:4000/metrics | grep -E "(recovery|rate_limit|captcha|lockout)" || echo "$(RED)✗ BFF não está rodando$(NC)"

##@ Testes

test-e2e: ## Executa testes E2E de segurança (24 cenários documentados)
	@echo "$(YELLOW)========================================$(NC)"
	@echo "$(GREEN)Testes E2E de Segurança$(NC)"
	@echo "$(YELLOW)========================================$(NC)"
	@echo ""
	@echo "$(YELLOW)IMPORTANTE: Os testes serão executados contra o ambiente local$(NC)"
	@echo "$(YELLOW)Certifique-se de que todos os serviços estão rodando (make status)$(NC)"
	@echo ""
	@read -p "Pressione Enter para continuar ou Ctrl+C para cancelar..." dummy
	@make test-functional
	@make test-rate-limiting
	@make test-validation

test-functional: ## Testes funcionais (F01-F03)
	@echo ""
	@echo "$(GREEN)═══ TESTES FUNCIONAIS ═══$(NC)"
	@echo ""
	@echo "$(YELLOW)→ F01: Fluxo de recuperação completo$(NC)"
	@echo "1. Obtendo CSRF token..."
	@curl -s -c cookies.txt http://localhost:4000/api/csrf-token -o /dev/null && echo "$(GREEN)✓ CSRF token obtido$(NC)" || echo "$(RED)✗ Falha ao obter CSRF token$(NC)"
	@echo ""
	@echo "$(YELLOW)Nota: Para completar F01, use a interface web em http://localhost:3000$(NC)"
	@echo "      CPF de teste: 123.456.789-00"
	@echo "      Respostas: Sicredi, DataCore Solutions, 6802, 181429, 771.33"
	@echo ""

test-rate-limiting: ## Testes de rate limiting (S01-S04)
	@echo ""
	@echo "$(GREEN)═══ TESTES DE RATE LIMITING ═══$(NC)"
	@echo ""
	@echo "$(YELLOW)→ S01: Rate limiting por IP (10/hora)$(NC)"
	@for i in 1 2 3 4 5 6 7 8 9 10 11; do \
		echo -n "Tentativa $$i: "; \
		STATUS=$$(curl -s -o /dev/null -w "%{http_code}" -X POST http://localhost:4000/api/recovery/init \
			-H "Content-Type: application/json" \
			-d '{"cpf":"123.456.789-00","recaptcha_token":"test"}'); \
		if [ $$i -le 10 ]; then \
			if [ $$STATUS -lt 500 ]; then echo "$(GREEN)✓ Status $$STATUS (permitido)$(NC)"; else echo "$(RED)✗ Status $$STATUS (inesperado)$(NC)"; fi; \
		else \
			if [ $$STATUS -eq 429 ]; then echo "$(GREEN)✓ Status 429 (bloqueado)$(NC)"; else echo "$(RED)✗ Status $$STATUS (esperado 429)$(NC)"; fi; \
		fi; \
		sleep 0.5; \
	done
	@echo ""
	@echo "$(YELLOW)→ S02: Rate limiting por CPF (3/15min)$(NC)"
	@for i in 1 2 3 4; do \
		echo -n "Tentativa $$i para CPF 111.111.111-11: "; \
		STATUS=$$(curl -s -o /dev/null -w "%{http_code}" -X POST http://localhost:4000/api/recovery/init \
			-H "Content-Type: application/json" \
			-d '{"cpf":"111.111.111-11","recaptcha_token":"test"}'); \
		if [ $$i -le 3 ]; then \
			if [ $$STATUS -lt 500 ]; then echo "$(GREEN)✓ Status $$STATUS (permitido)$(NC)"; else echo "$(RED)✗ Status $$STATUS (inesperado)$(NC)"; fi; \
		else \
			if [ $$STATUS -eq 429 ]; then echo "$(GREEN)✓ Status 429 (bloqueado)$(NC)"; else echo "$(RED)✗ Status $$STATUS (esperado 429)$(NC)"; fi; \
		fi; \
		sleep 0.5; \
	done
	@echo ""

test-validation: ## Testes de validação (S09-S14)
	@echo ""
	@echo "$(GREEN)═══ TESTES DE VALIDAÇÃO ═══$(NC)"
	@echo ""
	@echo "$(YELLOW)→ S13: Validação de CPF com dígitos incorretos$(NC)"
	@for cpf in "123.456.789-01" "111.111.111-11" "000.000.000-00"; do \
		echo -n "CPF $$cpf: "; \
		STATUS=$$(curl -s -o /dev/null -w "%{http_code}" -X POST http://localhost:4000/api/recovery/init \
			-H "Content-Type: application/json" \
			-d "{\"cpf\":\"$$cpf\",\"recaptcha_token\":\"test\"}"); \
		if [ $$STATUS -eq 400 ]; then echo "$(GREEN)✓ Status 400 (CPF inválido rejeitado)$(NC)"; else echo "$(RED)✗ Status $$STATUS (esperado 400)$(NC)"; fi; \
		sleep 0.5; \
	done
	@echo ""

test-captcha: ## Testes de CAPTCHA (S15-S17)
	@echo ""
	@echo "$(GREEN)═══ TESTES DE CAPTCHA ═══$(NC)"
	@echo ""
	@echo "$(YELLOW)Nota: Testes de CAPTCHA requerem tokens reCAPTCHA válidos$(NC)"
	@echo "$(YELLOW)Configure chaves em $(BFF_DIR)/.env e $(FRONTEND_DIR)/.env$(NC)"
	@echo ""

test-csrf: ## Testes de CSRF (S18-S19)
	@echo ""
	@echo "$(GREEN)═══ TESTES DE CSRF ═══$(NC)"
	@echo ""
	@echo "$(YELLOW)→ S18: Requisição sem CSRF token$(NC)"
	@STATUS=$$(curl -s -o /dev/null -w "%{http_code}" -X POST http://localhost:4000/api/recovery/init \
		-H "Content-Type: application/json" \
		-d '{"cpf":"123.456.789-00","recaptcha_token":"test"}'); \
	if [ $$STATUS -eq 403 ]; then echo "$(GREEN)✓ Status 403 (CSRF bloqueado)$(NC)"; else echo "$(RED)✗ Status $$STATUS (esperado 403)$(NC)"; fi
	@echo ""
	@echo "$(YELLOW)→ S19: Requisição com CSRF token inválido$(NC)"
	@STATUS=$$(curl -s -o /dev/null -w "%{http_code}" -X POST http://localhost:4000/api/recovery/init \
		-H "Content-Type: application/json" \
		-H "X-CSRF-Token: token_invalido_123" \
		-d '{"cpf":"123.456.789-00","recaptcha_token":"test"}'); \
	if [ $$STATUS -eq 403 ]; then echo "$(GREEN)✓ Status 403 (Token inválido bloqueado)$(NC)"; else echo "$(RED)✗ Status $$STATUS (esperado 403)$(NC)"; fi
	@echo ""

##@ Manutenção

clean: ## Limpa dados temporários (logs, node_modules, containers)
	@echo "$(YELLOW)→ Limpando ambiente...$(NC)"
	@echo "$(RED)ATENÇÃO: Esta operação irá remover:$(NC)"
	@echo "  - Logs do BFF"
	@echo "  - Containers Docker (Backend, Redis)"
	@echo "  - node_modules (BFF e Frontend)"
	@echo ""
	@read -p "Deseja continuar? (s/N) " confirm; \
	if [ "$$confirm" = "s" ] || [ "$$confirm" = "S" ]; then \
		echo "$(YELLOW)→ Parando serviços...$(NC)"; \
		make stop; \
		echo "$(YELLOW)→ Removendo logs...$(NC)"; \
		rm -rf $(BFF_DIR)/logs/*.log; \
		echo "$(YELLOW)→ Removendo node_modules...$(NC)"; \
		rm -rf $(BFF_DIR)/node_modules $(FRONTEND_DIR)/node_modules; \
		echo "$(GREEN)✓ Limpeza concluída$(NC)"; \
	else \
		echo "$(YELLOW)Operação cancelada$(NC)"; \
	fi

clean-logs: ## Limpa apenas os logs do BFF
	@echo "$(YELLOW)→ Limpando logs do BFF...$(NC)"
	@rm -f $(BFF_DIR)/logs/*.log
	@echo "$(GREEN)✓ Logs limpos$(NC)"

build-bff: ## Build de produção do BFF
	@echo "$(YELLOW)→ Fazendo build do BFF...$(NC)"
	@cd $(BFF_DIR) && npm run build
	@echo "$(GREEN)✓ Build do BFF concluído$(NC)"

build-frontend: ## Build de produção do Frontend
	@echo "$(YELLOW)→ Fazendo build do Frontend...$(NC)"
	@cd $(FRONTEND_DIR) && npm run build
	@echo "$(GREEN)✓ Build do Frontend concluído$(NC)"

build: build-bff build-frontend ## Build de produção completo

##@ Desenvolvimento

dev-bff: ## Inicia BFF em modo desenvolvimento (com hot reload)
	@echo "$(YELLOW)→ Iniciando BFF em modo desenvolvimento...$(NC)"
	@cd $(BFF_DIR) && npm run dev

dev-frontend: ## Inicia Frontend em modo desenvolvimento (com hot reload)
	@echo "$(YELLOW)→ Iniciando Frontend em modo desenvolvimento...$(NC)"
	@cd $(FRONTEND_DIR) && npm run dev

lint-bff: ## Executa linter no BFF
	@echo "$(YELLOW)→ Executando linter no BFF...$(NC)"
	@cd $(BFF_DIR) && npm run lint || echo "$(YELLOW)⚠ Script lint não configurado$(NC)"

lint-frontend: ## Executa linter no Frontend
	@echo "$(YELLOW)→ Executando linter no Frontend...$(NC)"
	@cd $(FRONTEND_DIR) && npm run lint || echo "$(YELLOW)⚠ Script lint não configurado$(NC)"

##@ Atalhos

redis: start-redis ## Atalho para start-redis
backend: start-backend ## Atalho para start-backend
bff: start-bff ## Atalho para start-bff
frontend: start-frontend ## Atalho para start-frontend
