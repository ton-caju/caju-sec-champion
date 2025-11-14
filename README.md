# Desafio Caju Security Champions
## Sistema de Recuperação de Senha com Validação de Identidade (PID)

---

## 📋 VISÃO GERAL

Este projeto implementa um sistema seguro de recuperação de senha por validação de identidade (PID) para instituições financeiras, seguindo as melhores práticas de segurança OWASP.

### Arquitetura

```
Internet → WAF/Cloudflare → Frontend (React) → BFF (Node.js) → Backend (Kotlin)
         (DDoS Protection)  (Validação)       (PROTEÇÃO)        (Vulnerável)
```

- **Frontend**: React 18 + TypeScript + Vite
- **BFF**: Node.js 20 + Express + TypeScript (Camada de Proteção)
- **Backend**: Kotlin + Spring Boot 3.3.3 (Lab-v4 - Vulnerável)
- **Infraestrutura**: Redis 7, PostgreSQL 16

---

## 🎯 COMPONENTES DE SEGURANÇA IMPLEMENTADOS

### ✅ Mitigações Implementadas (13 Total)

| ID | Ameaça | Mitigação | Camada |
|----|--------|-----------|--------|
| T01 | Força Bruta | Rate Limiting Multi-Camada (IP/CPF/Sessão) | BFF |
| T02 | Automação | reCAPTCHA v3 + v2 Dinâmico | BFF + Frontend |
| T03 | Sem Bloqueio | Bloqueio Progressivo (3/5/10/20 falhas) | BFF |
| T04 | Input Validation | Validação + Sanitização Rigorosa | BFF + Frontend |
| T05 | HTTP sem TLS | HTTPS Obrigatório + HSTS | Infraestrutura |
| T06 | Enumeração | Respostas Uniformes | BFF |
| T07 | CSRF | Tokens CSRF (csurf) | BFF + Frontend |
| T08 | Sem Logging | Winston + Prometheus Metrics | BFF |
| T09 | Session Inseguro | Redis + Secure Cookies | BFF |
| T10 | Perguntas Fracas | Perguntas de Alta Entropia (>10^20) | Dados |
| T11 | CORS Inadequado | CORS Restritivo | BFF |
| T12 | Sem Notificação | Email/SMS (estrutura pronta) | BFF |
| T13 | Device Fingerprint | FingerprintJS (estrutura pronta) | Frontend |

---

## 📁 ESTRUTURA DO PROJETO

