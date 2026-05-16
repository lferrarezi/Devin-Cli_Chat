package com.lferrarezi.devinclichat.actions

import com.intellij.openapi.actionSystem.AnAction
import com.intellij.openapi.actionSystem.AnActionEvent
import com.lferrarezi.devinclichat.cli.CliChecker

class VerificarCliAction : AnAction() {
    override fun actionPerformed(e: AnActionEvent) {
        val project = e.project ?: return
        CliChecker.check(project)
    }
}
