package com.lferrarezi.devinclichat.settings

import com.intellij.openapi.application.ApplicationManager
import com.intellij.openapi.components.PersistentStateComponent
import com.intellij.openapi.components.Service
import com.intellij.openapi.components.State
import com.intellij.openapi.components.Storage

@State(name = "DevinCliChatSettings", storages = [Storage("devinCliChat.xml")])
@Service(Service.Level.APP)
class DevinSettings : PersistentStateComponent<DevinSettings.State> {

    data class State(
        var caminhoDevin: String = "devin",
        var argumentosPadrao: MutableList<String> = mutableListOf(),
        var modeloAtual: String = "auto",
        var argumentoModelo: String = "--model",
        var agenteAtual: String = "auto",
        var modoExecucaoChat: String = "resposta-integrada",
        var timeoutChatMs: Long = 300_000L,
        var prefixoPromptPadrao: String = "Responda em português brasileiro. Seja objetivo, cite arquivos concretos e priorize impacto produtivo, segurança, testes e rollback.",
        var usarGitBashNoWindows: Boolean = true,
        var gitBashPath: String = "",
        var nomeTerminal: String = "Devin Cli Chat",
        var diretorioAgentesWorkspace: String = ".devin/agents",
        var diretorioAgentesGlobal: String = "~/.config/devin/agents",
        var diretorioSkillsWorkspace: String = ".devin/skills",
        var diretorioSkillsGlobal: String = "~/.config/devin/skills",
        var skillsSelecionadas: MutableList<String> = mutableListOf(),
        var incluirConteudoAgenteSkillNoPrompt: Boolean = true,
        var limiteBytesArquivoMd: Long = 65_536L,
        var maximoAnexos: Int = 10,
        var limiteBytesAnexo: Long = 524_288L,
        var modelosDisponiveis: MutableList<String> = mutableListOf(),
        var timeoutDescobertaModelosMs: Long = 2_500L,
        var cacheModelosMs: Long = 1_800_000L
    )

    private var myState = State()

    override fun getState(): State = myState
    override fun loadState(state: State) { myState = state }

    companion object {
        fun getInstance(): DevinSettings =
            ApplicationManager.getApplication().getService(DevinSettings::class.java)
    }
}
