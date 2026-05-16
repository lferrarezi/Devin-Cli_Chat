package com.lferrarezi.devinclichat.settings

import com.intellij.openapi.options.Configurable
import javax.swing.JComponent

class DevinSettingsConfigurable : Configurable {

    private var component: DevinSettingsComponent? = null

    override fun getDisplayName(): String = "Devin Cli Chat"

    override fun createComponent(): JComponent {
        component = DevinSettingsComponent()
        component!!.applyFrom(DevinSettings.getInstance().state)
        return component!!.panel
    }

    override fun isModified(): Boolean =
        component?.isModified(DevinSettings.getInstance().state) ?: false

    override fun apply() {
        component?.applyTo(DevinSettings.getInstance().state)
    }

    override fun reset() {
        component?.applyFrom(DevinSettings.getInstance().state)
    }

    override fun disposeUIResources() {
        component = null
    }
}
