# ETAPA 2: METODOLOGIA OWASP RISK RATING
## Desafio Caju Security Champions - Recuperação de Senha com Validação de Identidade (PID)

---

## 1. SOBRE A METODOLOGIA OWASP RISK RATING

A **OWASP Risk Rating Methodology** é uma abordagem padronizada para avaliar e priorizar riscos de segurança em aplicações web. Esta metodologia permite quantificar riscos de forma objetiva, facilitando decisões sobre onde investir recursos de segurança.

### 1.1 Estrutura da Metodologia

```
┌─────────────────────────────────────────────────────────┐
│                    RISK SCORE                           │
│              (Severidade do Risco)                      │
└──────────────────┬──────────────────────────────────────┘
                   │
        ┌──────────┴──────────┐
        ▼                     ▼
   LIKELIHOOD              IMPACT
   (Probabilidade)      (Impacto)
        │                     │
   ┌────┴────┐          ┌────┴────┐
   ▼         ▼          ▼         ▼
THREAT    VULNERABILITY  TECHNICAL  BUSINESS
AGENT     FACTORS        IMPACT     IMPACT
```

### 1.2 Escala de Pontuação

Todos os fatores são avaliados numa escala de **0 a 9**:

- **0-2**: BAIXO
- **3-5**: MÉDIO
- **6-9**: ALTO

### 1.3 Cálculo do Risk Score

```
THREAT AGENT SCORE = (Skill + Motive + Opportunity + Size) / 4
VULNERABILITY SCORE = (Ease Discovery + Ease Exploit + Awareness + Intrusion Det.) / 4

LIKELIHOOD = (THREAT AGENT SCORE + VULNERABILITY SCORE) / 2

OVERALL RISK SCORE = (LIKELIHOOD + IMPACT) / 2
```

### 1.4 Classificação de Criticidade

Com base no OVERALL RISK SCORE:

- **0.0 - 2.9**: BAIXA
- **3.0 - 5.9**: MÉDIA
- **6.0 - 8.9**: ALTA
- **9.0 - 10.0**: CRÍTICA

---

## 2. LIKELIHOOD FACTORS (Fatores de Probabilidade)

### 2.1 THREAT AGENT FACTORS (Fatores do Atacante)

Estes fatores caracterizam o perfil do atacante:

#### **Skill Level (Nível de Habilidade)**
Qual o nível técnico necessário para explorar a vulnerabilidade?

| Pontuação | Descrição | Exemplo no Contexto PID |
|-----------|-----------|-------------------------|
| **0-2** (Baixo) | Nenhuma habilidade técnica | Usuário leigo tentando adivinhar |
| **3-5** (Médio) | Alguma habilidade técnica | Usuário com conhecimento básico de ferramentas |
| **6-9** (Alto) | Hacker profissional | Fraudador bancário com ferramentas automatizadas |

**Exemplo T01 (Força Bruta)**: **6** - Requer conhecimento de scripting e ferramentas de automação

#### **Motive (Motivação)**
Quão motivado está o atacante?

| Pontuação | Descrição | Exemplo no Contexto PID |
|-----------|-----------|-------------------------|
| **0-2** (Baixo) | Recompensa baixa | Vandalismo, curiosidade |
| **3-5** (Médio) | Recompensa possível | Acesso a dados pessoais |
| **6-9** (Alto) | Recompensa alta | Acesso a contas bancárias com saldo |

**Exemplo T01 (Força Bruta)**: **9** - Acesso direto a contas financeiras = motivação máxima

#### **Opportunity (Oportunidade)**
Quais recursos são necessários para executar o ataque?

| Pontuação | Descrição | Exemplo no Contexto PID |
|-----------|-----------|-------------------------|
| **0-2** (Baixo) | Acesso completo ou recursos caros necessários | Insider com privilégios administrativos |
| **3-5** (Médio) | Acesso especial ou recursos necessários | Usuário autenticado |
| **6-9** (Alto) | Algum acesso ou recursos | Qualquer usuário anônimo da Internet |

