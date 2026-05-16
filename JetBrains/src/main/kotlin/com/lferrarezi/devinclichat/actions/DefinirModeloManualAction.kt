package com.lferrarezi.devinclichat.actions

import com.intellij.openapi.actionSystem.AnAction
import com.intellij.openapi.actionSystem.AnActionEvent
import com.intellij.openapi.ui.Messages
import com.lferrarezi.devinclichat.model.ModelManager
import com.lferrarezi.devinclichat.settings.DevinSettings
import com.lferrarezi.devinclichat.ui.ChatPanel

class DefinirModeloManualAction : AnAction() {
    override fun actionPerformed(e: AnActionEvent) {
        val project = e.project ?: return
        val current = DevinSettings.getInstance().state.modeloAtual
        val value = Messages.showInputDialog(project,
            "Informe o nome exato do modelo aceito pelo Devin CLI:",
            "Modelo Manual", null, current, null) ?: return
        if (value.isNotBlank()) {
            DevinSettings.getInstance().state.modeloAtual = ModelManager.sanitizeModel(value)
            ChatPanel.getInstance(project)?.refreshMeta()
        }
    }
}