```
caju-sec-champion/
├── Lab-v4/                          # Backend vulnerável (não modificar)
│   ├── uploads/                     # Perguntas secretas (26 arquivos JSON)
│   │   ├── admin_secrets.json
│   │   ├── alice_secrets.json
│   │   └── ... (24 usuários)
│   └── src/main/kotlin/...
│
├── bff/                             # Backend for Frontend (Camada de Proteção)
│   ├── src/
│   │   ├── config/                  # Configurações (Redis, Session, Helmet, CORS)
│   │   ├── middleware/              # Middlewares de segurança
│   │   │   ├── rateLimiting.ts      # Rate limiting multi-camada
│   │   │   ├── captcha.ts           # Validação reCAPTCHA v2/v3
│   │   │   ├── validation.ts        # Validação e sanitização de inputs
│   │   │   ├── accountLockout.ts    # Bloqueio progressivo
│   │   │   ├── csrf.ts              # Proteção CSRF
│   │   │   └── errorHandler.ts      # Tratamento de erros
│   │   ├── controllers/             # Lógica de negócio
│   │   │   ├── recoveryController.ts
│   │   │   └── csrfController.ts
│   │   ├── services/                # Serviços
│   │   │   ├── secretsService.ts    # Leitura de perguntas secretas
│   │   │   └── backendService.ts    # Comunicação com Lab-v4
│   │   ├── routes/                  # Rotas HTTP
│   │   ├── utils/                   # Utilitários (hash, logger, metrics)
│   │   ├── types/                   # Definições TypeScript
│   │   └── app.ts                   # Aplicação Express principal
│   ├── logs/                        # Logs (Winston)
│   ├── package.json
│   ├── tsconfig.json
│   ├── .env.example
│   └── ecosystem.config.js          # PM2 configuration
│
├── frontend/                        # Frontend React
│   ├── src/
│   │   ├── components/              # Componentes React
│   │   ├── services/                # API client (axios)
│   │   │   ├── api.ts
│   │   │   └── recovery.ts
│   │   ├── types/                   # Definições TypeScript
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── index.css
│   ├── public/
│   │   └── index.html               # HTML base (CSP headers)
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   └── .env.example
│
├── ETAPA1-MODELAGEM-AMEACAS.md      # Análise de ameaças (3 perfis, 13 vulnerabilidades)
├── ETAPA2-OWASP-Risk-Rating.xlsx    # Planilha de riscos (5 abas)
├── ETAPA2-METODOLOGIA-OWASP.md      # Explicação da metodologia
├── ETAPA3-DESIGN-SOLUCAO.md         # Design completo (1400 linhas, código TypeScript)
├── PERGUNTAS-SECRETAS-README.md     # Documentação perguntas alta entropia
├── RESUMO-EXECUTIVO.md              # Resumo completo do projeto
│
├── gerar_planilha_owasp.py          # Script Python (geração de planilha)
├── gerar_perguntas_secretas.py      # Script Python (geração de perguntas)
│
└── README.md                        # Este arquivo
```

---

## 🚀 SETUP E INSTALAÇÃO

### Pré-requisitos

- **Node.js** 20.x ou superior
- **npm** 9.x ou superior
- **Redis** 7.x
- **Docker** e **Docker Compose** (recomendado para Backend Lab-v4)
- **JDK** 17 (se rodar Lab-v4 sem Docker)
- **Maven** (se rodar Lab-v4 sem Docker)

### 1. Clonar o Repositório

```bash
git clone <repository-url>
cd caju-sec-champion
```

### 2. Setup do Backend (Lab-v4)

O backend Lab-v4 é vulnerável intencionalmente e **NÃO deve ser modificado**.

#### Opção A: Docker (Recomendado)

```bash
cd Lab-v4
docker compose up -d
```

Serviços:
- **App**: `http://localhost:8080`
- **PostgreSQL**: `localhost:5432` (db: vulndb, user: vuln, pass: vuln)
- **SSRF Target**: interno (nginx)

#### Opção B: Local (sem Docker)

1. Iniciar PostgreSQL local com credenciais do `docker-compose.yml`
2. Ajustar `application.properties` se necessário
3. Executar:

```bash
cd Lab-v4
mvn clean package
mvn spring-boot:run
```

**Verificar**: `curl http://localhost:8080/health` deve retornar status ok.

### 3. Setup do Redis

Redis é necessário para o BFF (sessão, rate limiting, bloqueios).

#### Opção A: Docker

```bash
docker run -d --name redis -p 6379:6379 redis:7-alpine
```

#### Opção B: Local

```bash
# macOS (Homebrew)
brew install redis
brew services start redis

# Linux (Ubuntu/Debian)
sudo apt-get install redis-server
sudo systemctl start redis
```

**Verificar**: `redis-cli ping` deve retornar `PONG`.

### 4. Setup do BFF

```bash
cd bff

# Instalar dependências
npm install

# Copiar variáveis de ambiente
cp .env.example .env

# Editar .env:
# - SESSION_SECRET: gerar secret forte (crypto.randomBytes(64).toString('hex'))
# - RECAPTCHA_V3_SECRET_KEY: obter em https://www.google.com/recaptcha/admin
# - RECAPTCHA_V2_SECRET_KEY: obter em https://www.google.com/recaptcha/admin
# - SECRETS_PATH: ajustar caminho para Lab-v4/uploads se necessário

# Build
npm run build

# Desenvolvimento (com hot reload)
npm run dev

# Produção
npm start

# Produção com PM2 (recomendado)
npm install -g pm2
npm run pm2:start
```

