package com.lferrarezi.devinclichat.popup

import com.intellij.openapi.project.Project
import com.intellij.openapi.ui.DialogWrapper
import com.intellij.ui.components.JBList
import com.intellij.ui.components.JBScrollPane
import com.intellij.util.ui.JBUI
import com.lferrarezi.devinclichat.model.SkillScanner
import com.lferrarezi.devinclichat.settings.DevinSettings
import javax.swing.JComponent
import javax.swing.JLabel
import javax.swing.JPanel
import javax.swing.ListSelectionModel
import java.awt.BorderLayout

object SkillsPopup {
    fun show(project: Project, anchor: JComponent, onDone: () -> Unit) {
        val entries = SkillScanner.scanEntries(project.basePath)
        if (entries.isEmpty()) {
            com.intellij.openapi.ui.Messages.showInfoMessage(
                project,
                "Nenhuma skill Markdown encontrada.\nUse .devin/skills, .skills ou configure em Configurações > Devin Cli Chat.",
                "Skills"
            )
            return
        }
        val dialog = SkillsDialog(project, entries.map { it.id }, DevinSettings.getInstance().state.skillsSelecionadas.toSet())
        if (dialog.showAndGet()) {
            val selected = dialog.getSelectedSkills()
            DevinSettings.getInstance().state.skillsSelecionadas = selected.toMutableList()
            onDone()
        }
    }
}

class SkillsDialog(project: Project, private val allSkills: List<String>, private val selectedSkills: Set<String>) : DialogWrapper(project) {

    private val list = JBList(allSkills)

    init {
        list.selectionMode = ListSelectionModel.MULTIPLE_INTERVAL_SELECTION
        val selectedIndices = allSkills.indices.filter { allSkills[it] in selectedSkills }.toIntArray()
        list.selectedIndices = selectedIndices
        init()
        title = "Selecionar Skills Markdown"
    }

    override fun createCenterPanel(): JComponent {
        val panel = JPanel(BorderLayout())
        panel.border = JBUI.Borders.empty(8)
        panel.add(JLabel("Selecione as skills a aplicar no prompt (Ctrl+clique para múltiplas):"), BorderLayout.NORTH)
        panel.add(JBScrollPane(list), BorderLayout.CENTER)
        panel.preferredSize = java.awt.Dimension(380, 300)
        return panel
    }

    fun getSelectedSkills(): List<String> = list.selectedValuesList
}
