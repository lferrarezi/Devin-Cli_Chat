package com.lferrarezi.devinclichat.popup

import com.intellij.openapi.project.Project
import com.intellij.openapi.ui.Messages
import com.lferrarezi.devinclichat.model.ModelManager
import com.lferrarezi.devinclichat.settings.DevinSettings
import java.awt.Component
import javax.swing.JList
import javax.swing.ListSelectionModel

object ModelPopup {
    fun show(anchor: Component, project: Project, onDone: () -> Unit) {
        val models = ModelManager.modelsForUi() + listOf("+ Informar modelo manual")
        val result = Messages.showEditableChooseDialog(
            "Selecione o modelo Devin CLI:",
            "Modelo Devin",
            null,
            models.toTypedArray(),
            DevinSettings.getInstance().state.modeloAtual,
            null
        ) ?: return
        if (result.startsWith("+")) {
            val manual = Messages.showInputDialog(
                project,
                "Informe o nome exato do modelo aceito pelo Devin CLI:",
                "Modelo Manual",
                null,
                DevinSettings.getInstance().state.modeloAtual,
                null
            ) ?: return
            if (manual.isNotBlank()) {
                DevinSettings.getInstance().state.modeloAtual = ModelManager.sanitizeModel(manual)
            }
        } else {
            DevinSettings.getInstance().state.modeloAtual = ModelManager.sanitizeModel(result)
        }
        onDone()
    }
}
