package com.example.vulnlab.controllers

import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController
import org.springframework.web.client.RestTemplate

@RestController
@RequestMapping("/ssrf")
class SsrfController(private val restTemplate: RestTemplate) {
	@GetMapping("/fetch")
	fun fetch(@RequestParam url: String): ResponseEntity<String> {
		// Vulnerável: SSRF sem validação do destino
		val resp = restTemplate.getForEntity(url, String::class.java)
		return ResponseEntity.status(resp.statusCode).body(resp.body)
	}
}
