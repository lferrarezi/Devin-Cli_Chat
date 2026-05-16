package com.lferrarezi.devinclichat.state

import com.intellij.openapi.components.PersistentStateComponent
import com.intellij.openapi.components.Service
import com.intellij.openapi.components.State
import com.intellij.openapi.components.Storage
import com.intellij.openapi.components.StoragePathMacros
import com.intellij.openapi.project.Project

@State(name = "DevinCliChatHistory", storages = [Storage(StoragePathMacros.WORKSPACE_FILE)])
@Service(Service.Level.PROJECT)
class ChatHistoryState : PersistentStateComponent<ChatHistoryState.State> {

    data class Message(
        var role: String = "user",
        var text: String = "",
        var fullText: String = "",
        var ts: Long = 0L
    )

    data class Session(
        var id: String = "",
        var title: String = "Nova conversa",
        var createdAt: Long = 0L,
        var updatedAt: Long = 0L,
        var model: String = "auto",
        var agent: String = "auto",
        var mode: String = "resposta-integrada",
        var skills: MutableList<String> = mutableListOf(),
        var messages: MutableList<Message> = mutableListOf()
    )

    data class State(
        var sessions: MutableList<Session> = mutableListOf()
    )

    private var myState = State()
    override fun getState(): State = myState
    override fun loadState(state: State) { myState = state }

    fun currentSession(): Session {
        if (myState.sessions.isEmpty()) newSession()
        return myState.sessions.last()
    }

    fun newSession(): Session {
        val session = Session(
            id = System.currentTimeMillis().toString(36),
            createdAt = System.currentTimeMillis(),
            updatedAt = System.currentTimeMillis()
        )
        myState.sessions.add(session)
        if (myState.sessions.size > MAX_SESSIONS) {
            myState.sessions.removeAt(0)
        }
        return session
    }

    fun addMessage(role: String, text: String, fullText: String = text) {
        val session = currentSession()
        session.messages.add(Message(role = role, text = text, fullText = fullText, ts = System.currentTimeMillis()))
        session.updatedAt = System.currentTimeMillis()
        if (session.title == "Nova conversa" && role == "user") {
            session.title = text.take(48).replace('\n', ' ')
        }
    }

    fun sessionsNewestFirst(): List<Session> =
        myState.sessions.sortedByDescending { it.updatedAt }

    fun loadSession(id: String): Session? {
        val index = myState.sessions.indexOfFirst { it.id == id }
        if (index < 0) return null
        val session = myState.sessions.removeAt(index)
        myState.sessions.add(session)
        return session
    }

    fun deleteSession(id: String) {
        myState.sessions.removeIf { it.id == id }
        if (myState.sessions.isEmpty()) newSession()
    }

    fun clearAll() {
        myState.sessions.clear()
        newSession()
    }

    companion object {
        const val MAX_SESSIONS = 50
        fun getInstance(project: Project): ChatHistoryState =
            project.getService(ChatHistoryState::class.java)
    }
}
