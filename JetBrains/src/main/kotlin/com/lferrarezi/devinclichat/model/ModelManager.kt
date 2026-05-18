package com.lferrarezi.devinclichat.model

import com.lferrarezi.devinclichat.DevinPlugin
import com.lferrarezi.devinclichat.settings.DevinSettings
import java.io.File
import java.nio.file.Paths

object ModelManager {

    @Volatile private var modelsAt: Long = 0
    @Volatile private var modelsValues: List<String>? = null

    fun isSafeModelId(value: String): Boolean =
        Regex("^[a-zA-Z0-9][a-zA-Z0-9._-]{1,80}$").matches(value.trim())

    fun sanitizeModel(value: String?): String {
        val s = (value ?: "").trim().lowercase()
        if (s.isEmpty() || s == "default" || s == "padrao" || s == "padrão") return "auto"
        if (s == "auto") return "auto"
        if (s in DevinPlugin.VALID_MODELS) return s
        return if (isSafeModelId(s)) s else "auto"
    }

    fun modelsForUi(): List<String> {
        val state = DevinSettings.getInstance().state
        val ttl = state.cacheModelosMs
        val now = System.currentTimeMillis()
        val cached = modelsValues
        if (ttl > 0 && cached != null && now - modelsAt < ttl) return cached

        val fromConfig = readCurrentModelFromDevinConfig()
        val result = mutableListOf<String>()
        result.add("auto")
        if (fromConfig != null && fromConfig !in result) result.add(fromConfig)
        result.addAll(state.modelosDisponiveis.filter { it.isNotBlank() && it !in result })
        result.addAll(readModelsFromCaches().filter { it !in result })
        val current = sanitizeModel(state.modeloAtual)
        if (current != "auto" && current !in result) result.add(0, current)
        val distinct = result.distinct()

        modelsValues = distinct
        modelsAt = now
        return distinct
    }

    fun invalidateCache() {
        modelsAt = 0
        modelsValues = null
    }

    fun invalidateAllCaches() {
        invalidateCache()
        AgentScanner.invalidateCache()
        SkillScanner.invalidateCache()
    }

    fun readCurrentModelFromDevinConfig(): String? {
        return try {
            val configFile = devinConfigPath()
            if (!configFile.exists()) return null
            val json = configFile.readText()
            val match = Regex(""""model"\s*:\s*"([^"]+)"""").find(json)
            match?.groupValues?.get(1)?.let { sanitizeModel(it).takeIf { m -> m != "auto" } }
        } catch (_: Exception) { null }
    }

    private fun readModelsFromCaches(): List<String> {
        val out = mutableListOf<String>()
        for (file in cacheModelFiles()) {
            try {
                if (!file.exists() || !file.isFile) continue
                val text = file.readBytes().toString(Charsets.UTF_8)
                val matches = Regex("[a-zA-Z0-9][a-zA-Z0-9._-]{1,79}").findAll(text)
                matches.forEach { if (looksLikeModel(it.value)) out.add(it.value) }
            } catch (_: Exception) {}
        }
        return out.distinct()
    }

    private fun looksLikeModel(s: String): Boolean {
        if (s.length < 2 || s.length > 80) return false
        if (!Regex("^[a-zA-Z0-9][a-zA-Z0-9._-]*$").matches(s)) return false
        if (Regex("^(true|false|null|undefined|model|models|name|display|enabled|disabled|token|config|settings)$", RegexOption.IGNORE_CASE).matches(s)) return false
        if (s == "auto") return true
        if (Regex("claude|sonnet|opus|haiku|gpt|codex|gemini|swe|kimi|glm|adaptive|thinking|flash|pro|mini|low|medium|high|fast", RegexOption.IGNORE_CASE).containsMatchIn(s)) return true
        return s.any { it.isDigit() } && s.contains('-')
    }

    private fun devinConfigPath(): File {
        return if (System.getProperty("os.name").startsWith("Win", ignoreCase = true)) {
            val appData = System.getenv("APPDATA") ?: Paths.get(System.getProperty("user.home"), "AppData", "Roaming").toString()
            File(appData, "devin/config.json")
        } else {
            File(System.getProperty("user.home"), ".config/devin/config.json")
        }
    }

    private fun cacheModelFiles(): List<File> {
        val files = mutableListOf<File>()
        val isWin = System.getProperty("os.name").startsWith("Win", ignoreCase = true)
        if (isWin) {
            val local = System.getenv("LOCALAPPDATA") ?: Paths.get(System.getProperty("user.home"), "AppData", "Local").toString()
            files.add(File(local, "Devin/CLI/team_settings.bin"))
            files.add(File(local, "Devin/CLI/model_configs.bin"))
        } else {
            val home = System.getProperty("user.home")
            files.add(File(home, ".local/share/Devin/CLI/team_settings.bin"))
            files.add(File(home, ".local/share/Devin/CLI/model_configs.bin"))
        }
        files.addAll(DevinSettings.getInstance().state.modelosDisponiveis
            .filter { it.endsWith(".bin") }
            .map { File(it) })
        return files
    }
}
