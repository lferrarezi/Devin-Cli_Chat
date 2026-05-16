package com.lferrarezi.devinclichat.statusbar

import com.intellij.openapi.project.Project
import com.intellij.openapi.wm.StatusBar
import com.intellij.openapi.wm.StatusBarWidget
import com.intellij.openapi.wm.ToolWindowManager
import com.lferrarezi.devinclichat.model.ModelManager
import com.lferrarezi.devinclichat.settings.DevinSettings
import com.intellij.util.Consumer
import java.awt.event.MouseEvent

class DevinStatusBarWidget(private val project: Project) : StatusBarWidget, StatusBarWidget.TextPresentation {

    private var statusBar: StatusBar? = null

    override fun ID(): String = "DevinCliChatStatus"

    override fun getPresentation(): StatusBarWidget.WidgetPresentation = this

    override fun install(statusBar: StatusBar) {
        this.statusBar = statusBar
    }

    override fun dispose() {
        statusBar = null
    }

    override fun getText(): String {
        val s = DevinSettings.getInstance().state
        val model = ModelManager.sanitizeModel(s.modeloAtual)
        val agent = s.agenteAtual
        return "Devin: $model / $agent"
    }

    override fun getTooltipText(): String = "Devin Cli Chat — clique para abrir o painel"

    override fun getAlignment(): Float = 0.5f

    override fun getClickConsumer(): Consumer<MouseEvent>? = Consumer {
        ToolWindowManager.getInstance(project).getToolWindow("DevinCliChat")?.activate(null)
    }

    fun update() {
        statusBar?.updateWidget(ID())
    }
}