**Exemplo T01 (Força Bruta)**: **9** - Qualquer pessoa na Internet pode tentar, sem necessidade de autenticação prévia

#### **Size (Tamanho do Grupo de Atacantes)**
Quantos atacantes potenciais existem?

| Pontuação | Descrição | Exemplo no Contexto PID |
|-----------|-----------|-------------------------|
| **0-2** (Baixo) | Desenvolvedores / Administradores do sistema | 5-10 pessoas |
| **3-5** (Médio) | Usuários autenticados | Milhares de beneficiários |
| **6-9** (Alto) | Usuários anônimos da Internet | Milhões de atacantes potenciais |

**Exemplo T01 (Força Bruta)**: **9** - Qualquer pessoa na Internet com CPF válido

---

### 2.2 VULNERABILITY FACTORS (Fatores da Vulnerabilidade)

Estes fatores caracterizam a vulnerabilidade em si:

#### **Ease of Discovery (Facilidade de Descoberta)**
Quão fácil é para um atacante descobrir esta vulnerabilidade?

| Pontuação | Descrição | Exemplo no Contexto PID |
|-----------|-----------|-------------------------|
| **0-2** (Baixo) | Praticamente impossível | Vulnerabilidade oculta em código ofuscado |
| **3-5** (Médio) | Difícil | Requer análise de código-fonte ou testes avançados |
| **6-9** (Alto) | Fácil / Ferramentas automatizadas disponíveis | Visível em ferramentas como Burp Suite, OWASP ZAP |

**Exemplo T01 (Força Bruta)**: **9** - Imediatamente óbvio que não há rate limiting (ferramentas automatizadas detectam)

#### **Ease of Exploit (Facilidade de Exploração)**
Quão fácil é explorar a vulnerabilidade?

| Pontuação | Descrição | Exemplo no Contexto PID |
|-----------|-----------|-------------------------|
| **0-2** (Baixo) | Teórico | Requer condições específicas raramente alcançáveis |
| **3-5** (Médio) | Difícil | Requer desenvolvimento de exploit customizado |
| **6-9** (Alto) | Fácil / Exploits públicos disponíveis | Scripts prontos, ferramentas automatizadas |

**Exemplo T01 (Força Bruta)**: **9** - Scripts públicos disponíveis (Hydra, Burp Intruder)

#### **Awareness (Conscientização)**
Quão conhecida é esta vulnerabilidade?

| Pontuação | Descrição | Exemplo no Contexto PID |
|-----------|-----------|-------------------------|
| **0-2** (Baixo) | Desconhecida | Zero-day, não documentada |
| **3-5** (Médio) | Hidden (Obscura) | Conhecida por pequeno grupo de especialistas |
| **6-9** (Alto) | Óbvia / Conhecida publicamente | OWASP Top 10, CVE publicado |

**Exemplo T01 (Força Bruta)**: **7** - Ausência de rate limiting é problema conhecido (OWASP A04:2021)

#### **Intrusion Detection (Detecção de Intrusão)**
Quão provável é que a exploração seja detectada?

| Pontuação | Descrição | Exemplo no Contexto PID |
|-----------|-----------|-------------------------|
| **0-2** (Baixo) | Ativa detecção em aplicação | WAF, IDS/IPS, alertas em tempo real |
| **3-5** (Médio) | Logged e revisado | Logs gerados mas não monitorados ativamente |
| **6-9** (Alto) | Não logged | Nenhum log ou monitoramento |

**Exemplo T01 (Força Bruta)**: **9** - Sem logging de tentativas, ataques passam despercebidos

---

## 3. IMPACT FACTORS (Fatores de Impacto)

### 3.1 TECHNICAL IMPACT (Impacto Técnico)

Qual o impacto técnico se a vulnerabilidade for explorada?

#### **Loss of Confidentiality (Perda de Confidencialidade)**

