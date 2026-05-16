package com.lferrarezi.devinclichat.popup

import com.intellij.openapi.fileChooser.FileChooser
import com.intellij.openapi.fileChooser.FileChooserDescriptorFactory
import com.intellij.openapi.fileEditor.FileEditorManager
import com.intellij.openapi.project.Project
import com.intellij.openapi.ui.Messages
import com.lferrarezi.devinclichat.prompt.AttachmentItem
import com.lferrarezi.devinclichat.prompt.AttachmentReader
import com.lferrarezi.devinclichat.settings.DevinSettings
import com.lferrarezi.devinclichat.ui.ChatPanel
import java.io.File
import javax.swing.JPanel

object AttachPopup {
    fun show(project: Project, anchor: JPanel, onItem: (AttachmentItem) -> Unit) {
        val options = arrayOf("Selecionar Pasta", "Arquivos Abertos no Editor")
        val result = Messages.showChooseDialog(
            project, "O que deseja anexar?", "Anexar ao Chat",
            null, options, options[0]
        )
        when (result) {
            0 -> attachFolder(project, onItem)
            1 -> attachOpenFiles(project, onItem)
        }
    }

    private fun attachFolder(project: Project, onItem: (AttachmentItem) -> Unit) {
        val descriptor = FileChooserDescriptorFactory.createSingleFolderDescriptor()
        descriptor.title = "Selecionar Pasta para Anexar"
        val chosen = FileChooser.chooseFiles(descriptor, project, null)
        for (vf in chosen) {
            val folder = File(vf.path)
            val item = AttachmentReader.readFolderItem(folder, project.basePath) ?: continue
            onItem(item)
        }
    }

    private fun attachOpenFiles(project: Project, onItem: (AttachmentItem) -> Unit) {
        val openFiles = FileEditorManager.getInstance(project).openFiles
        if (openFiles.isEmpty()) {
            Messages.showInfoMessage(project, "Nenhum arquivo aberto no editor.", "Anexar Arquivos")
            return
        }
        val names = openFiles.map { it.name }.toTypedArray()
        val chosen = Messages.showChooseDialog(
            project, "Selecione o arquivo para anexar:", "Arquivos Abertos",
            null, names, names[0]
        )
        if (chosen >= 0) {
            val vf = openFiles[chosen]
            val file = File(vf.path)
            val item = AttachmentReader.readFileItem(file, project.basePath) ?: return
            onItem(item)
        }
    }
}
