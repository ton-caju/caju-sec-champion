# ETAPA 5: TESTES E2E DE SEGURANÇA
## Desafio Caju Security Champions - Recuperação de Senha com Validação de Identidade (PID)

---

## 1. VISÃO GERAL DOS TESTES

Esta etapa documenta os cenários de teste end-to-end (E2E) de segurança para validar que todas as 13 mitigações implementadas estão funcionando corretamente.

### 1.1 Objetivos dos Testes

- ✅ Validar que todas as mitigações de segurança estão funcionais
- ✅ Verificar que o BFF protege o backend vulnerável
- ✅ Confirmar que atacantes não conseguem explorar as vulnerabilidades
- ✅ Documentar evidências de segurança para auditoria

### 1.2 Tipos de Testes

| Tipo | Descrição | Quantidade |
|------|-----------|------------|
| **Funcionais** | Fluxo normal de recuperação | 3 cenários |
| **Segurança - Rate Limiting** | Testes de limite de requisições | 4 cenários |
| **Segurança - Bloqueio** | Testes de bloqueio de conta | 4 cenários |
| **Segurança - Validação** | Testes de validação e sanitização | 6 cenários |
| **Segurança - CAPTCHA** | Testes de validação de CAPTCHA | 3 cenários |
| **Segurança - Autenticação** | Testes de CSRF e sessão | 4 cenários |
| **Total** | | **24 cenários** |

---

## 2. CENÁRIOS DE TESTE FUNCIONAIS

### 2.1 Teste F01: Recuperação Bem-Sucedida (Happy Path)

**Objetivo**: Validar fluxo completo de recuperação de senha.

**Pré-condições**:
- Backend Lab-v4 rodando em `localhost:8080`
- BFF rodando em `localhost:4000`
- Frontend rodando em `localhost:3000`
- Redis rodando em `localhost:6379`
- Usuário existe: `admin` (CPF: 123.456.789-00)

**Passos**:
1. Abrir navegador em `http://localhost:3000`
2. Verificar que CSRF token foi obtido (Network tab)
3. Informar CPF: `123.456.789-00`
4. Resolver reCAPTCHA v3 (invisível)
5. Clicar em "Recuperar Senha"
6. Aguardar perguntas serem exibidas
7. Responder perguntas corretas:
   - Banco: `Sicredi`
   - Empresa: `DataCore Solutions`
   - Agência: `6802`
   - Código: `181429`
   - Última transação: `771.33`
8. Clicar em "Validar Respostas"
9. Aguardar token de reset
10. Informar nova senha forte: `NovaSenh@123`
11. Clicar em "Redefinir Senha"
12. Verificar redirecionamento para /login

**Resultado Esperado**:
- ✅ Status 200 em todas as requisições
- ✅ Perguntas exibidas corretamente
- ✅ Validação bem-sucedida
- ✅ Senha alterada no backend
- ✅ Mensagem de sucesso exibida

**Evidências**:
- Screenshot de cada etapa
- Logs do BFF mostrando sucesso
- Registro de métricas: `recovery_attempts_total{result="success"}`

---

### 2.2 Teste F02: Recuperação com Respostas Incorretas

**Objetivo**: Validar comportamento quando usuário erra respostas.

**Passos**:
1-6. (Igual ao F01)
7. Responder perguntas incorretas:
   - Banco: `Itaú` (errado)
   - Empresa: `DataCore Solutions` (correto)
   - Agência: `1234` (errado)
   - Código: `000000` (errado)
   - Última transação: `100.00` (errado)
8. Clicar em "Validar Respostas"

**Resultado Esperado**:
- ✅ Status 400 (Bad Request)
- ✅ Mensagem de erro: "Uma ou mais respostas estão incorretas"
- ✅ Contador de falhas incrementado no Redis
- ✅ Log de tentativa falhada

**Evidências**:
- Response JSON com erro
- Log do BFF: `❌ Tentativa de recuperação falhada`
- Redis key `failures:12345678900` = 1

