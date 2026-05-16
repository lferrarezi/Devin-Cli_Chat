package com.lferrarezi.devinclichat.actions

import com.intellij.openapi.actionSystem.AnAction
import com.intellij.openapi.actionSystem.AnActionEvent
import com.lferrarezi.devinclichat.popup.SkillsPopup
import com.lferrarezi.devinclichat.ui.ChatPanel

class SelecionarSkillsAction : AnAction() {
    override fun actionPerformed(e: AnActionEvent) {
        val project = e.project ?: return
        val panel = ChatPanel.getInstance(project)
        SkillsPopup.show(project, panel ?: return) { panel.refreshMeta() }
    }
}
