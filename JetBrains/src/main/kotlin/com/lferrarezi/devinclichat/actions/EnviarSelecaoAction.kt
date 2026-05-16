package com.lferrarezi.devinclichat.actions

import com.intellij.openapi.actionSystem.AnAction
import com.intellij.openapi.actionSystem.AnActionEvent
import com.intellij.openapi.fileEditor.FileEditorManager
import com.intellij.openapi.wm.ToolWindowManager
import com.lferrarezi.devinclichat.ui.ChatPanel

class EnviarSelecaoAction : AnAction() {
    override fun actionPerformed(e: AnActionEvent) {
        val project = e.project ?: return
        val editor = FileEditorManager.getInstance(project).selectedTextEditor ?: return
        val text = editor.selectionModel.selectedText?.takeIf { it.isNotBlank() }
            ?: editor.document.text.take(60_000)
        ToolWindowManager.getInstance(project).getToolWindow("DevinCliChat")?.activate {
            ChatPanel.getInstance(project)?.sendText("Analise o contexto do editor atual.\n\n```\n$text\n```")
        }
    }
    override fun update(e: AnActionEvent) {
        e.presentation.isEnabled = e.project != null
    }
}