**Verificar**:
- Health: `curl http://localhost:4000/health`
- Métricas: `curl http://localhost:4000/metrics`

### 5. Setup do Frontend

```bash
cd frontend

# Instalar dependências
npm install

# Copiar variáveis de ambiente
cp .env.example .env

# Editar .env:
# - VITE_API_URL: URL do BFF (http://localhost:4000)
# - VITE_RECAPTCHA_V3_SITE_KEY: site key do reCAPTCHA v3
# - VITE_RECAPTCHA_V2_SITE_KEY: site key do reCAPTCHA v2

# Desenvolvimento
npm run dev

# Build de produção
npm run build

# Preview do build
npm run preview
```

**Verificar**: Abrir `http://localhost:3000` no navegador.

### 6. Obter Chaves reCAPTCHA

1. Acessar: https://www.google.com/recaptcha/admin
2. Criar 2 sites:
   - **reCAPTCHA v3** (invisível, score-based)
   - **reCAPTCHA v2** (checkbox challenge)
3. Adicionar domínio: `localhost` (para desenvolvimento)
4. Copiar **Site Key** e **Secret Key** para `.env` (BFF e Frontend)

---

## 🧪 TESTANDO O SISTEMA

### 1. Verificar Todos os Serviços

```bash
# Backend Lab-v4
curl http://localhost:8080/health

# Redis
redis-cli ping

# BFF
curl http://localhost:4000/health

# Frontend (abrir no navegador)
open http://localhost:3000
```

### 2. Teste de Recuperação (Usuário Admin)

**Dados do usuário admin**:
- CPF: `123.456.789-00`
- Perguntas/Respostas (em `Lab-v4/uploads/admin_secrets.json`):
  1. Banco: **Sicredi**
  2. Empresa: **DataCore Solutions**
  3. Agência: **6802**
  4. Código: **181429**
  5. Última transação: **771.33**

**Fluxo**:
1. Acessar `http://localhost:3000`
2. Informar CPF: `123.456.789-00`
3. Resolver reCAPTCHA
4. Responder 5 perguntas com dados acima
5. Definir nova senha (forte)

### 3. Teste de Rate Limiting

```bash
# Tentar 4 vezes com mesmo CPF (deve bloquear na 4ª)
for i in {1..4}; do
  curl -X POST http://localhost:4000/api/recovery/init \
    -H "Content-Type: application/json" \
    -d '{"cpf":"123.456.789-00","recaptcha_token":"test"}' \
    --cookie-jar cookies.txt --cookie cookies.txt
  echo "\n--- Tentativa $i ---\n"
done
```

### 4. Teste de Bloqueio de Conta

Após 3 tentativas incorretas, conta deve ser bloqueada por 15 minutos.

```bash
# Logs do BFF mostrarão:
# ⚠️  CPF bloqueado por 15 minutos após 3 tentativas
tail -f bff/logs/bff-combined.log
```

### 5. Métricas Prometheus

```bash
# Ver métricas
curl http://localhost:4000/metrics | grep -E "recovery|rate_limit|captcha|lockout"
```

---

## 📊 MONITORAMENTO

### Logs

**BFF Logs** (Winston):
```bash
# Ver logs combinados
tail -f bff/logs/bff-combined.log

# Ver apenas erros
tail -f bff/logs/bff.log

# PM2 logs
pm2 logs caju-bff
```

### Métricas Disponíveis

- `http_requests_total`: Total de requisições HTTP
- `http_request_duration_seconds`: Duração de requisições
- `recovery_attempts_total`: Tentativas de recuperação (success/failure)
- `account_lockout_total`: Bloqueios de conta por tier
- `captcha_validation_total`: Validações de CAPTCHA
- `rate_limit_hits_total`: Hits de rate limiting