---

### 2.3 Teste F03: Recuperação com CPF Não Cadastrado

**Objetivo**: Validar resposta uniforme para prevenir enumeração.

**Passos**:
1-4. (Igual ao F01)
5. Informar CPF não cadastrado: `999.999.999-99`
6. Clicar em "Recuperar Senha"

**Resultado Esperado**:
- ✅ Status 200 (OK) - **NÃO deve retornar erro**
- ✅ Perguntas falsas exibidas (para prevenir enumeração)
- ✅ Mesma aparência de usuário válido
- ✅ Log interno: "Tentativa de recuperação para CPF não cadastrado"

**Evidências**:
- Response 200 com perguntas genéricas
- Log do BFF (warn level)
- Tempo de resposta similar ao de usuário válido

---

## 3. TESTES DE SEGURANÇA - RATE LIMITING

### 3.1 Teste S01: Rate Limiting por IP

**Objetivo**: Validar que IP é bloqueado após 10 requisições/hora.

**Ferramenta**: `curl` ou script Python

**Passos**:
```bash
#!/bin/bash
for i in {1..12}; do
  echo "=== Tentativa $i ==="
  curl -X POST http://localhost:4000/api/recovery/init \
    -H "Content-Type: application/json" \
    -d '{"cpf":"123.456.789-00","recaptcha_token":"test_token"}' \
    --cookie-jar cookies.txt --cookie cookies.txt
  echo -e "\n"
done
```

**Resultado Esperado**:
- ✅ Tentativas 1-10: Status 200 ou 400
- ✅ Tentativas 11-12: Status 429 (Too Many Requests)
- ✅ Response: `"error": "Muitas tentativas deste endereço IP"`
- ✅ Header: `Retry-After: 3600`
- ✅ Métrica: `rate_limit_hits_total{type="ip"}` incrementada

**Evidências**:
- Output do script mostrando 429
- Redis key `rl:ip:<ip_address>` com valor 11
- Metrics endpoint mostrando contador

---

### 3.2 Teste S02: Rate Limiting por CPF

**Objetivo**: Validar que CPF é bloqueado após 3 tentativas/15min.

**Passos**:
```bash
#!/bin/bash
CPF="123.456.789-00"
for i in {1..5}; do
  echo "=== Tentativa $i para CPF $CPF ==="
  curl -X POST http://localhost:4000/api/recovery/init \
    -H "Content-Type: application/json" \
    -d "{\"cpf\":\"$CPF\",\"recaptcha_token\":\"test_token\"}" \
    --cookie-jar cookies.txt --cookie cookies.txt
  echo -e "\n"
done
```

**Resultado Esperado**:
- ✅ Tentativas 1-3: Status 200
- ✅ Tentativas 4-5: Status 429
- ✅ Response: `"error": "Limite de tentativas excedido para este CPF"`
- ✅ Mensagem: "Aguarde X minutos antes de tentar novamente"
- ✅ Métrica: `rate_limit_hits_total{type="cpf"}` incrementada

**Evidências**:
- Redis key `rl:cpf:12345678900` = 4
- TTL do key: ~900 segundos (15 minutos)

---

### 3.3 Teste S03: Rate Limiting por Sessão

**Objetivo**: Validar que sessão é bloqueada após 5 tentativas/dia.

**Passos**:
Usar mesmo cookie de sessão em 6 requisições consecutivas.

**Resultado Esperado**:
- ✅ Tentativas 1-5: Permitidas
- ✅ Tentativa 6: Status 429
- ✅ Mensagem: "Limite de tentativas excedido para esta sessão"

---

### 3.4 Teste S04: Bypass de Rate Limiting (Negativo)

**Objetivo**: Verificar que atacante NÃO consegue bypassar rate limiting.

**Técnicas testadas**:
1. Mudar User-Agent → ❌ Deve falhar (limite por IP)
2. Usar proxy/VPN diferente → ✅ Novo IP, mas CPF bloqueado
3. Limpar cookies → ❌ Deve falhar (limite por IP persiste)
4. Usar X-Forwarded-For header → ❌ Deve falhar (BFF ignora)

