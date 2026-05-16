package com.lferrarezi.devinclichat.actions

import com.intellij.openapi.actionSystem.AnAction
import com.intellij.openapi.actionSystem.AnActionEvent
import com.lferrarezi.devinclichat.popup.ModelPopup
import com.lferrarezi.devinclichat.ui.ChatPanel

class SelecionarModeloAction : AnAction() {
    override fun actionPerformed(e: AnActionEvent) {
        val project = e.project ?: return
        val panel = ChatPanel.getInstance(project) ?: return
        ModelPopup.show(panel, project) { panel.refreshMeta() }
    }
}
