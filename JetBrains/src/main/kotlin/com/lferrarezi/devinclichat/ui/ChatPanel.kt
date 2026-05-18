package com.lferrarezi.devinclichat.ui

import com.intellij.openapi.fileEditor.FileEditorManager
import com.intellij.openapi.project.Project
import com.intellij.ui.JBColor
import com.intellij.ui.components.JBScrollPane
import com.intellij.util.ui.JBUI
import com.lferrarezi.devinclichat.cli.DevinRunner
import com.lferrarezi.devinclichat.cli.GitDiffRunner
import com.lferrarezi.devinclichat.popup.AgentPopup
import com.lferrarezi.devinclichat.popup.AttachPopup
import com.lferrarezi.devinclichat.popup.ModelPopup
import com.lferrarezi.devinclichat.popup.ModePopup
import com.lferrarezi.devinclichat.popup.SkillsPopup
import com.lferrarezi.devinclichat.prompt.AttachmentItem
import com.lferrarezi.devinclichat.prompt.AttachmentReader
import com.lferrarezi.devinclichat.settings.DevinSettings
import com.lferrarezi.devinclichat.state.ChatHistoryState
import java.awt.BorderLayout
import java.awt.Color
import java.awt.Dimension
import java.awt.Font
import java.awt.FlowLayout
import java.io.File
import java.text.SimpleDateFormat
import java.util.Date
import javax.swing.*

class ChatPanel(val project: Project) : JPanel(BorderLayout()) {

    private val threadPanel = ChatThreadPanel()
    val composerPanel = ComposerPanel(project)
    private val attachments = mutableListOf<AttachmentItem>()
    private var busy = false

    init {
        isOpaque = false

        val scroll = JBScrollPane(threadPanel)
        scroll.border = JBUI.Borders.empty()
        scroll.verticalScrollBar.unitIncrement = 16

        add(buildHeader(), BorderLayout.NORTH)
        add(scroll, BorderLayout.CENTER)
        add(composerPanel, BorderLayout.SOUTH)

        composerPanel.onSend = { text -> handleSend(text) }
        composerPanel.onCancel = { handleCancel() }
        composerPanel.onAttach = { AttachPopup.show(project, composerPanel) { handleAttach(it) } }
        composerPanel.onSelectSkills = { SkillsPopup.show(project, composerPanel) { refreshMeta() } }
        composerPanel.onSelectModel = { comp -> ModelPopup.show(comp, project) { refreshMeta() } }
        composerPanel.onSelectAgent = { comp -> AgentPopup.show(comp, project) { refreshMeta() } }
        composerPanel.onSelectMode = { comp -> ModePopup.show(comp, project) { refreshMeta() } }
        composerPanel.onInsertContext = { insertEditorContext() }
        composerPanel.chipsBar.onRemoveAttachment = { id -> removeAttachment(id) }

        threadPanel.welcomePanel.onStarter = { prompt ->
            composerPanel.textArea.text = prompt
            composerPanel.textArea.requestFocusInWindow()
        }

        refreshMeta()
    }

    private fun buildHeader(): JPanel {
        val header = JPanel(BorderLayout())
        header.border = JBUI.Borders.customLine(JBColor.border(), 0, 0, 1, 0)
        header.isOpaque = false

        val left = JPanel(FlowLayout(FlowLayout.LEFT, 6, 4))
        left.isOpaque = false
        val avatar = JLabel("D")
        avatar.isOpaque = true
        avatar.background = JBColor(Color(0x1E88E5), Color(0x1565C0))
        avatar.foreground = Color.WHITE
        avatar.font = avatar.font.deriveFont(Font.BOLD, 11f)
        avatar.border = JBUI.Borders.empty(2, 5)
        val title = JLabel("Devin Cli Chat")
        title.font = title.font.deriveFont(Font.BOLD, 12f)
        left.add(avatar)
        left.add(title)

        val right = JPanel(FlowLayout(FlowLayout.RIGHT, 4, 2))
        right.isOpaque = false
        val verifyBtn = buildHeaderBtn("i", "Verificar Devin CLI") { handleVerifyCli() }
        val historyBtn = buildHeaderBtn("◷", "Historico") { showHistory() }
        val newChatBtn = buildHeaderBtn("+", "Nova conversa") { clearChat() }
        val terminalBtn = buildHeaderBtn("⌁", "Abrir no terminal") { openTerminal() }
        right.add(verifyBtn)
        right.add(historyBtn)
        right.add(newChatBtn)
        right.add(terminalBtn)

        header.add(left, BorderLayout.WEST)
        header.add(right, BorderLayout.EAST)
        return header
    }

