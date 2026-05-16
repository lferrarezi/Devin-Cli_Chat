package com.lferrarezi.devinclichat.cli

import com.intellij.execution.configurations.GeneralCommandLine
import com.intellij.execution.process.CapturingProcessHandler
import com.intellij.openapi.project.Project
import com.intellij.openapi.ui.Messages
import com.lferrarezi.devinclichat.settings.DevinSettings

object CliChecker {

    fun check(project: Project) {
        val devinPath = DevinSettings.getInstance().state.caminhoDevin
        try {
            val cmdLine = GeneralCommandLine(devinPath, "--version")
                .withWorkDirectory(project.basePath ?: System.getProperty("user.home"))
            val handler = CapturingProcessHandler(cmdLine)
            val output = handler.runProcess(5_000)
            val msg = (output.stdout + output.stderr).trim().ifBlank { "ok" }
            Messages.showInfoMessage(project, "Devin CLI encontrado: $msg", "Devin CLI")
        } catch (e: Exception) {
            Messages.showErrorDialog(project,
                "Falha ao verificar Devin CLI: ${e.message}\n\nValide o caminho em Configurações > Tools > Devin Cli Chat.",
                "Devin CLI")
        }
    }
}