**Resultado Esperado**:
- ✅ Todas as tentativas de bypass falham
- ✅ Rate limiting permanece aplicado

---

## 4. TESTES DE SEGURANÇA - BLOQUEIO DE CONTA

### 4.1 Teste S05: Bloqueio Tier 1 (3 falhas = 15 minutos)

**Objetivo**: Validar bloqueio após 3 tentativas incorretas.

**Passos**:
1. Tentar recuperar senha 3 vezes com respostas incorretas
2. Aguardar response da 3ª tentativa
3. Tentar 4ª vez imediatamente

**Resultado Esperado**:
- ✅ 4ª tentativa: Status 429
- ✅ Response: `"blocked": true`
- ✅ Mensagem: "Conta temporariamente bloqueada"
- ✅ `retry_after`: ~900 segundos
- ✅ Redis key `lockout:12345678900` criado com TTL 900s
- ✅ Log: `⚠️  CPF bloqueado por 15 minutos após 3 tentativas`
- ✅ Métrica: `account_lockout_total{tier="15 minutos"}` = 1

---

### 4.2 Teste S06: Bloqueio Tier 2 (5 falhas = 1 hora)

**Objetivo**: Validar bloqueio progressivo após 5 falhas.

**Passos**:
1. Aguardar expiração do bloqueio Tier 1 (15 min)
2. Tentar mais 2 vezes com respostas incorretas (total 5 falhas)
3. Verificar bloqueio de 1 hora

**Resultado Esperado**:
- ✅ Status 429
- ✅ `retry_after`: ~3600 segundos
- ✅ Mensagem: "Aguarde 60 minutos"
- ✅ Métrica: `account_lockout_total{tier="1 hora"}` = 1

---

### 4.3 Teste S07: Bloqueio Tier 3 (10 falhas = 24 horas)

**Objetivo**: Validar bloqueio de 24 horas.

**Passos**:
1. Simular 10 tentativas falhadas (pode usar Redis diretamente para acelerar)
2. Verificar bloqueio de 24 horas

**Resultado Esperado**:
- ✅ `retry_after`: ~86400 segundos
- ✅ Métrica: `account_lockout_total{tier="24 horas"}` = 1

---

### 4.4 Teste S08: Bloqueio Permanente (20 falhas)

**Objetivo**: Validar bloqueio permanente após 20 falhas.

**Passos**:
```bash
# Simular 20 falhas no Redis
redis-cli SET "failures:12345678900" 20
redis-cli SET "lockout:12345678900" "permanent"
```

**Resultado Esperado**:
- ✅ Status 403 (Forbidden)
- ✅ `"permanent": true`
- ✅ Mensagem: "Entre em contato com o suporte para desbloquear"
- ✅ Log crítico: `🚨 ALERTA: CPF bloqueado permanentemente`
- ✅ Métrica: `account_lockout_total{tier="permanent"}` = 1

---

## 5. TESTES DE SEGURANÇA - VALIDAÇÃO E SANITIZAÇÃO

### 5.1 Teste S09: SQLi em Campo CPF

**Objetivo**: Verificar que SQL Injection é bloqueada.

**Payloads**:
```
' OR '1'='1
'; DROP TABLE users; --
1' UNION SELECT * FROM users--
```

**Resultado Esperado**:
- ✅ Status 400 (Bad Request)
- ✅ Mensagem: "CPF inválido" (validação de formato)
- ✅ Caracteres especiais removidos pela sanitização
- ✅ Backend nunca recebe payload malicioso

---

### 5.2 Teste S10: XSS em Respostas

**Objetivo**: Verificar que XSS é bloqueada.

**Payloads**:
```html
<script>alert('XSS')</script>
<img src=x onerror=alert('XSS')>
javascript:alert('XSS')
```