    private fun buildHeaderBtn(text: String, tooltip: String, action: () -> Unit): JButton {
        val btn = JButton(text)
        btn.toolTipText = tooltip
        btn.isFocusPainted = false
        btn.isBorderPainted = false
        btn.isOpaque = false
        btn.font = btn.font.deriveFont(13f)
        btn.preferredSize = Dimension(26, 26)
        btn.addActionListener { action() }
        return btn
    }

    fun handleSend(text: String) {
        if (busy) { composerPanel.setStatus("Aguarde a resposta atual."); return }
        val s = DevinSettings.getInstance().state
        val mode = s.modoExecucaoChat
        val history = ChatHistoryState.getInstance(project)
        threadPanel.addMessage("user", text)
        history.addMessage("user", text)
        history.updateCurrentSessionMeta(
            model = com.lferrarezi.devinclichat.model.ModelManager.sanitizeModel(s.modeloAtual),
            agent = s.agenteAtual,
            mode = mode,
            skills = s.skillsSelecionadas.toList()
        )
        if (mode == "terminal") {
            DevinRunner.openTerminal(project, text, attachments.toList())
            threadPanel.addMessage("assistant", "Sessão aberta no terminal integrado com o contexto do workspace.")
            return
        }
        setBusy(true)
        composerPanel.setStatus("Enviando para o Devin CLI...")
        DevinRunner.runIntegrated(project, text, attachments.toList()) { response ->
            threadPanel.addMessage("assistant", response)
            history.addMessage("assistant", response)
            setBusy(false)
            composerPanel.setStatus("pronto")
        }
    }

    fun sendText(text: String) = handleSend(text)

    private fun handleCancel() {
        val ok = DevinRunner.cancelIntegrated()
        composerPanel.setStatus(if (ok) "Cancelamento solicitado." else "Nenhuma execução ativa para cancelar.")
    }

    private fun handleVerifyCli() {
        composerPanel.setStatus("Verificando Devin CLI...")
        DevinRunner.verifyCli(project) { ok, text ->
            threadPanel.addMessage("assistant", text)
            composerPanel.setStatus(if (ok) "pronto" else "Falha na verificação.")
        }
    }

    fun clearChat() {
        threadPanel.clearMessages()
        attachments.clear()
        ChatHistoryState.getInstance(project).newSession()
        refreshMeta()
        composerPanel.setStatus("Nova conversa iniciada.")
    }

    private fun showHistory() {
        val history = ChatHistoryState.getInstance(project)
        val sessions = history.sessionsNewestFirst().filter { it.messages.isNotEmpty() }

        if (sessions.isEmpty()) {
            JOptionPane.showMessageDialog(this, "Nenhuma conversa salva ainda.", "Historico", JOptionPane.INFORMATION_MESSAGE)
            return
        }

        val model = DefaultListModel<ChatHistoryState.Session>()
        sessions.forEach { model.addElement(it) }

        val list = JList(model)
        list.selectionMode = ListSelectionModel.SINGLE_SELECTION
        list.visibleRowCount = 10
        list.cellRenderer = HistoryCellRenderer()
        list.selectedIndex = 0

        val scroll = JBScrollPane(list)
        scroll.preferredSize = Dimension(420, 280)

        val load = JButton("Carregar")
        val delete = JButton("Excluir")
        val clear = JButton("Limpar tudo")
        val close = JButton("Fechar")

        val buttons = JPanel(FlowLayout(FlowLayout.RIGHT, 6, 0))
        buttons.add(clear)
        buttons.add(delete)
        buttons.add(load)
        buttons.add(close)

        val content = JPanel(BorderLayout(0, 8))
        content.border = JBUI.Borders.empty(8)
        content.add(scroll, BorderLayout.CENTER)
        content.add(buttons, BorderLayout.SOUTH)

        val dialog = JDialog(SwingUtilities.getWindowAncestor(this), "Historico", java.awt.Dialog.ModalityType.DOCUMENT_MODAL)
        dialog.contentPane = content
        dialog.pack()
        dialog.setLocationRelativeTo(this)

        fun selectedSession(): ChatHistoryState.Session? = list.selectedValue

        load.addActionListener {
            val session = selectedSession() ?: return@addActionListener
            history.loadSession(session.id)?.let { loaded ->
                loadHistorySession(loaded)
                composerPanel.setStatus("Conversa carregada do historico.")
            }
            dialog.dispose()
        }
        delete.addActionListener {
            val session = selectedSession() ?: return@addActionListener
            history.deleteSession(session.id)
            model.removeElement(session)
            if (model.isEmpty) dialog.dispose() else list.selectedIndex = 0
            composerPanel.setStatus("Conversa removida do historico.")
        }
        clear.addActionListener {
            val ok = JOptionPane.showConfirmDialog(dialog, "Limpar todo o historico?", "Historico", JOptionPane.YES_NO_OPTION)
            if (ok == JOptionPane.YES_OPTION) {
                history.clearAll()
                threadPanel.clearMessages()
                attachments.clear()
                refreshMeta()
                composerPanel.setStatus("Historico limpo.")
                dialog.dispose()
            }
        }
        close.addActionListener { dialog.dispose() }
        list.addMouseListener(object : java.awt.event.MouseAdapter() {
            override fun mouseClicked(e: java.awt.event.MouseEvent) {
                if (e.clickCount == 2) load.doClick()
            }
        })

        dialog.isVisible = true
    }

