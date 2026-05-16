package com.lferrarezi.devinclichat.statusbar

import com.intellij.openapi.project.Project
import com.intellij.openapi.wm.StatusBar
import com.intellij.openapi.wm.StatusBarWidget
import com.intellij.openapi.wm.StatusBarWidgetFactory

class DevinStatusBarWidgetFactory : StatusBarWidgetFactory {
    override fun getId(): String = "DevinCliChatStatus"
    override fun getDisplayName(): String = "Devin Cli Chat"
    override fun isAvailable(project: Project): Boolean = true
    override fun createWidget(project: Project): StatusBarWidget = DevinStatusBarWidget(project)
    override fun disposeWidget(widget: StatusBarWidget) = widget.dispose()
    override fun canBeEnabledOn(statusBar: StatusBar): Boolean = true
}
