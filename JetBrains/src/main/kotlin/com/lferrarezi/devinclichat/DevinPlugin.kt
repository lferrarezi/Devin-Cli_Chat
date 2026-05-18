package com.lferrarezi.devinclichat

object DevinPlugin {
    const val ID = "com.lferrarezi.devinclichat"
    const val NAME = "Devin Cli Chat"
    const val TOOL_WINDOW_ID = "DevinCliChat"
    val VALID_MODELS = listOf("auto", "sonnet", "opus", "swe", "gpt", "adaptive", "codex")
    val FALLBACK_MODELS = listOf("auto", "adaptive", "sonnet", "opus", "swe", "gpt", "codex")
}
