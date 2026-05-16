package com.lferrarezi.devinclichat.model

import com.lferrarezi.devinclichat.DevinPlugin
import com.lferrarezi.devinclichat.settings.DevinSettings
import java.io.File
import java.nio.file.Paths

object ModelManager {

    fun sanitizeModel(value: String?): String {
        val s = (value ?: "").trim().lowercase()
        return if (s.isEmpty() || s == "default" || s == "padrao" || s == "padrão" || s !in DevinPlugin.VALID_MODELS) "auto" else s
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

    fun modelsForUi(): List<String> {
        val s = DevinSettings.getInstance().state
        val fromConfig = readCurrentModelFromDevinConfig()
        val result = mutableListOf<String>()
        result.add("auto")
        if (fromConfig != null && fromConfig !in result) result.add(fromConfig)
        result.addAll(s.modelosDisponiveis.filter { it.isNotBlank() && it !in result })
        result.addAll(readModelsFromCaches().filter { it !in result })
        val current = sanitizeModel(s.modeloAtual)
        if (current != "auto" && current !in result) result.add(0, current)
        return result.distinct()
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
