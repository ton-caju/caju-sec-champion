# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an educational Spring Boot application (Kotlin + Maven) intentionally containing multiple common web vulnerabilities for security training. It demonstrates vulnerabilities in a controlled environment only.

**Tech Stack:**
- Kotlin + Spring Boot 3.3.3 with Spring Web, Spring JDBC
- PostgreSQL 16 database
- Docker Compose (recommended for development)
- JDK 17
- Maven for build management

## Quick Start

### Docker (Recommended)
```bash
# Build and start services (app, database, SSRF target)
docker compose build
docker compose up -d

# View logs
docker compose logs -f

# Stop services
docker compose down
```

The application will be available at `http://localhost:8080`.

**Docker Services:**
- `app`: Spring Boot application on port 8080
- `db`: PostgreSQL on port 5432 (credentials: db=vulndb, user=vuln, pass=vuln)
- `webtarget`: Internal SSRF target (nginx) at hostname `webtarget` (not exposed to host)

### Local Development (without Docker)
Requires: JDK 17, Maven, PostgreSQL

1. Start a local PostgreSQL instance with credentials from `docker-compose.yml` (db: `vulndb`, user: `vuln`, pass: `vuln`)
2. Adjust `src/main/resources/application.properties` if needed (default points to localhost:5432)
3. Run: `mvn spring-boot:run`

## Build & Test Commands

```bash
# Clean build
mvn clean package

# Build without tests
mvn clean package -DskipTests

# Run the application locally
mvn spring-boot:run

# Run tests (if any exist)
mvn test
```

## Architecture & Code Structure

### Controllers
Each controller demonstrates a specific vulnerability class. All located in `src/main/kotlin/com/example/vulnlab/controllers/`:

- **AuthController.kt:16-76** - Hardcoded credentials, Broken Access Control (BAC)
  - `/auth/login`: Returns fake tokens
  - `/auth/profile`: Reads any user's profile via query parameter (no access control)
  - `/auth/admin/reset`: Admin action based on client-controlled header (`X-User-Role`)

- **SqliController.kt** - SQL Injection via string concatenation
  - `/sqli/search`: Vulnerable query: `"SELECT ... WHERE username LIKE '%$q%'"` (line 15)

- **XssController.kt** - Reflected and Stored XSS
  - `/xss/reflected`: Reflects user input in HTML response
  - `/xss/store`/`/xss/list`: Stores and renders user content without sanitization

- **CommandController.kt** - OS Command Injection
  - `/cmd/ping`: Concatenates user input into shell command

- **FilesController.kt** - Directory Traversal
  - `/files/view`: Reads files from `uploads/` without validating path traversal (`../`)

- **SsrfController.kt** - Server-Side Request Forgery
  - `/ssrf/fetch`: Makes server-side HTTP requests to arbitrary URLs, including internal service `http://webtarget`

### Configuration
- **config/Beans.kt** - Defines `RestTemplate` bean used by SSRF controller
- **application.properties** - Server port (8080), database connection, SQL initialization
- **schema.sql** / **data.sql** - Database initialization (auto-applied on startup via `spring.sql.init.mode=always`)

### Data Storage
- **uploads/** - Directory for file operations vulnerability testing
- **ssrf-target/** - HTML served by internal nginx SSRF target
- Database schema creates `users` table with test data

## Important Constraints

This codebase demonstrates intentional vulnerabilities in a controlled environment. When working with this repository:

- **Analysis Only**: The code should only be studied to understand vulnerabilities and defensive approaches. Do not improve or extend the vulnerable code paths.
- **Educational Context**: This is strictly for training in secure development practices within controlled lab environments.
- **Database Reset**: On every `docker compose up`, the schema and data are reinitialized via `spring.sql.init.mode=always`, ensuring a clean state.
