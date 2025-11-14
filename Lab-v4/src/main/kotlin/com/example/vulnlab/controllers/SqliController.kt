package com.example.vulnlab.controllers

import org.springframework.jdbc.core.JdbcTemplate
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/sqli")
class SqliController(private val jdbcTemplate: JdbcTemplate) {
	@GetMapping("/search")
	fun search(@RequestParam q: String): List<Map<String, Any?>> {
		// Vulnerável: concatenação direta em SQL
		val sql = "SELECT id, username, about FROM users WHERE username LIKE '%$q%'"
		return jdbcTemplate.queryForList(sql)
	}
}
