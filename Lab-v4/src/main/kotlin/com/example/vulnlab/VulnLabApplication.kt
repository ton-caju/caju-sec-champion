package com.example.vulnlab

import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.boot.runApplication

@SpringBootApplication
open class VulnLabApplication

fun main(args: Array<String>) {
	runApplication<VulnLabApplication>(*args)
}
