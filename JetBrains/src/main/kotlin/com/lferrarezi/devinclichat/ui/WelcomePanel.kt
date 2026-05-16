package com.lferrarezi.devinclichat.ui

import com.intellij.util.ui.JBUI
import java.awt.BorderLayout
import java.awt.Font
import java.awt.GridLayout
import javax.swing.BorderFactory
import javax.swing.JButton
import javax.swing.JLabel
import javax.swing.JPanel
import javax.swing.SwingConstants

class WelcomePanel : JPanel(BorderLayout()) {

    var onStarter: ((String) -> Unit)? = null

    init {
        isOpaque = false
        border = JBUI.Borders.empty(16)

        val title = JLabel("Como posso ajudar neste workspace?")
        title.font = title.font.deriveFont(Font.BOLD, 15f)
        title.horizontalAlignment = SwingConstants.LEFT

        val subtitle = JLabel("<html><body style='color:gray'>Use o Devin CLI com contexto da pasta aberta, modelo, agente e skills selecionados.</body></html>")
        subtitle.border = JBUI.Borders.emptyTop(4)

        val topPanel = JPanel(BorderLayout())
        topPanel.isOpaque = false
        topPanel.add(title, BorderLayout.NORTH)
        topPanel.add(subtitle, BorderLayout.CENTER)

        val starters = listOf(
            "Revisar diff" to "Revise o git diff atual com foco em bugs, segurança, testes, impacto produtivo e rollback.",
            "Planejar tarefa" to "Planeje a implementação da próxima tarefa em etapas pequenas, com riscos, testes e estratégia de rollback.",
            "Explicar contexto" to "Analise o contexto do arquivo aberto no editor e explique os principais pontos."
        )

        val grid = JPanel(GridLayout(starters.size, 1, 0, 6))
        grid.isOpaque = false
        grid.border = JBUI.Borders.emptyTop(16)

        for ((title_, prompt) in starters) {
            val btn = JButton("<html><b>$title_</b></html>")
            btn.horizontalAlignment = SwingConstants.LEFT
            btn.border = BorderFactory.createCompoundBorder(
                BorderFactory.createEtchedBorder(),
                JBUI.Borders.empty(8, 10)
            )
            btn.addActionListener { onStarter?.invoke(prompt) }
            grid.add(btn)
        }

        add(topPanel, BorderLayout.NORTH)
        add(grid, BorderLayout.CENTER)
    }
}