| Pontuação | Descrição | Exemplo no Contexto PID |
|-----------|-----------|-------------------------|
| **0-2** (Baixo) | Dados não-sensíveis mínimos | Nomes de usuário públicos |
| **3-5** (Médio) | Dados não-sensíveis extensos ou sensíveis mínimos | E-mails, telefones de um usuário |
| **6-9** (Alto) | Dados sensíveis extensos | CPF, senhas, respostas secretas, dados financeiros |

**Exemplo T01 (Força Bruta)**: **9** - Acesso completo à conta = todos os dados sensíveis

#### **Loss of Integrity (Perda de Integridade)**

| Pontuação | Descrição | Exemplo no Contexto PID |
|-----------|-----------|-------------------------|
| **0-2** (Baixo) | Dados mínimos corrompidos | Alteração de preferências do usuário |
| **3-5** (Médio) | Dados mínimos críticos ou extensos não-críticos | Alteração de e-mail de contato |
| **6-9** (Alto) | Dados críticos extensos corrompidos | Alteração de senha, dados bancários |

**Exemplo T01 (Força Bruta)**: **9** - Atacante pode alterar senha e tomar controle da conta

#### **Loss of Availability (Perda de Disponibilidade)**

| Pontuação | Descrição | Exemplo no Contexto PID |
|-----------|-----------|-------------------------|
| **0-2** (Baixo) | Serviços secundários mínimos interrompidos | Feature não-crítica indisponível |
| **3-5** (Médio) | Serviços primários mínimos ou secundários extensos | Recuperação de senha lenta |
| **6-9** (Alto) | Serviços primários extensos interrompidos | Sistema de recuperação totalmente inoperante |

**Exemplo T02 (Automação)**: **8** - Ataques em massa podem derrubar sistema (DoS)

#### **Loss of Accountability (Perda de Rastreabilidade)**

| Pontuação | Descrição | Exemplo no Contexto PID |
|-----------|-----------|-------------------------|
| **0-2** (Baixo) | Totalmente rastreável | Logs completos de todas ações |
| **3-5** (Médio) | Possivelmente rastreável | Logs parciais |
| **6-9** (Alto) | Completamente anônimo | Sem logs, atacante não pode ser identificado |

**Exemplo T01 (Força Bruta)**: **9** - Sem logging, impossível identificar origem do ataque

---

### 3.2 BUSINESS IMPACT (Impacto ao Negócio)

Qual o impacto ao negócio da instituição financeira?

#### **Financial Damage (Dano Financeiro)**

| Pontuação | Descrição | Exemplo no Contexto PID |
|-----------|-----------|-------------------------|
| **0-2** (Baixo) | Menos que custo de correção | Prejuízo menor que R$ 10.000 |
| **3-5** (Médio) | Perda menor de receita | Prejuízo de R$ 10.000 - R$ 100.000 |
| **6-9** (Alto) | Falência / Prejuízo massivo | Prejuízo > R$ 100.000, potencial falência |

**Exemplo T01 (Força Bruta)**: **9** - Múltiplas contas comprometidas = milhões de reais em perdas

#### **Reputation Damage (Dano à Reputação)**

| Pontuação | Descrição | Exemplo no Contexto PID |
|-----------|-----------|-------------------------|
| **0-2** (Baixo) | Perda mínima | Incidente não divulgado publicamente |
| **3-5** (Médio) | Perda de contas importantes | Alguns clientes migram para concorrência |
| **6-9** (Alto) | Perda de goodwill / marca | Crise de confiança, manchetes negativas, êxodo de clientes |

**Exemplo T01 (Força Bruta)**: **9** - Breach massivo = perda irreparável de confiança

#### **Non-Compliance (Não-Conformidade)**

| Pontuação | Descrição | Exemplo no Contexto PID |
|-----------|-----------|-------------------------|
| **0-2** (Baixo) | Violação menor | Não-conformidade com política interna |
| **3-5** (Médio) | Violação clara | Violação de regulação setorial (BACEN) |
| **6-9** (Alto) | Violação de alto perfil | Violação de LGPD, multas massivas, processo judicial |

**Exemplo T01 (Força Bruta)**: **9** - Violação de LGPD Art. 46 (segurança inadequada) = multa até 2% do faturamento

