package com.example.vulnlab.controllers

import org.springframework.http.MediaType
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController
import java.nio.file.Files
import java.nio.file.Paths

@RestController
@RequestMapping("/files")
class FilesController {
	// Vulnerável: path traversal via nome de arquivo
	@GetMapping("/view", produces = [MediaType.TEXT_PLAIN_VALUE])
	fun view(@RequestParam name: String): String {
		val path = Paths.get("./uploads/", name)
		return if (Files.exists(path)) {
			Files.readString(path)
		} else {
			"Arquivo não encontrado: $name"
		}
	}
}
