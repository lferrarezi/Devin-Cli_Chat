package com.lferrarezi.devinclichat.model

import com.lferrarezi.devinclichat.settings.DevinSettings
import java.io.File

object SkillScanner {

    fun scanEntries(projectBasePath: String?): List<MarkdownEntry> {
        val dirs = skillDirs(projectBasePath)
        return AgentScanner.collectMarkdownEntries(dirs, "skill")
    }

    fun scanIds(projectBasePath: String?): List<String> =
        scanEntries(projectBasePath).map { it.id }

    private fun skillDirs(projectBasePath: String?): List<File> {
        val s = DevinSettings.getInstance().state
        val home = System.getProperty("user.home")
        val isWin = System.getProperty("os.name").startsWith("Win", ignoreCase = true)
        val dirs = mutableListOf<File>()
        if (projectBasePath != null) {
            dirs.add(File(projectBasePath, s.diretorioSkillsWorkspace))
            dirs.add(File(projectBasePath, ".skills"))
            dirs.add(File(projectBasePath, ".agents/skills"))
            dirs.add(File(projectBasePath, ".claude/skills"))
        }
        val globalPath = s.diretorioSkillsGlobal.replace("~", home)
        dirs.add(File(globalPath))
        if (isWin) {
            val appData = System.getenv("APPDATA") ?: File(home, "AppData/Roaming").path
            dirs.add(File(appData, "devin/skills"))
        }
        return dirs.distinct()
    }
}
