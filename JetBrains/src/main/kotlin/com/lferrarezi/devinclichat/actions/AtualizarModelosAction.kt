package com.lferrarezi.devinclichat.actions

import com.intellij.openapi.actionSystem.AnAction
import com.intellij.openapi.actionSystem.AnActionEvent
import com.intellij.openapi.ui.Messages
import com.lferrarezi.devinclichat.model.ModelManager
import com.lferrarezi.devinclichat.ui.ChatPanel

class AtualizarModelosAction : AnAction() {
    override fun actionPerformed(e: AnActionEvent) {
        val project = e.project ?: return
        ModelManager.invalidateAllCaches()
        val models = ModelManager.modelsForUi()
        Messages.showInfoMessage(project, "Modelos disponíveis: ${models.joinToString(", ")}", "Modelos Devin CLI")
        ChatPanel.getInstance(project)?.refreshMeta()
    }
}
