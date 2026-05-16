package com.lferrarezi.devinclichat.actions

import com.intellij.openapi.actionSystem.AnAction
import com.intellij.openapi.actionSystem.AnActionEvent
import com.lferrarezi.devinclichat.ui.ChatPanel

class LimparAnexosAction : AnAction() {
    override fun actionPerformed(e: AnActionEvent) {
        val project = e.project ?: return
        ChatPanel.getInstance(project)?.clearAttachments()
    }
}
