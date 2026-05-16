package com.lferrarezi.devinclichat.ui

import com.intellij.openapi.project.Project
import com.intellij.ui.JBColor
import com.intellij.ui.components.JBScrollPane
import com.intellij.ui.components.JBTextArea
import com.intellij.util.ui.JBUI
import com.lferrarezi.devinclichat.model.AgentScanner
import com.lferrarezi.devinclichat.model.ModelManager
import com.lferrarezi.devinclichat.model.SkillScanner
import com.lferrarezi.devinclichat.settings.DevinSettings
import java.awt.*
import java.awt.event.KeyAdapter
import java.awt.event.KeyEvent
import javax.swing.*

class ComposerPanel(private val project: Project) : JPanel() {

    val textArea = JBTextArea(3, 40)
    private val sendButton = JButton("↑")
    val chipsBar = ContextChipsBar()
    private val modelChip = JButton("auto")
    private val agentChip = JButton("auto")
    private val modeChip = JButton("integrado")
    private val skillsChip = JButton("Skills")
    private val attachChip = JButton("📎")
    private val busyLabel = JLabel("...")
    private val statusLabel = JLabel("pronto")

    var onSend: ((String) -> Unit)? = null
    var onAttach: (() -> Unit)? = null
    var onSelectSkills: (() -> Unit)? = null
    var onSelectModel: ((Component) -> Unit)? = null
    var onSelectAgent: ((Component) -> Unit)? = null
    var onSelectMode: ((Component) -> Unit)? = null
    var onInsertContext: (() -> Unit)? = null

    init {
        layout = BoxLayout(this, BoxLayout.Y_AXIS)
        border = JBUI.Borders.customLine(JBColor.border(), 1, 0, 0, 0)

        chipsBar.onRemoveAttachment = null

        val textScroll = JBScrollPane(textArea)
        textScroll.border = JBUI.Borders.empty()
        textScroll.maximumSize = Dimension(Int.MAX_VALUE, 140)

        textArea.lineWrap = true
        textArea.wrapStyleWord = true
        textArea.border = JBUI.Borders.empty(6, 8)
        textArea.isOpaque = false
        textArea.addKeyListener(object : KeyAdapter() {
            override fun keyPressed(e: KeyEvent) {
                if (e.keyCode == KeyEvent.VK_ENTER && !e.isShiftDown) {
                    e.consume()
                    triggerSend()
                }
            }
        })

        val composerBorder = JPanel(BorderLayout())
        composerBorder.border = BorderFactory.createCompoundBorder(
            JBUI.Borders.empty(6, 8, 4, 8),
            BorderFactory.createLineBorder(JBColor.border(), 1, true)
        )
        composerBorder.isOpaque = false

        val inputPanel = JPanel(BorderLayout())
        inputPanel.isOpaque = false
        inputPanel.border = JBUI.Borders.empty(4, 4, 0, 4)
        inputPanel.add(textScroll, BorderLayout.CENTER)

        val barPanel = buildBar()

        composerBorder.add(chipsBar, BorderLayout.NORTH)
        composerBorder.add(inputPanel, BorderLayout.CENTER)
        composerBorder.add(barPanel, BorderLayout.SOUTH)

        val statusPanel = buildStatusPanel()

        add(composerBorder)
        add(statusPanel)

        styleChip(modelChip)
        styleChip(agentChip)
        styleChip(modeChip)
        styleChip(skillsChip)
        styleChip(attachChip)
        styleSend(sendButton)

        modelChip.addActionListener { onSelectModel?.invoke(modelChip) }
        agentChip.addActionListener { onSelectAgent?.invoke(agentChip) }
        modeChip.addActionListener { onSelectMode?.invoke(modeChip) }
        skillsChip.addActionListener { onSelectSkills?.invoke() }
        attachChip.addActionListener { onAttach?.invoke() }
        sendButton.addActionListener { triggerSend() }

        busyLabel.isVisible = false
        busyLabel.foreground = JBColor(Color(0x1E88E5), Color(0x64B5F6))
    }

    private fun buildBar(): JPanel {
        val bar = JPanel()
        bar.layout = BoxLayout(bar, BoxLayout.X_AXIS)
        bar.isOpaque = false
        bar.border = JBUI.Borders.empty(4, 4, 6, 4)
        bar.add(modelChip)
        bar.add(Box.createHorizontalStrut(4))
        bar.add(agentChip)
        bar.add(Box.createHorizontalStrut(4))
        bar.add(modeChip)
        bar.add(Box.createHorizontalStrut(4))
        bar.add(skillsChip)
        bar.add(Box.createHorizontalStrut(4))
        bar.add(attachChip)
        bar.add(Box.createHorizontalGlue())
        bar.add(sendButton)
        return bar
    }

    private fun buildStatusPanel(): JPanel {
        val p = JPanel()
        p.layout = BoxLayout(p, BoxLayout.X_AXIS)
        p.isOpaque = false
        p.border = JBUI.Borders.empty(0, 10, 4, 10)
        busyLabel.font = busyLabel.font.deriveFont(10f)
        statusLabel.font = statusLabel.font.deriveFont(10f)
        statusLabel.foreground = JBColor.GRAY
        p.add(busyLabel)
        p.add(Box.createHorizontalStrut(4))
        p.add(statusLabel)
        return p
    }

    private fun styleChip(btn: JButton) {
        btn.font = btn.font.deriveFont(10f)
        btn.border = BorderFactory.createCompoundBorder(
            BorderFactory.createLineBorder(JBColor.border(), 1, true),
            JBUI.Borders.empty(2, 6)
        )
        btn.isFocusPainted = false
        btn.cursor = Cursor.getPredefinedCursor(Cursor.HAND_CURSOR)
    }

    private fun styleSend(btn: JButton) {
        btn.preferredSize = Dimension(28, 28)
        btn.minimumSize = Dimension(28, 28)
        btn.maximumSize = Dimension(28, 28)
        btn.font = btn.font.deriveFont(Font.BOLD, 14f)
        btn.isFocusPainted = false
        btn.background = JBColor(Color(0x1E88E5), Color(0x1565C0))
        btn.foreground = Color.WHITE
        btn.border = JBUI.Borders.empty(2)
        btn.cursor = Cursor.getPredefinedCursor(Cursor.HAND_CURSOR)
    }

    private fun triggerSend() {
        val text = textArea.text.trim()
        if (text.isBlank()) { setStatus("Digite uma mensagem para enviar."); return }
        textArea.text = ""
        onSend?.invoke(text)
    }

    fun setBusy(busy: Boolean) {
        busyLabel.isVisible = busy
        sendButton.isEnabled = !busy
    }

    fun setStatus(msg: String) {
        statusLabel.text = msg
    }

    fun refreshMeta() {
        val s = DevinSettings.getInstance().state
        modelChip.text = ModelManager.sanitizeModel(s.modeloAtual)
        agentChip.text = s.agenteAtual
        modeChip.text = if (s.modoExecucaoChat == "terminal") "terminal" else "integrado"
        val skillCount = s.skillsSelecionadas.size
        skillsChip.text = if (skillCount > 0) "Skills ($skillCount)" else "Skills"
        chipsBar.setSkills(s.skillsSelecionadas)
        revalidate()
        repaint()
    }
}