**Integração com Prometheus** (opcional):

```yaml
# prometheus.yml
scrape_configs:
  - job_name: 'caju-bff'
    static_configs:
      - targets: ['localhost:4000']
    metrics_path: '/metrics'
```

---

## 🔒 SEGURANÇA EM PRODUÇÃO

### Checklist Pré-Deploy

- [ ] Alterar `SESSION_SECRET` para secret forte e único
- [ ] Configurar HTTPS (TLS 1.3) em Frontend e BFF
- [ ] Habilitar HSTS (`helmet` configurado)
- [ ] Configurar chaves reCAPTCHA específicas do domínio de produção
- [ ] Configurar CORS para domínio específico (não `*`)
- [ ] Configurar Redis com senha (`REDIS_PASSWORD`)
- [ ] Revisar limites de rate limiting para tráfego real
- [ ] Configurar WAF/Cloudflare na frente do Frontend
- [ ] Habilitar logs estruturados para SIEM
- [ ] Configurar alertas para tentativas de ataque (3+ falhas)
- [ ] Implementar backup de dados de sessão (Redis)
- [ ] Implementar notificações (Email/SMS) para recuperações bem-sucedidas
- [ ] Revisar políticas de senha (já implementado: 8+ chars, maiúscula, minúscula, número, especial)
- [ ] Configurar `NODE_ENV=production` em ambos os projetos

---

## 🛠️ DESENVOLVIMENTO

### Adicionar Novos Usuários

1. Editar `gerar_perguntas_secretas.py` (adicionar usuário ao array)
2. Executar:

```bash
python3 gerar_perguntas_secretas.py
```

3. Novos arquivos `<username>_secrets.json` serão criados em `Lab-v4/uploads/`

### Modificar Perguntas

1. Editar categorias e perguntas em `gerar_perguntas_secretas.py`
2. Re-gerar arquivos (comando acima)
3. **Importante**: Hashes SHA-256 serão recalculados automaticamente

### Rodar Testes (estrutura pronta)

```bash
# BFF
cd bff
npm test

# Frontend
cd frontend
npm test
```

---

## 📚 DOCUMENTAÇÃO ADICIONAL

- **ETAPA1-MODELAGEM-AMEACAS.md**: Análise completa de 3 perfis de atacantes e 13 vulnerabilidades
- **ETAPA2-OWASP-Risk-Rating.xlsx**: Planilha com cálculos OWASP Risk Rating para as 13 ameaças
- **ETAPA2-METODOLOGIA-OWASP.md**: Explicação detalhada da metodologia aplicada
- **ETAPA3-DESIGN-SOLUCAO.md**: Design completo com código TypeScript de todos os componentes
- **PERGUNTAS-SECRETAS-README.md**: Análise de entropia e design das perguntas secretas
- **RESUMO-EXECUTIVO.md**: Resumo executivo com estatísticas e próximos passos

---

## 🤝 CONTRIBUINDO

Este é um projeto educacional para o Desafio Caju Security Champions.

**Importante**: O backend Lab-v4 contém vulnerabilidades intencionais e **NÃO deve ser modificado**. Todas as mitigações devem ser implementadas no Frontend e BFF.

---

## 📞 SUPORTE

- **Autor**: Security Champions Team - Caju
- **Data**: 2025-11-14
- **Versão**: 1.0

---

## ⚠️ DISCLAIMER

Este projeto demonstra vulnerabilidades comuns em aplicações web em um ambiente controlado para fins educacionais.

**NÃO USE EM PRODUÇÃO SEM REVISÃO DE SEGURANÇA COMPLETA.**

O Backend Lab-v4 é intencionalmente vulnerável. Em produção, substitua por backend seguro ou implemente todas as mitigações documentadas.

---

**Data**: 2025-11-14
**Versão**: 1.0
**Status**: Implementação Completa de Camada de Proteção (BFF)
