package com.lferrarezi.devinclichat.model

import com.lferrarezi.devinclichat.settings.DevinSettings
import java.io.File

data class MarkdownEntry(
    val id: String,
    val label: String,
    val description: String,
    val filePath: String,
    val source: String,
    val kind: String
)

object AgentScanner {

    fun scanEntries(projectBasePath: String?): List<MarkdownEntry> {
        val dirs = agentDirs(projectBasePath)
        return collectMarkdownEntries(dirs, "agent")
    }

    fun scanIds(projectBasePath: String?): List<String> =
        listOf("auto") + scanEntries(projectBasePath).map { it.id }

    private fun agentDirs(projectBasePath: String?): List<File> {
        val s = DevinSettings.getInstance().state
        val home = System.getProperty("user.home")
        val isWin = System.getProperty("os.name").startsWith("Win", ignoreCase = true)
        val dirs = mutableListOf<File>()
        if (projectBasePath != null) {
            dirs.add(File(projectBasePath, s.diretorioAgentesWorkspace))
            dirs.add(File(projectBasePath, ".agents/agents"))
            dirs.add(File(projectBasePath, ".claude/agents"))
        }
        val globalPath = s.diretorioAgentesGlobal.replace("~", home)
        dirs.add(File(globalPath))
        if (isWin) {
            val appData = System.getenv("APPDATA") ?: File(home, "AppData/Roaming").path
            dirs.add(File(appData, "devin/agents"))
        }
        return dirs.distinct()
    }

    fun collectMarkdownEntries(dirs: List<File>, kind: String): List<MarkdownEntry> {
        val out = mutableListOf<MarkdownEntry>()
        val seen = mutableSetOf<String>()
        val seenIds = mutableSetOf<String>()

        fun add(file: File, fallbackId: String?, source: String) {
            if (!file.exists() || !file.isFile) return
            if (!file.name.endsWith(".md", ignoreCase = true)) return
            val path = file.canonicalPath
            if (!seen.add(path)) return
            val content = try { file.readText(Charsets.UTF_8) } catch (_: Exception) { return }
            val base = file.nameWithoutExtension
            val parent = file.parentFile?.name ?: ""
            var id = fallbackId ?: if (base.uppercase() == "AGENT" || base.uppercase() == "SKILL") parent else base
            val fmName = frontMatterValue(content, "name")
            if (fmName.isNotBlank()) id = fmName
            id = id.trim().replace(Regex("\\s+"), "-")
            if (id.isBlank()) return
            val idKey = "$kind:$id"
            if (!seenIds.add(idKey)) return
            val description = frontMatterValue(content, "description")
            out.add(MarkdownEntry(id = id, label = id, description = description, filePath = file.path, source = source, kind = kind))
        }

        fun walk(dir: File, depth: Int, source: String) {
            if (out.size >= 120 || depth < 0 || !dir.isDirectory) return
            val names = try { dir.listFiles()?.toList() ?: emptyList() } catch (_: Exception) { emptyList() }
            for (f in names) {
                if (out.size >= 120) break
                val name = f.name
                if (name.startsWith('.') && name != ".devin" && name != ".claude") continue
                if (f.isDirectory) {
                    val agentFile = File(f, "AGENT.md")
                    val skillFile = File(f, "SKILL.md")
                    when {
                        kind == "agent" && agentFile.exists() -> add(agentFile, name, source)
                        kind == "skill" && skillFile.exists() -> add(skillFile, name, source)
                        else -> walk(f, depth - 1, source)
                    }
                } else if (f.isFile && f.name.endsWith(".md", ignoreCase = true)) {
                    if (kind == "agent" && f.name.uppercase() == "SKILL.MD") continue
                    if (kind == "skill" && f.name.uppercase() == "AGENT.MD") continue
                    add(f, null, source)
                }
            }
        }

        for (dir in dirs) {
            if (!dir.exists()) continue
            walk(dir, 2, dir.path)
        }
        return out.sortedBy { it.id }
    }

    private fun frontMatterValue(markdown: String, key: String): String {
        val match = Regex("^---\\s*\\n([\\s\\S]*?)\\n---").find(markdown) ?: return ""
        val block = match.groupValues[1]
        val re = Regex("^${Regex.escape(key)}\\s*:\\s*[\"']?([^\"'\\n]+)", RegexOption.MULTILINE)
        return re.find(block)?.groupValues?.get(1)?.trim() ?: ""
    }
}
