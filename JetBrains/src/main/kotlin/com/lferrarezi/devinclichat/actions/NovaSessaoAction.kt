package com.lferrarezi.devinclichat.actions

import com.intellij.openapi.actionSystem.AnAction
import com.intellij.openapi.actionSystem.AnActionEvent
import com.lferrarezi.devinclichat.cli.DevinRunner

class NovaSessaoAction : AnAction() {
    override fun actionPerformed(e: AnActionEvent) {
        val project = e.project ?: return
        DevinRunner.openTerminal(project, "", emptyList())
    }
}
