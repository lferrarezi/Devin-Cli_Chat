package com.lferrarezi.devinclichat.ui

import com.intellij.ui.JBColor
import com.intellij.util.ui.JBUI
import com.intellij.util.ui.UIUtil
import java.awt.BorderLayout
import java.awt.Color
import java.awt.Dimension
import java.awt.Font
import javax.swing.Box
import javax.swing.BoxLayout
import javax.swing.JLabel
import javax.swing.JPanel
import javax.swing.JTextPane
import javax.swing.text.html.HTMLEditorKit

class ChatThreadPanel : JPanel() {

    private val messagesPanel = JPanel()
    val welcomePanel = WelcomePanel()
    private var hasMessages = false

    init {
        layout = BorderLayout()
        isOpaque = false

        messagesPanel.layout = BoxLayout(messagesPanel, BoxLayout.Y_AXIS)
        messagesPanel.isOpaque = false
        messagesPanel.border = JBUI.Borders.empty(8)

        messagesPanel.add(welcomePanel)
        add(messagesPanel, BorderLayout.NORTH)
    }

    fun addMessage(role: String, text: String) {
        if (!hasMessages) {
            welcomePanel.isVisible = false
            hasMessages = true
        }
        val bubble = buildBubble(role, text)
        messagesPanel.add(bubble)
        messagesPanel.add(Box.createVerticalStrut(10))
        messagesPanel.revalidate()
        messagesPanel.repaint()
        scrollToBottom()
    }

    fun clearMessages() {
        messagesPanel.removeAll()
        welcomePanel.isVisible = true
        messagesPanel.add(welcomePanel)
        hasMessages = false
        messagesPanel.revalidate()
        messagesPanel.repaint()
    }

    fun setMessages(messages: List<Pair<String, String>>) {
        clearMessages()
        messages.forEach { (role, text) -> addMessage(role, text) }
    }

    private fun scrollToBottom() {
        val parent = parent
        if (parent != null) {
            val scrollPane = findScrollPane()
            scrollPane?.verticalScrollBar?.let { vsb ->
                vsb.value = vsb.maximum
            }
        }
    }

    private fun findScrollPane(): javax.swing.JScrollPane? {
        var p = parent
        while (p != null) {
            if (p is javax.swing.JScrollPane) return p
            p = p.parent
        }
        return null
    }

    private fun buildBubble(role: String, text: String): JPanel {
        val isUser = role == "user"
        val row = JPanel(BorderLayout())
        row.isOpaque = false
        row.maximumSize = Dimension(Int.MAX_VALUE, Int.MAX_VALUE)

        val bubble = JPanel(BorderLayout())
        bubble.isOpaque = true
        bubble.border = JBUI.Borders.empty(8, 12)

        if (isUser) {
            bubble.background = JBColor(Color(0xDCF8C6), Color(0x2D4A2D))
            val lbl = JLabel(text)
            lbl.font = lbl.font.deriveFont(12f)
            bubble.add(lbl, BorderLayout.CENTER)
            bubble.maximumSize = Dimension(480, Int.MAX_VALUE)
            row.add(bubble, BorderLayout.EAST)
        } else {
            bubble.background = UIUtil.getPanelBackground()
            val headerPanel = JPanel(BorderLayout())
            headerPanel.isOpaque = false
            val avatar = buildAvatar()
            val meta = JLabel("Devin Cli Chat")
            meta.font = meta.font.deriveFont(Font.BOLD, 11f)
            meta.foreground = JBColor.GRAY
            headerPanel.add(avatar, BorderLayout.WEST)
            headerPanel.add(meta, BorderLayout.CENTER)

            val content = JTextPane()
            content.contentType = "text/html"
            (content.editorKit as? HTMLEditorKit)?.styleSheet?.addRule(
                "body { font-family: sans-serif; font-size: 12pt; margin: 0; padding: 0; }"
            )
            content.isEditable = false
            content.isOpaque = false
            content.text = MessageRenderer.toHtml(text, false)
            content.border = JBUI.Borders.emptyTop(4)

            bubble.add(headerPanel, BorderLayout.NORTH)
            bubble.add(content, BorderLayout.CENTER)
            row.add(bubble, BorderLayout.CENTER)
        }
        return row
    }

    private fun buildAvatar(): JLabel {
        val avatar = JLabel("D", JLabel.CENTER)
        avatar.isOpaque = true
        avatar.background = JBColor(Color(0x1E88E5), Color(0x1565C0))
        avatar.foreground = Color.WHITE
        avatar.font = avatar.font.deriveFont(Font.BOLD, 11f)
        avatar.preferredSize = Dimension(22, 22)
        avatar.minimumSize = Dimension(22, 22)
        avatar.maximumSize = Dimension(22, 22)
        avatar.border = JBUI.Borders.emptyRight(6)
        return avatar
    }
}
