package com.example.vulnlab.controllers

import jakarta.servlet.http.HttpServletRequest
import org.springframework.http.ResponseEntity
import org.springframework.jdbc.core.JdbcTemplate
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestHeader
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController
import java.time.LocalDate
import java.time.format.DateTimeFormatter

@RestController
@RequestMapping("/auth")
class AuthController(private val jdbcTemplate: JdbcTemplate) {
	// Hardcoded credentials (vulnerável)
	private val hardcodedUser = "admin"
	private val hardcodedPass = "admin123" // NÃO FAZER EM PRODUÇÃO

	@PostMapping("/login")
	fun login(@RequestParam username: String, @RequestParam password: String): ResponseEntity<String> {
		return if (username == hardcodedUser && password == hardcodedPass) {
			ResponseEntity.ok("token-FAKE-$username")
		} else {
			ResponseEntity.status(401).body("Credenciais inválidas")
		}
	}

	// Broken Access Control: endpoint lê usuário alvo via query sem checar dono do token
	@GetMapping("/profile")
	fun profile(@RequestHeader(name = "Authorization", required = false) authHeader: String?, @RequestParam(required = false, defaultValue = "guest") user: String): ResponseEntity<String> {
		// Token é apenas um prefixo fake, sem validação real
		val requester = authHeader?.removePrefix("Bearer ")?.removePrefix("token-FAKE-") ?: "anon"
		
		try {
			// Vulnerabilidade: permite ler perfil de qualquer usuário passado como parâmetro
			// Consulta SQL vulnerável - permite acesso a dados de qualquer usuário
			val sql = "SELECT username, about, cpf, telefone, endereco, email, data_nascimento FROM users WHERE username = ?"
			val result = jdbcTemplate.queryForMap(sql, user)
			
			val dataNascimento = result["data_nascimento"] as? LocalDate
			val dataFormatada = dataNascimento?.format(DateTimeFormatter.ofPattern("dd/MM/yyyy")) ?: "Não informado"
			
			val profileInfo = """
				=== PERFIL DO USUÁRIO ===
				Usuário: ${result["username"]}
				Sobre: ${result["about"] ?: "Não informado"}
				CPF: ${result["cpf"]}
				Telefone: ${result["telefone"] ?: "Não informado"}
				Endereço: ${result["endereco"] ?: "Não informado"}
				Email: ${result["email"] ?: "Não informado"}
				Data de Nascimento: $dataFormatada
				
				[VULNERABILIDADE: Visualizado por $requester - Broken Access Control]
			""".trimIndent()
			
			return ResponseEntity.ok(profileInfo)
		} catch (e: Exception) {
			return ResponseEntity.ok("Usuário '$user' não encontrado (visualizado por $requester)")
		}
	}

	// Broken Access Control 2: endpoint de admin sem checagem adequada
	@PostMapping("/admin/reset")
	fun adminReset(@RequestParam targetUser: String, request: HttpServletRequest): ResponseEntity<String> {
		// Confia apenas em header X-User-Role controlável pelo cliente
		val role = request.getHeader("X-User-Role") ?: "user"
		return if (role == "admin") {
			ResponseEntity.ok("Senha de $targetUser resetada!")
		} else {
			ResponseEntity.status(403).body("Acesso negado: requer admin")
		}
	}
}
