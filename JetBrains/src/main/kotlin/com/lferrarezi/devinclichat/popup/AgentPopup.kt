package com.lferrarezi.devinclichat.popup

import com.intellij.openapi.project.Project
import com.intellij.openapi.ui.Messages
import com.lferrarezi.devinclichat.model.AgentScanner
import com.lferrarezi.devinclichat.settings.DevinSettings
import java.awt.Component

object AgentPopup {
    fun show(anchor: Component, project: Project, onDone: () -> Unit) {
        val agents = AgentScanner.scanIds(project.basePath)
        val result = Messages.showEditableChooseDialog(
            "Selecione o agente Devin:",
            "Agente Devin",
            null,
            agents.toTypedArray(),
            DevinSettings.getInstance().state.agenteAtual,
            null
        ) ?: return
        DevinSettings.getInstance().state.agenteAtual = result
        onDone()
    }
}