**Resultado Esperado**:
- ✅ Tags HTML removidas pela sanitização
- ✅ Resposta armazenada sem código malicioso
- ✅ DOMPurify sanitiza antes de armazenar

---

### 5.3 Teste S11: Path Traversal em Respostas

**Objetivo**: Verificar que Path Traversal é bloqueada.

**Payloads**:
```
../../etc/passwd
..\..\windows\system32
....//....//etc/passwd
```

**Resultado Esperado**:
- ✅ `..` removido pela sanitização
- ✅ Resposta normalizada

---

### 5.4 Teste S12: Command Injection

**Objetivo**: Verificar que Command Injection é bloqueada.

**Payloads**:
```
; ls -la
| cat /etc/passwd
`whoami`
$(whoami)
```

**Resultado Esperado**:
- ✅ Caracteres `;`, `|`, `` ` ``, `$` removidos
- ✅ Backend nunca recebe comando malicioso

---

### 5.5 Teste S13: Validação de CPF com Dígitos Incorretos

**Objetivo**: Verificar validação de dígitos verificadores do CPF.

**CPFs inválidos**:
```
123.456.789-01  (dígito verificador errado)
111.111.111-11  (todos iguais)
000.000.000-00  (todos zeros)
```

**Resultado Esperado**:
- ✅ Status 400
- ✅ Mensagem: "CPF inválido"

---

### 5.6 Teste S14: Validação de Senha Fraca

**Objetivo**: Verificar validação de força de senha.

**Senhas inválidas**:
```
123456        (muito curta)
abcdefgh      (sem maiúscula, número, especial)
ABCDEFGH      (sem minúscula, número, especial)
Abcdefgh      (sem número, especial)
Abcdef12      (sem especial)
```

**Resultado Esperado**:
- ✅ Status 400
- ✅ Mensagens específicas para cada requisito faltante

---

## 6. TESTES DE SEGURANÇA - CAPTCHA

### 6.1 Teste S15: reCAPTCHA v3 com Score Baixo

**Objetivo**: Verificar que score baixo exige reCAPTCHA v2.

**Passos**:
1. Simular token reCAPTCHA v3 com score 0.3 (abaixo do threshold 0.5)
2. Enviar requisição

**Resultado Esperado**:
- ✅ Status 400
- ✅ `"require_captcha_v2": true`
- ✅ Mensagem: "Atividade suspeita detectada"
- ✅ Métrica: `captcha_validation_total{version="v3",result="low_score"}` incrementada

---

### 6.2 Teste S16: reCAPTCHA v2 Obrigatório Após Falhas

**Objetivo**: Verificar que v2 é exigido após 2 tentativas falhadas.

**Passos**:
1. Falhar 2 vezes com reCAPTCHA v3
2. Na 3ª tentativa, verificar se v2 é exigido

**Resultado Esperado**:
- ✅ Frontend exibe desafio visual (checkbox)
- ✅ Requisição sem v2 token é rejeitada

---

### 6.3 Teste S17: Bypass de CAPTCHA (Negativo)

**Objetivo**: Verificar que CAPTCHA não pode ser bypassado.

**Tentativas**:
1. Enviar token vazio → ❌ Deve falhar
2. Enviar token expirado → ❌ Deve falhar
3. Enviar token de outro site → ❌ Deve falhar
4. Reutilizar token → ❌ Deve falhar (Google não permite reuso)

**Resultado Esperado**:
- ✅ Todas tentativas de bypass falham com 400

---

## 7. TESTES DE SEGURANÇA - CSRF E SESSÃO

### 7.1 Teste S18: Requisição sem CSRF Token

**Objetivo**: Verificar que CSRF token é obrigatório.

**Passos**:
```bash
curl -X POST http://localhost:4000/api/recovery/init \
  -H "Content-Type: application/json" \
  -d '{"cpf":"123.456.789-00","recaptcha_token":"test"}' \
  # SEM incluir X-CSRF-Token header
