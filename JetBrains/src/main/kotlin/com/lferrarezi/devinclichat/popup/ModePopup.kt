package com.lferrarezi.devinclichat.popup

import com.intellij.openapi.project.Project
import com.intellij.openapi.ui.Messages
import com.lferrarezi.devinclichat.settings.DevinSettings
import java.awt.Component

object ModePopup {
    fun show(anchor: Component, project: Project, onDone: () -> Unit) {
        val modes = arrayOf("resposta-integrada", "terminal")
        val current = DevinSettings.getInstance().state.modoExecucaoChat
        val result = Messages.showChooseDialog(
            project,
            "Selecione o modo de execução:",
            "Modo de Execução",
            null,
            modes,
            current
        )
        if (result >= 0) {
            DevinSettings.getInstance().state.modoExecucaoChat = modes[result]
            onDone()
        }
    }
}
