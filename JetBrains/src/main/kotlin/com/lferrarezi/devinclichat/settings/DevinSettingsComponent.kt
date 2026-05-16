package com.lferrarezi.devinclichat.settings

import com.intellij.ui.components.JBLabel
import com.intellij.ui.components.JBTextField
import com.intellij.util.ui.FormBuilder
import javax.swing.JCheckBox
import javax.swing.JComboBox
import javax.swing.JPanel
import javax.swing.JSpinner
import javax.swing.SpinnerNumberModel

class DevinSettingsComponent {

    val panel: JPanel
    val caminhoDevin = JBTextField()
    val modeloAtual = JBTextField()
    val agenteAtual = JBTextField()
    val modoExecucaoChat = JComboBox(arrayOf("resposta-integrada", "terminal"))
    val timeoutChatMs = JSpinner(SpinnerNumberModel(300_000L, 1_000L, 3_600_000L, 10_000L))
    val prefixoPromptPadrao = JBTextField()
    val usarGitBashNoWindows = JCheckBox("Usar Git Bash no Windows")
    val gitBashPath = JBTextField()
    val diretorioAgentesWorkspace = JBTextField()
    val diretorioAgentesGlobal = JBTextField()
    val diretorioSkillsWorkspace = JBTextField()
    val diretorioSkillsGlobal = JBTextField()
    val incluirConteudoAgenteSkillNoPrompt = JCheckBox("Incluir conteúdo de AGENT.md/SKILL.md no prompt")

    init {
        panel = FormBuilder.createFormBuilder()
            .addLabeledComponent(JBLabel("Caminho do Devin CLI:"), caminhoDevin, 1, false)
            .addLabeledComponent(JBLabel("Modelo atual:"), modeloAtual, 1, false)
            .addLabeledComponent(JBLabel("Agente atual:"), agenteAtual, 1, false)
            .addLabeledComponent(JBLabel("Modo de execução:"), modoExecucaoChat, 1, false)
            .addLabeledComponent(JBLabel("Timeout (ms):"), timeoutChatMs, 1, false)
            .addLabeledComponent(JBLabel("Prefixo do prompt:"), prefixoPromptPadrao, 1, false)
            .addComponent(usarGitBashNoWindows, 1)
            .addLabeledComponent(JBLabel("Caminho Git Bash (opcional):"), gitBashPath, 1, false)
            .addSeparator()
            .addLabeledComponent(JBLabel("Diretório agentes (workspace):"), diretorioAgentesWorkspace, 1, false)
            .addLabeledComponent(JBLabel("Diretório agentes (global):"), diretorioAgentesGlobal, 1, false)
            .addLabeledComponent(JBLabel("Diretório skills (workspace):"), diretorioSkillsWorkspace, 1, false)
            .addLabeledComponent(JBLabel("Diretório skills (global):"), diretorioSkillsGlobal, 1, false)
            .addComponent(incluirConteudoAgenteSkillNoPrompt, 1)
            .addComponentFillVertically(JPanel(), 0)
            .panel
    }

    fun applyFrom(s: DevinSettings.State) {
        caminhoDevin.text = s.caminhoDevin
        modeloAtual.text = s.modeloAtual
        agenteAtual.text = s.agenteAtual
        modoExecucaoChat.selectedItem = s.modoExecucaoChat
        timeoutChatMs.value = s.timeoutChatMs
        prefixoPromptPadrao.text = s.prefixoPromptPadrao
        usarGitBashNoWindows.isSelected = s.usarGitBashNoWindows
        gitBashPath.text = s.gitBashPath
        diretorioAgentesWorkspace.text = s.diretorioAgentesWorkspace
        diretorioAgentesGlobal.text = s.diretorioAgentesGlobal
        diretorioSkillsWorkspace.text = s.diretorioSkillsWorkspace
        diretorioSkillsGlobal.text = s.diretorioSkillsGlobal
        incluirConteudoAgenteSkillNoPrompt.isSelected = s.incluirConteudoAgenteSkillNoPrompt
    }

    fun applyTo(s: DevinSettings.State) {
        s.caminhoDevin = caminhoDevin.text.trim()
        s.modeloAtual = modeloAtual.text.trim()
        s.agenteAtual = agenteAtual.text.trim()
        s.modoExecucaoChat = modoExecucaoChat.selectedItem as? String ?: "resposta-integrada"
        s.timeoutChatMs = (timeoutChatMs.value as? Number)?.toLong() ?: 300_000L
        s.prefixoPromptPadrao = prefixoPromptPadrao.text
        s.usarGitBashNoWindows = usarGitBashNoWindows.isSelected
        s.gitBashPath = gitBashPath.text.trim()
        s.diretorioAgentesWorkspace = diretorioAgentesWorkspace.text.trim()
        s.diretorioAgentesGlobal = diretorioAgentesGlobal.text.trim()
        s.diretorioSkillsWorkspace = diretorioSkillsWorkspace.text.trim()
        s.diretorioSkillsGlobal = diretorioSkillsGlobal.text.trim()
        s.incluirConteudoAgenteSkillNoPrompt = incluirConteudoAgenteSkillNoPrompt.isSelected
    }

    fun isModified(s: DevinSettings.State): Boolean =
        caminhoDevin.text.trim() != s.caminhoDevin ||
        modeloAtual.text.trim() != s.modeloAtual ||
        agenteAtual.text.trim() != s.agenteAtual ||
        (modoExecucaoChat.selectedItem as? String) != s.modoExecucaoChat ||
        (timeoutChatMs.value as? Number)?.toLong() != s.timeoutChatMs ||
        prefixoPromptPadrao.text != s.prefixoPromptPadrao ||
        usarGitBashNoWindows.isSelected != s.usarGitBashNoWindows ||
        gitBashPath.text.trim() != s.gitBashPath ||
        diretorioAgentesWorkspace.text.trim() != s.diretorioAgentesWorkspace ||
        diretorioAgentesGlobal.text.trim() != s.diretorioAgentesGlobal ||
        diretorioSkillsWorkspace.text.trim() != s.diretorioSkillsWorkspace ||
        diretorioSkillsGlobal.text.trim() != s.diretorioSkillsGlobal ||
        incluirConteudoAgenteSkillNoPrompt.isSelected != s.incluirConteudoAgenteSkillNoPrompt
}