```

**Resultado Esperado**:
- ✅ Status 403 (Forbidden)
- ✅ `"error": "Token CSRF inválido"`

---

### 7.2 Teste S19: Requisição com CSRF Token Inválido

**Objetivo**: Verificar validação de CSRF token.

**Passos**:
```bash
curl -X POST http://localhost:4000/api/recovery/init \
  -H "Content-Type: application/json" \
  -H "X-CSRF-Token: token_invalido_123" \
  -d '{"cpf":"123.456.789-00","recaptcha_token":"test"}'
```

**Resultado Esperado**:
- ✅ Status 403
- ✅ Mensagem de token inválido

---

### 7.3 Teste S20: Expiração de Sessão (15 minutos)

**Objetivo**: Verificar que sessão expira após 15 minutos.

**Passos**:
1. Iniciar recuperação (obter perguntas)
2. Aguardar 16 minutos (ou ajustar Redis TTL para teste)
3. Tentar validar respostas

**Resultado Esperado**:
- ✅ Status 400
- ✅ Mensagem: "Sessão expirada"
- ✅ Redis key `recovery:<sessionId>` não existe mais

---

### 7.4 Teste S21: Session Fixation (Negativo)

**Objetivo**: Verificar que session ID é regenerado após eventos críticos.

**Passos**:
1. Capturar session ID inicial
2. Completar recuperação de senha
3. Verificar que session ID mudou

**Resultado Esperado**:
- ✅ Session ID diferente após recuperação bem-sucedida
- ✅ `regenerateSession` foi chamado

---

## 8. TESTES DE OBSERVABILIDADE

### 8.1 Teste O01: Métricas Prometheus

**Objetivo**: Verificar que métricas estão sendo coletadas.

**Passos**:
```bash
curl http://localhost:4000/metrics
```

**Resultado Esperado**:
```
# TYPE recovery_attempts_total counter
recovery_attempts_total{result="success"} 5
recovery_attempts_total{result="failure"} 12

# TYPE account_lockout_total counter
account_lockout_total{tier="15 minutos"} 3
account_lockout_total{tier="1 hora"} 1
account_lockout_total{tier="permanent"} 0

# TYPE captcha_validation_total counter
captcha_validation_total{version="v3",result="success"} 20
captcha_validation_total{version="v3",result="low_score"} 2

# TYPE rate_limit_hits_total counter
rate_limit_hits_total{type="ip"} 5
rate_limit_hits_total{type="cpf"} 8
rate_limit_hits_total{type="session"} 2
```

---

### 8.2 Teste O02: Logs Estruturados

**Objetivo**: Verificar que logs estão sendo gerados corretamente.

**Passos**:
```bash
tail -f bff/logs/bff-combined.log | jq
```

**Resultado Esperado**:
```json
{
  "timestamp": "2025-11-14 15:30:45",
  "level": "warn",
  "message": "❌ Tentativa de recuperação falhada",
  "cpf": "123***",
  "attempts": 2,
  "failures": 2,
  "correctAnswers": 3,
  "totalQuestions": 5
}

{
  "timestamp": "2025-11-14 15:35:12",
  "level": "error",
  "message": "🚨 ALERTA CRÍTICO: CPF bloqueado permanentemente",
  "cpf": "456***",
  "failures": 20
}
```

---

## 9. PLANO DE AUTOMAÇÃO (Futuro)

### 9.1 Framework Sugerido

**Opção 1: Playwright (E2E)**
```typescript
// tests/e2e/recovery.spec.ts
import { test, expect } from '@playwright/test';

test('F01: Recuperação bem-sucedida', async ({ page }) => {
  await page.goto('http://localhost:3000');
  await page.fill('#cpf', '123.456.789-00');
  await page.click('#submit');
  // ... continuar teste
});
```

**Opção 2: Jest + Supertest (API)**
```typescript
// tests/api/recovery.test.ts
import request from 'supertest';
import app from '../../src/app';

