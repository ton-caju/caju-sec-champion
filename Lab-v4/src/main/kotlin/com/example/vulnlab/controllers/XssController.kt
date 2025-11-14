package com.example.vulnlab.controllers

import org.springframework.jdbc.core.JdbcTemplate
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController
import org.springframework.web.bind.annotation.ResponseBody
import org.springframework.http.MediaType

@RestController
@RequestMapping("/xss")
class XssController(private val jdbcTemplate: JdbcTemplate) {
	// Reflected XSS: retorna entrada sem sanitização
	@GetMapping("/reflected", produces = [MediaType.TEXT_HTML_VALUE])
	@ResponseBody
	fun reflected(@RequestParam q: String): String {
		return "<html><body>Você pesquisou: $q</body></html>"
	}

	// Stored XSS: salva e renderiza sem sanitização
	@PostMapping("/store")
	fun store(@RequestParam author: String, @RequestParam content: String): String {
		jdbcTemplate.update("INSERT INTO posts(author, content) VALUES (?, ?)", author, content)
		return "OK"
	}

	@GetMapping("/list", produces = [MediaType.TEXT_HTML_VALUE])
	@ResponseBody
	fun list(): String {
		val rows = jdbcTemplate.queryForList("SELECT author, content FROM posts ORDER BY id DESC LIMIT 20")
		val sb = StringBuilder("<html><body><h1>Posts</h1><ul>")
		for (r in rows) {
			val author = r["author"]
			val content = r["content"]
			sb.append("<li><b>${author}</b>: ${content}</li>")
		}
		sb.append("</ul></body></html>")
		return sb.toString()
	}
}
