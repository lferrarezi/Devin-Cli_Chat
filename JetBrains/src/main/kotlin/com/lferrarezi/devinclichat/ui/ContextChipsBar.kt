package com.lferrarezi.devinclichat.ui

import com.intellij.ui.JBColor
import com.intellij.util.ui.JBUI
import com.lferrarezi.devinclichat.prompt.AttachmentItem
import java.awt.FlowLayout
import javax.swing.BorderFactory
import javax.swing.JButton
import javax.swing.JLabel
import javax.swing.JPanel

class ContextChipsBar : JPanel(FlowLayout(FlowLayout.LEFT, 4, 2)) {

    private val attachments = mutableListOf<AttachmentItem>()
    private val skills = mutableListOf<String>()
    var onRemoveAttachment: ((String) -> Unit)? = null

    init {
        isOpaque = false
        border = JBUI.Borders.empty(0, 4)
        isVisible = false
    }

    fun setSkills(ids: List<String>) {
        skills.clear()
        skills.addAll(ids)
        rebuild()
    }

    fun setAttachments(items: List<AttachmentItem>) {
        attachments.clear()
        attachments.addAll(items)
        rebuild()
    }

    private fun rebuild() {
        removeAll()
        for (skill in skills) {
            add(buildChip("#$skill", null))
        }
        for (item in attachments) {
            add(buildChip(item.label, item.id))
        }
        isVisible = componentCount > 0
        revalidate()
        repaint()
    }

    private fun buildChip(label: String, removeId: String?): JPanel {
        val chip = JPanel(FlowLayout(FlowLayout.LEFT, 3, 0))
        chip.isOpaque = true
        chip.background = JBColor(0xE8E8E8, 0x3C3F41)
        chip.border = BorderFactory.createCompoundBorder(
            BorderFactory.createLineBorder(JBColor(0xCCCCCC, 0x555555), 1, true),
            JBUI.Borders.empty(2, 6)
        )
        val lbl = JLabel(label)
        lbl.font = lbl.font.deriveFont(11f)
        chip.add(lbl)
        if (removeId != null) {
            val btn = JButton("×")
            btn.isOpaque = false
            btn.isBorderPainted = false
            btn.isFocusPainted = false
            btn.font = btn.font.deriveFont(11f)
            btn.toolTipText = "Remover"
            btn.addActionListener { onRemoveAttachment?.invoke(removeId) }
            chip.add(btn)
        }
        return chip
    }
}
