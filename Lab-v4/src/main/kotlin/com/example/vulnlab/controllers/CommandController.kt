package com.example.vulnlab.controllers

import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/cmd")
class CommandController {
	@GetMapping("/ping")
	fun ping(@RequestParam host: String): String {
		// Vulnerável: concatenando entrada do usuário em comando do sistema
		val process = Runtime.getRuntime().exec(arrayOf("/bin/sh", "-c", "ping -c 1 $host"))
		val output = process.inputStream.bufferedReader().readText()
		val err = process.errorStream.bufferedReader().readText()
		process.waitFor()
		return output + err
	}
}
