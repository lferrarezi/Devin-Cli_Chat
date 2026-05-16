package com.lferrarezi.devinclichat.cli

import com.intellij.execution.configurations.GeneralCommandLine
import com.intellij.execution.process.CapturingProcessHandler
import com.intellij.openapi.application.ApplicationManager
import com.intellij.openapi.project.Project
import com.intellij.openapi.wm.ToolWindowManager
import com.lferrarezi.devinclichat.prompt.AttachmentItem
import com.lferrarezi.devinclichat.prompt.PromptBuilder
import com.lferrarezi.devinclichat.settings.DevinSettings
import java.io.File

object DevinRunner {

    private val STDERR_NOISE = listOf(
        Regex("were not migrated because they already exist", RegexOption.IGNORE_CASE),
        Regex("migration.*already exist", RegexOption.IGNORE_CASE),
        Regex("^\\s*$")
    )

    fun runIntegrated(
        project: Project,
        userText: String,
        attachments: List<AttachmentItem>,
        onResult: (String) -> Unit
    ) {
        val s = DevinSettings.getInstance().state
        val result = PromptBuilder.build(
            userText = userText,
            attachments = attachments,
            projectBasePath = project.basePath,
            projectName = project.name
        )
        val baseArgs = PromptBuilder.baseArgs(s.caminhoDevin)
        val args = baseArgs + listOf("-p", "--", result.fullText)

        ApplicationManager.getApplication().executeOnPooledThread {
            val response = try {
                val cmdLine = GeneralCommandLine(s.caminhoDevin)
                    .withParameters(args)
                    .withWorkDirectory(project.basePath ?: System.getProperty("user.home"))
                val handler = CapturingProcessHandler(cmdLine)
                val output = handler.runProcess(s.timeoutChatMs.toInt())
                friendlyOutput(output.stdout, cleanStderr(output.stderr),
                    if (output.isTimeout) "Timeout após ${s.timeoutChatMs}ms." else null)
            } catch (e: Exception) {
                if (isWindows()) runViaBash(project, result.fullText, baseArgs) ?: errorMsg(e)
                else errorMsg(e)
            }
            ApplicationManager.getApplication().invokeLater { onResult(response) }
        }
    }

    fun openTerminal(project: Project, userText: String, attachments: List<AttachmentItem>) {
        val s = DevinSettings.getInstance().state
        val result = PromptBuilder.build(
            userText = userText,
            attachments = attachments,
            projectBasePath = project.basePath,
            projectName = project.name
        )
        val baseArgs = PromptBuilder.baseArgs(s.caminhoDevin)
        val fullCmd = buildString {
            append(shellQuote(s.caminhoDevin))
            if (baseArgs.isNotEmpty()) append(" ${baseArgs.joinToString(" ") { shellQuote(it) }}")
            if (result.fullText.isNotBlank()) append(" -p -- ${shellQuote(result.fullText)}")
        }
        openSystemTerminal(project, fullCmd)
    }

    private fun runViaBash(project: Project, fullText: String, baseArgs: List<String>): String? {
        val bash = findGitBash() ?: return null
        val s = DevinSettings.getInstance().state
        val cmd = buildString {
            append(shellQuote(s.caminhoDevin))
            if (baseArgs.isNotEmpty()) append(" ${baseArgs.joinToString(" ") { shellQuote(it) }}")
            append(" -p -- ${shellQuote(fullText)}")
        }
        return try {
            val cmdLine = GeneralCommandLine(bash, "-c", cmd)
                .withWorkDirectory(project.basePath ?: System.getProperty("user.home"))
            val handler = CapturingProcessHandler(cmdLine)
            val output = handler.runProcess(s.timeoutChatMs.toInt())
            friendlyOutput(output.stdout, cleanStderr(output.stderr), null)
        } catch (e: Exception) {
            "Falha via Git Bash: ${e.message}"
        }
    }

    private fun openSystemTerminal(project: Project, command: String) {
        try {
            ToolWindowManager.getInstance(project).getToolWindow("Terminal")?.show(null)
        } catch (_: Exception) {}

        ApplicationManager.getApplication().executeOnPooledThread {
            try {
                val shell = if (isWindows()) findGitBash() ?: "cmd" else (System.getenv("SHELL") ?: "/bin/sh")
                val args = if (isWindows() && shell.endsWith("bash.exe", ignoreCase = true))
                    listOf(shell, "--login", "-i", "-c", command)
                else
                    listOf(shell, "-c", command)
                ProcessBuilder(args)
                    .directory(File(project.basePath ?: System.getProperty("user.home")))
                    .inheritIO()
                    .start()
            } catch (_: Exception) {}
        }
    }

    fun cleanStderr(stderr: String): String =
        stderr.lines()
            .filter { line -> STDERR_NOISE.none { it.containsMatchIn(line) } }
            .joinToString("\n")
            .trim()

    private fun friendlyOutput(stdout: String, stderr: String, error: String?): String {
        val combined = "$stdout\n$stderr\n${error ?: ""}"
        if (combined.contains("No active model set in cog manager", ignoreCase = true)) {
            return buildString {
                appendLine("Modelo Devin não configurado para esta execução.")
                appendLine()
                appendLine("Ações recomendadas:")
                appendLine("1. Execute no terminal: devin model set <modelo>")
                appendLine("2. Abra Configurações > Tools > Devin Cli Chat e defina o modelo.")
                appendLine("3. Modelos aceitos: auto, sonnet, opus, swe, gpt.")
            }
        }
        val parts = buildList {
            if (stdout.isNotBlank()) add(stdout.trim())
            if (stderr.isNotBlank()) add("STDERR:\n$stderr")
            if (error != null) add(error)
        }
        return parts.joinToString("\n\n").ifBlank { "Sem saída do Devin CLI." }
    }

    private fun errorMsg(e: Exception): String =
        "Falha ao iniciar Devin CLI: ${e.message}\n\nValide o caminho em Configurações > Tools > Devin Cli Chat."

    fun findGitBash(): String? {
        val s = DevinSettings.getInstance().state
        val candidates = listOf(
            s.gitBashPath,
            System.getenv("GIT_BASH_PATH"),
            "C:\\Program Files\\Git\\bin\\bash.exe",
            "C:\\Program Files\\Git\\usr\\bin\\bash.exe",
            "C:\\Program Files (x86)\\Git\\bin\\bash.exe"
        ).filter { it?.isNotBlank() == true }
        return candidates.map { File(it!!) }.firstOrNull { it.exists() }?.path
    }

    fun isWindows(): Boolean = System.getProperty("os.name").startsWith("Win", ignoreCase = true)

    private fun shellQuote(s: String): String = "'${s.replace("'", "'\\''")}'"
}
