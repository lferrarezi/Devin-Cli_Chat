package com.lferrarezi.devinclichat.cli

import com.intellij.execution.configurations.GeneralCommandLine
import com.intellij.execution.process.CapturingProcessHandler
import com.intellij.openapi.project.Project

object GitDiffRunner {

    fun diff(project: Project): String {
        return try {
            val cmdLine = GeneralCommandLine("git", "diff", "--no-ext-diff")
                .withWorkDirectory(project.basePath ?: System.getProperty("user.home"))
            val handler = CapturingProcessHandler(cmdLine)
            val output = handler.runProcess(15_000)
            output.stdout.ifBlank { output.stderr.ifBlank { "Nenhuma alteração pendente." } }
        } catch (e: Exception) {
            "Não foi possível obter git diff: ${e.message}"
        }
    }
}
