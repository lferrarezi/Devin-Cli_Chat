package com.lferrarezi.devinclichat.actions

import com.intellij.openapi.actionSystem.AnAction
import com.intellij.openapi.actionSystem.AnActionEvent
import com.intellij.openapi.wm.ToolWindowManager
import com.lferrarezi.devinclichat.popup.AttachPopup
import com.lferrarezi.devinclichat.ui.ChatPanel

class AnexarArquivosAction : AnAction() {
    override fun actionPerformed(e: AnActionEvent) {
        val project = e.project ?: return
        ToolWindowManager.getInstance(project).getToolWindow("DevinCliChat")?.activate {
            val panel = ChatPanel.getInstance(project) ?: return@activate
            AttachPopup.show(project, panel.composerPanel) { item -> panel.attachItem(item) }
        }
    }
}