#### **Privacy Violation (Violação de Privacidade)**

| Pontuação | Descrição | Exemplo no Contexto PID |
|-----------|-----------|-------------------------|
| **0-2** (Baixo) | Um indivíduo | Dados de 1 pessoa comprometidos |
| **3-5** (Médio) | Centenas de pessoas | Dados de 100-1000 pessoas |
| **6-9** (Alto) | Milhares de pessoas / LGPD | Dados de milhares, notificação obrigatória ANPD |

**Exemplo T01 (Força Bruta)**: **9** - Potencial comprometimento de milhares de beneficiários

---

## 4. ANÁLISE DETALHADA DAS 13 AMEAÇAS

### AMEAÇAS CRÍTICAS (Risk Score: 9.0 - 10.0)

---

#### **T01: Força Bruta sem Rate Limiting**

**LIKELIHOOD ANALYSIS**

| Fator | Score | Justificativa |
|-------|-------|---------------|
| **Skill Level** | 6 | Requer conhecimento de scripting (Python/JavaScript) e ferramentas de automação |
| **Motive** | 9 | Acesso direto a contas bancárias = motivação máxima para fraudadores |
| **Opportunity** | 9 | Qualquer pessoa na Internet pode tentar, endpoint público |
| **Size** | 9 | Milhões de atacantes potenciais (qualquer um com CPF válido) |
| **Ease of Discovery** | 9 | Imediatamente óbvio ao testar (ferramentas detectam ausência de rate limiting) |
| **Ease of Exploit** | 9 | Scripts prontos (Hydra, Burp Intruder), exploits públicos |
| **Awareness** | 7 | Problema conhecido (OWASP A04:2021 - Insecure Design) |
| **Intrusion Detection** | 9 | Sem logging, ataques passam completamente despercebidos |

**THREAT AGENT SCORE**: (6+9+9+9)/4 = **8.25**
**VULNERABILITY SCORE**: (9+9+7+9)/4 = **8.5**
**LIKELIHOOD**: (8.25+8.5)/2 = **8.38**

**IMPACT ANALYSIS**

| Fator | Score | Justificativa |
|-------|-------|---------------|
| **Technical Impact** | 9 | Confidencialidade (9), Integridade (9), Disponibilidade (7), Accountability (9) |
| **Business Impact** | 9 | Financial (9), Reputation (9), Non-Compliance (9), Privacy (9) |

**OVERALL RISK SCORE**: (8.38 + 9) / 2 = **8.69** → **CRÍTICA**

---

#### **T02: Automação sem CAPTCHA**

**LIKELIHOOD ANALYSIS**

| Fator | Score | Justificativa |
|-------|-------|---------------|
| **Skill Level** | 7 | Requer conhecimento de Selenium/Puppeteer ou uso de serviços de CAPTCHA solving |
| **Motive** | 8 | Comprometimento em massa, venda de acessos |
| **Opportunity** | 9 | Endpoint público, sem barreira de automação |
| **Size** | 9 | BotHerders com redes de milhares de IPs |
| **Ease of Discovery** | 9 | Óbvio pela ausência de desafio CAPTCHA |
| **Ease of Exploit** | 9 | Ferramentas automatizadas prontas (Selenium Grid, Playwright) |
| **Awareness** | 9 | Problema extremamente conhecido (OWASP Automated Threats) |
| **Intrusion Detection** | 9 | Difícil distinguir bots de humanos sem CAPTCHA |

**THREAT AGENT SCORE**: (7+8+9+9)/4 = **8.25**
**VULNERABILITY SCORE**: (9+9+9+9)/4 = **9.0**
**LIKELIHOOD**: (8.25+9.0)/2 = **8.63**

**IMPACT ANALYSIS**: **9** (mesmos impactos de T01, porém em escala massiva)

**OVERALL RISK SCORE**: (8.63 + 9) / 2 = **8.82** → **CRÍTICA**

---

#### **T03: Ausência de Bloqueio Temporário**

**LIKELIHOOD ANALYSIS**

