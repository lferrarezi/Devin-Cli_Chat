package com.lferrarezi.devinclichat.prompt

import com.lferrarezi.devinclichat.model.AgentScanner
import com.lferrarezi.devinclichat.model.ModelManager
import com.lferrarezi.devinclichat.model.SkillScanner
import com.lferrarezi.devinclichat.settings.DevinSettings
import java.io.File

data class FullPromptResult(val displayText: String, val fullText: String)

object PromptBuilder {

    fun build(
        userText: String,
        attachments: List<AttachmentItem>,
        projectBasePath: String?,
        projectName: String
    ): FullPromptResult {
        val s = DevinSettings.getInstance().state
        val model = ModelManager.sanitizeModel(s.modeloAtual)
        val agent = s.agenteAtual
        val skills = s.skillsSelecionadas.toList()

        val prefix = s.prefixoPromptPadrao
        val contextBlock = buildString {
            appendLine("Workspace: $projectName")
            appendLine("Diretório raiz: ${projectBasePath ?: "sem pasta aberta"}")
            appendLine("Modelo selecionado: $model")
            appendLine("Agente selecionado: $agent")
            if (skills.isNotEmpty()) appendLine("Skills selecionadas: ${skills.joinToString(", ")}")
        }.trim()

        val agentEntries = AgentScanner.scanEntries(projectBasePath)
        val skillEntries = SkillScanner.scanEntries(projectBasePath)

        val mentionedAgentIds = selectedEntryIds(userText, agentEntries.map { it.id }, "@")
        val mentionedSkillIds = selectedEntryIds(userText, skillEntries.map { it.id }, "#")
        val allAgentIds = (if (agent != "auto") listOf(agent) else emptyList()) + mentionedAgentIds
        val allSkillIds = skills + mentionedSkillIds

        val agentHint = if (agentEntries.isNotEmpty() && allAgentIds.isNotEmpty()) {
            "Aplique as instruções dos AGENT.md carregados abaixo. Quando o prompt mencionar @nome, trate como chamada explícita daquele agente."
        } else if (agent != "auto") {
            """Use o perfil/subagente Devin chamado "$agent" quando aplicável."""
        } else ""

        val skillHint = if (allSkillIds.isNotEmpty())
            "Aplique as skills Markdown carregadas abaixo como playbooks operacionais para esta resposta."
        else ""

        val agentBlocks = if (s.incluirConteudoAgenteSkillNoPrompt) {
            buildMdBlocks("Agentes carregados", agentEntries.filter { it.id in allAgentIds }, s.limiteBytesArquivoMd)
        } else ""

        val skillBlocks = if (s.incluirConteudoAgenteSkillNoPrompt) {
            buildMdBlocks("Skills carregadas", skillEntries.filter { it.id in allSkillIds }, s.limiteBytesArquivoMd)
        } else ""

        val attachRefs = attachments.map { attachRef(it) }.filter { it.isNotBlank() }
        val displayText = buildString {
            append(userText)
            if (attachRefs.isNotEmpty()) append("\n\n${attachRefs.joinToString(", ")}")
        }

        val fullText = listOf(prefix, contextBlock, agentHint, skillHint, agentBlocks, skillBlocks, userText)
            .filter { it.isNotBlank() }
            .joinToString("\n\n") + attachmentsFullBlock(attachments)

        return FullPromptResult(displayText = displayText, fullText = fullText)
    }

    fun baseArgs(devinPath: String): List<String> {
        val s = DevinSettings.getInstance().state
        val out = mutableListOf<String>()
        out.addAll(s.argumentosPadrao.filter { it.isNotBlank() })
        val flag = s.argumentoModelo.trim()
        val model = ModelManager.sanitizeModel(s.modeloAtual)
        if (flag.isNotBlank() && model != "auto") {
            out.add(flag)
            out.add(model)
        }
        return out
    }

    private fun selectedEntryIds(text: String, ids: List<String>, prefix: String): List<String> {
        val result = mutableListOf<String>()
        for (id in ids) {
            val escaped = Regex.escape(id)
            val pattern = if (prefix == "@")
                Regex("(^|[^\\w.\\-])@$escaped(?=$|[^\\w.\\-])", RegexOption.IGNORE_CASE)
            else
                Regex("(^|[^\\w.\\-])#$escaped(?=$|[^\\w.\\-])", RegexOption.IGNORE_CASE)
            if (pattern.containsMatchIn(text)) result.add(id)
        }
        return result
    }

    private fun buildMdBlocks(title: String, entries: List<com.lferrarezi.devinclichat.model.MarkdownEntry>, maxBytes: Long): String {
        if (entries.isEmpty()) return ""
        val blocks = entries.mapNotNull { entry ->
            try {
                val file = File(entry.filePath)
                if (!file.exists()) return@mapNotNull null
                val bytes = file.readBytes()
                val truncated = bytes.size > maxBytes
                val content = bytes.take(maxBytes.toInt()).toByteArray().toString(Charsets.UTF_8)
                buildString {
                    appendLine("### ${if (entry.kind == "agent") "Agente" else "Skill"}: ${entry.id}")
                    appendLine("Arquivo: ${entry.filePath}")
                    if (truncated) appendLine("Observação: conteúdo truncado.")
                    appendLine("```md")
                    append(content)
                    appendLine()
                    append("```")
                }
            } catch (_: Exception) { null }
        }
        if (blocks.isEmpty()) return ""
        return "## $title\n\n${blocks.joinToString("\n\n")}"
    }

    private fun attachRef(item: AttachmentItem): String = when (item) {
        is AttachmentItem.FileItem -> "📎 ${item.relativePath.ifBlank { item.label }}"
        is AttachmentItem.FolderItem -> "📎 ${item.label}"
        is AttachmentItem.SelectionItem -> "📎 ${item.label}"
    }

    private fun attachmentsFullBlock(attachments: List<AttachmentItem>): String {
        if (attachments.isEmpty()) return ""
        return "\n\n" + attachments.joinToString("\n\n") { item ->
            when (item) {
                is AttachmentItem.FileItem -> {
                    if (item.binary) "Arquivo anexado: ${item.relativePath}\nCaminho: ${item.filePath}\n(arquivo binário — use o caminho)"
                    else {
                        val truncNote = if (item.truncated) "\n[NOTA: arquivo truncado — exibindo apenas os primeiros bytes por limite de tamanho.]" else ""
                        "Arquivo anexado: ${item.relativePath}\n```${item.language}\n${item.content}\n```$truncNote"
                    }
                }
                is AttachmentItem.FolderItem -> {
                    val filesBlock = item.files.joinToString("\n\n") { f ->
                        if (f.binary) "Arquivo: ${f.relativePath}\n(binário — use o caminho)"
                        else "Arquivo: ${f.relativePath}\n```${f.language}\n${f.content}\n```"
                    }
                    val truncNote = if (item.truncated)
                        "\n\n[NOTA: pasta truncada — exibindo ${item.files.size} arquivo(s); demais ignorados por limite ou por serem muito grandes.]"
                    else ""
                    filesBlock + truncNote
                }
                is AttachmentItem.SelectionItem ->
                    "Contexto do editor: ${item.label}\n```${item.language}\n${item.content}\n```"
            }
        }
    }
}