describe('Rate Limiting', () => {
  it('S01: Deve bloquear após 10 requisições por IP', async () => {
    for (let i = 0; i < 11; i++) {
      const res = await request(app)
        .post('/api/recovery/init')
        .send({ cpf: '123.456.789-00', recaptcha_token: 'test' });

      if (i < 10) {
        expect(res.status).toBeLessThan(500);
      } else {
        expect(res.status).toBe(429);
      }
    }
  });
});
```

### 9.2 Estrutura de Diretório de Testes

```
tests/
├── e2e/                      # Testes end-to-end (Playwright)
│   ├── recovery.spec.ts
│   ├── rate-limiting.spec.ts
│   └── security.spec.ts
├── integration/              # Testes de integração (Jest + Supertest)
│   ├── api/
│   │   ├── recovery.test.ts
│   │   ├── csrf.test.ts
│   │   └── validation.test.ts
│   └── services/
│       ├── secrets.test.ts
│       └── backend.test.ts
├── unit/                     # Testes unitários
│   ├── middleware/
│   │   ├── validation.test.ts
│   │   ├── sanitization.test.ts
│   │   └── hash.test.ts
│   └── utils/
│       ├── cpf.test.ts
│       └── logger.test.ts
└── fixtures/                 # Dados de teste
    ├── users.json
    └── secrets.json
```

---

## 10. RESULTADOS ESPERADOS E CRITÉRIOS DE ACEITAÇÃO

### 10.1 Critérios de Aceitação

Para considerar a implementação **APROVADA** em segurança:

| Categoria | Critério | Threshold |
|-----------|----------|-----------|
| **Funcionais** | Todos os 3 testes funcionais passam | 100% |
| **Rate Limiting** | Todos os 4 testes de rate limiting passam | 100% |
| **Bloqueio** | Todos os 4 tiers de bloqueio funcionam | 100% |
| **Validação** | Todas as 6 validações/sanitizações funcionam | 100% |
| **CAPTCHA** | Todos os 3 testes de CAPTCHA passam | 100% |
| **CSRF/Sessão** | Todos os 4 testes de autenticação passam | 100% |
| **Observabilidade** | Métricas e logs funcionais | 100% |
| **Total** | | **24/24 cenários passando** |

### 10.2 Relatório de Testes

Após execução, documentar em **ETAPA5-RESULTADOS.md**:

```markdown
# RESULTADOS DOS TESTES E2E

## Resumo Executivo

- **Data**: 2025-11-14
- **Duração**: 4 horas
- **Total de cenários**: 24
- **Passaram**: 24 (100%)
- **Falharam**: 0 (0%)
- **Status**: ✅ APROVADO

## Detalhamento por Categoria

### Testes Funcionais (3/3) ✅
- F01: Recuperação Bem-Sucedida → ✅ PASS
- F02: Respostas Incorretas → ✅ PASS
- F03: CPF Não Cadastrado → ✅ PASS

### Testes de Rate Limiting (4/4) ✅
- S01: Rate Limiting por IP → ✅ PASS
- S02: Rate Limiting por CPF → ✅ PASS
- S03: Rate Limiting por Sessão → ✅ PASS
- S04: Bypass de Rate Limiting → ✅ PASS (nenhum bypass funcionou)

[... continuar para todas as categorias ...]

## Evidências
- Screenshots: tests/screenshots/
- Logs: tests/logs/
- Métricas: tests/metrics/
```

---

## 11. CONCLUSÃO

Este documento fornece um **plano completo de testes E2E de segurança** com 24 cenários cobrindo todas as 13 mitigações implementadas.

### Próximos Passos:

1. ✅ **Executar testes manualmente** (usar este documento como checklist)
2. ⏳ **Documentar resultados** em ETAPA5-RESULTADOS.md
3. ⏳ **Automatizar testes** (Playwright + Jest)
4. ⏳ **Integrar CI/CD** (GitHub Actions para rodar testes automaticamente)

---

**Data**: 2025-11-14
**Versão**: 1.0
**Autor**: Security Champions Team - Caju
**Status**: Plano de Testes Completo - Pronto para Execução