| Fator | Score | Justificativa |
|-------|-------|---------------|
| **Skill Level** | 5 | Requer persistência, mas não habilidades avançadas |
| **Motive** | 9 | Permite tentativas ilimitadas até acertar |
| **Opportunity** | 9 | Qualquer atacante pode tentar indefinidamente |
| **Size** | 9 | Todos os tipos de atacantes se beneficiam |
| **Ease of Discovery** | 7 | Detectado após múltiplas tentativas sem bloqueio |
| **Ease of Exploit** | 8 | Simples loop de tentativas |
| **Awareness** | 7 | Prática conhecida (OWASP ASVS 2.2.1) |
| **Intrusion Detection** | 9 | Sem bloqueio, sem alerta |

**THREAT AGENT SCORE**: (5+9+9+9)/4 = **8.0**
**VULNERABILITY SCORE**: (7+8+7+9)/4 = **7.75**
**LIKELIHOOD**: (8.0+7.75)/2 = **7.88**

**IMPACT ANALYSIS**: **9** (permite comprometimento garantido com tempo suficiente)

**OVERALL RISK SCORE**: (7.88 + 9) / 2 = **8.44** → **CRÍTICA**

---

#### **T04: Input Validation Inadequada**

**LIKELIHOOD ANALYSIS**

| Fator | Score | Justificativa |
|-------|-------|---------------|
| **Skill Level** | 6 | Requer conhecimento de SQLi, XSS, Path Traversal |
| **Motive** | 9 | Permite acesso a dados sensíveis ou execução de código |
| **Opportunity** | 7 | Requer manipulação de requests (Burp Suite) |
| **Size** | 7 | Atacantes com conhecimento de injection |
| **Ease of Discovery** | 7 | Ferramentas de scanning detectam (OWASP ZAP, Burp) |
| **Ease of Exploit** | 8 | Payloads públicos disponíveis (SQLMap, XSS cheat sheets) |
| **Awareness** | 7 | OWASP Top 10 #3 (Injection) |
| **Intrusion Detection** | 9 | WAF ausente, inputs não sanitizados |

**THREAT AGENT SCORE**: (6+9+7+7)/4 = **7.25**
**VULNERABILITY SCORE**: (7+8+7+9)/4 = **7.75**
**LIKELIHOOD**: (7.25+7.75)/2 = **7.5**

**IMPACT ANALYSIS**: **9** (SQLi = database completo, XSS = roubo de sessões, Path Traversal = arquivos sensíveis)

**OVERALL RISK SCORE**: (7.5 + 9) / 2 = **8.25** → **CRÍTICA**

---

#### **T05: Comunicação HTTP sem TLS**

**LIKELIHOOD ANALYSIS**

| Fator | Score | Justificativa |
|-------|-------|---------------|
| **Skill Level** | 4 | Ferramentas prontas (Wireshark, mitmproxy) |
| **Motive** | 7 | Captura de credenciais em trânsito |
| **Opportunity** | 5 | Requer MITM (WiFi público, ARP spoofing) |
| **Size** | 9 | Qualquer atacante em mesma rede |
| **Ease of Discovery** | 6 | Detectado por scanners (SSL Labs, Qualys) |
| **Ease of Exploit** | 7 | Ferramentas prontas para MITM |
| **Awareness** | 9 | Problema extremamente conhecido |
| **Intrusion Detection** | 7 | MITM em rede pública é difícil de detectar |

**THREAT AGENT SCORE**: (4+7+5+9)/4 = **6.25**
**VULNERABILITY SCORE**: (6+7+9+7)/4 = **7.25**
**LIKELIHOOD**: (6.25+7.25)/2 = **6.75**

**IMPACT ANALYSIS**: **8** (exposição de CPF, respostas secretas, nova senha)

**OVERALL RISK SCORE**: (6.75 + 8) / 2 = **7.38** → **CRÍTICA**

---

### AMEAÇAS ALTAS (Risk Score: 6.0 - 8.9)