    private fun loadHistorySession(session: ChatHistoryState.Session) {
        attachments.clear()
        val s = DevinSettings.getInstance().state
        if (session.model != "auto") s.modeloAtual = session.model
        s.agenteAtual = session.agent
        s.modoExecucaoChat = session.mode
        s.skillsSelecionadas = session.skills.toMutableList()
        threadPanel.setMessages(session.messages.map { it.role to it.text })
        refreshMeta()
    }

    private fun openTerminal() {
        DevinRunner.openTerminal(project, composerPanel.textArea.text, attachments.toList())
    }

    private fun insertEditorContext() {
        val editor = FileEditorManager.getInstance(project).selectedTextEditor ?: return
        val doc = editor.document
        val selected = editor.selectionModel.selectedText
        val text = selected ?: doc.text.take(60_000)
        val file = FileEditorManager.getInstance(project).selectedFiles.firstOrNull()
        val label = file?.name ?: "editor"
        val current = composerPanel.textArea.text.trim()
        val context = "Contexto de $label:\n```\n$text\n```"
        composerPanel.textArea.text = if (current.isBlank()) context else "$current\n\n$context"
        composerPanel.textArea.requestFocusInWindow()
    }

    fun handleAttach(item: AttachmentItem) {
        val maxItems = DevinSettings.getInstance().state.maximoAnexos
        if (attachments.size >= maxItems) {
            composerPanel.setStatus("Limite de $maxItems anexos atingido.")
            return
        }
        attachments.add(item)
        composerPanel.chipsBar.setAttachments(attachments)
        composerPanel.setStatus("${attachments.size} anexo(s) carregado(s).")
    }

    private fun removeAttachment(id: String) {
        attachments.removeIf { it.id == id }
        composerPanel.chipsBar.setAttachments(attachments)
    }

    fun attachItem(item: AttachmentItem) = handleAttach(item)

    fun clearAttachments() {
        attachments.clear()
        composerPanel.chipsBar.setAttachments(attachments)
    }

    fun refreshMeta() {
        composerPanel.refreshMeta()
        composerPanel.chipsBar.setAttachments(attachments)
    }

    private fun setBusy(value: Boolean) {
        busy = value
        composerPanel.setBusy(value)
    }

    companion object {
        fun getInstance(project: Project): ChatPanel? {
            val tw = com.intellij.openapi.wm.ToolWindowManager.getInstance(project)
                .getToolWindow("DevinCliChat") ?: return null
            return tw.contentManager.contents
                .mapNotNull { it.component as? ChatPanel }
                .firstOrNull()
        }
    }

    private class HistoryCellRenderer : DefaultListCellRenderer() {
        private val formatter = SimpleDateFormat("dd/MM HH:mm")

        override fun getListCellRendererComponent(
            list: JList<*>?,
            value: Any?,
            index: Int,
            isSelected: Boolean,
            cellHasFocus: Boolean
        ): java.awt.Component {
            val label = super.getListCellRendererComponent(list, value, index, isSelected, cellHasFocus) as JLabel
            val session = value as? ChatHistoryState.Session
            if (session != null) {
                val date = formatter.format(Date(session.updatedAt))
                val count = session.messages.size
                label.text = "<html><b>${escapeHtml(session.title)}</b><br><span style='font-size:10px;color:gray'>$date · $count mensagem(ns)</span></html>"
                label.border = JBUI.Borders.empty(6, 8)
            }
            return label
        }

        private fun escapeHtml(text: String): String =
            text.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
    }
}
