package com.lferrarezi.devinclichat.actions

import com.intellij.openapi.actionSystem.AnAction
import com.intellij.openapi.actionSystem.AnActionEvent
import com.intellij.openapi.wm.ToolWindowManager
import com.lferrarezi.devinclichat.cli.GitDiffRunner
import com.lferrarezi.devinclichat.ui.ChatPanel

class RevisarDiffAction : AnAction() {
    override fun actionPerformed(e: AnActionEvent) {
        val project = e.project ?: return
        ToolWindowManager.getInstance(project).getToolWindow("DevinCliChat")?.activate {
            val diff = GitDiffRunner.diff(project)
            val prompt = "Revise o git diff atual com foco em bugs, segurança, testes, impacto produtivo e rollback.\n\n```diff\n$diff\n```"
            ChatPanel.getInstance(project)?.sendText(prompt)
        }
    }
}