#### **T06: Enumeração de Usuários** (Risk Score: 7.5)
#### **T07: CSRF sem Proteção** (Risk Score: 7.25)
#### **T08: Ausência de Logging** (Risk Score: 7.0)
#### **T09: Session Management Inseguro** (Risk Score: 7.13)
#### **T10: Perguntas com Baixa Entropia** (Risk Score: 8.25)

*(Detalhamento completo disponível na planilha)*

---

### AMEAÇAS MÉDIAS (Risk Score: 3.0 - 5.9)

#### **T11: CORS Inadequado** (Risk Score: 5.75)
#### **T12: Sem Notificação ao Usuário** (Risk Score: 5.75)
#### **T13: Sem Device Fingerprinting** (Risk Score: 6.25)

*(Detalhamento completo disponível na planilha)*

---

## 5. RESUMO EXECUTIVO

### 5.1 Distribuição de Riscos

| Criticidade | Quantidade | % Total |
|-------------|------------|---------|
| **CRÍTICA** | 5 | 38% |
| **ALTA** | 5 | 38% |
| **MÉDIA** | 3 | 24% |
| **TOTAL** | 13 | 100% |

### 5.2 Top 5 Riscos Mais Críticos

1. **T02 - Automação sem CAPTCHA** (8.82) - Permite ataques em massa totalmente automatizados
2. **T01 - Força Bruta sem Rate Limiting** (8.69) - Tentativas ilimitadas de adivinhação
3. **T03 - Ausência de Bloqueio Temporário** (8.44) - Persistência do atacante sempre vence
4. **T10 - Perguntas com Baixa Entropia** (8.25) - Respostas facilmente adivinháveis
5. **T04 - Input Validation Inadequada** (8.25) - Abre portas para SQLi/XSS/Path Traversal

### 5.3 Investimento Recomendado por Fase

#### **FASE 1 - CRÍTICAS** (Obrigatório - Sprint 1)
- Rate Limiting Multi-Camada
- reCAPTCHA v3 + v2
- Bloqueio Temporário Progressivo
- Input Validation Rigorosa
- HTTPS Obrigatório

**ROI**: Reduz risco de 8.5 (CRÍTICO) para 3.0 (MÉDIO)

#### **FASE 2 - ALTAS** (Alta Prioridade - Sprint 2-3)
- Respostas Uniformes
- Tokens Anti-CSRF
- Logging Estruturado
- Session Management Seguro
- Perguntas de Alta Entropia

**ROI**: Reduz risco de 7.0 (ALTO) para 2.5 (BAIXO)

#### **FASE 3 - MÉDIAS** (Melhoria Contínua - Sprint 4+)
- CORS Restritivo
- Notificações ao Usuário
- Device Fingerprinting

**ROI**: Reduz risco de 5.9 (MÉDIO) para 2.0 (BAIXO)

---

## 6. CONCLUSÃO

A aplicação da **OWASP Risk Rating Methodology** ao fluxo de recuperação de senha por PID identificou **5 ameaças CRÍTICAS** e **5 ameaças ALTAS**, representando **76% do total de ameaças**.

A implementação das mitigações propostas na **Fase 1** (5 controles de segurança críticos) reduzirá o risco geral do sistema de **8.5 (CRÍTICO)** para aproximadamente **3.0 (MÉDIO)**, representando uma **redução de 65% no risco**.

O investimento estimado para implementação completa das 3 fases é de aproximadamente **80-120 horas de desenvolvimento**, com retorno significativo em:
- Prevenção de fraudes financeiras
- Conformidade com LGPD
- Proteção da reputação da instituição
- Redução de custos operacionais de resposta a incidentes

---

**Próxima Etapa**: Design de Solução com arquitetura segura (Etapa 3)

---

**Data**: 2025-11-14
**Autor**: Security Champions Team - Caju
**Versão**: 1.0
**Referências**:
- OWASP Risk Rating Methodology: https://owasp.org/www-community/OWASP_Risk_Rating_Methodology
- OWASP Top 10 2021: https://owasp.org/Top10/
- OWASP ASVS 4.0: https://owasp.org/www-project-application-security-verification-standard/
