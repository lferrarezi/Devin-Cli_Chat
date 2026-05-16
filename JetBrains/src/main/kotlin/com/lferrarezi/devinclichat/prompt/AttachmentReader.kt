package com.lferrarezi.devinclichat.prompt

import com.lferrarezi.devinclichat.settings.DevinSettings
import java.io.File

object AttachmentReader {

    private val BINARY_EXTENSIONS = setOf(
        "png", "jpg", "jpeg", "gif", "bmp", "ico", "svg", "webp",
        "pdf", "zip", "tar", "gz", "jar", "class", "exe", "dll", "so", "dylib",
        "mp3", "mp4", "mov", "avi", "wav", "db", "sqlite", "bin", "dat"
    )

    fun readFileItem(file: File, projectBasePath: String?): AttachmentItem.FileItem? {
        return try {
            val limit = DevinSettings.getInstance().state.limiteBytesAnexo
            val ext = file.extension.lowercase()
            val isBinary = ext in BINARY_EXTENSIONS
            val relativePath = relativePath(file.path, projectBasePath)
            val language = languageFromExt(ext)
            val size = file.length()
            if (isBinary) {
                return AttachmentItem.FileItem(
                    id = nextId(), label = file.name, filePath = file.path,
                    relativePath = relativePath, language = language,
                    content = "", size = size, truncated = false, binary = true
                )
            }
            val bytes = file.readBytes()
            val truncated = bytes.size > limit
            val content = bytes.take(limit.toInt()).toByteArray().toString(Charsets.UTF_8)
            AttachmentItem.FileItem(
                id = nextId(), label = file.name, filePath = file.path,
                relativePath = relativePath, language = language,
                content = content, size = size, truncated = truncated, binary = false
            )
        } catch (_: Exception) { null }
    }

    fun readFolderItem(folder: File, projectBasePath: String?): AttachmentItem.FolderItem? {
        return try {
            val limit = DevinSettings.getInstance().state.limiteBytesAnexo
            val maxFiles = DevinSettings.getInstance().state.maximoAnexos
            val files = folder.walkTopDown()
                .filter { it.isFile }
                .take(maxFiles)
                .mapNotNull { f ->
                    val ext = f.extension.lowercase()
                    val isBinary = ext in BINARY_EXTENSIONS
                    val rel = relativePath(f.path, folder.path)
                    val lang = languageFromExt(ext)
                    val size = f.length()
                    if (isBinary) {
                        AttachmentItem.FolderItem.FolderFile(f.path, rel, lang, "", size, true)
                    } else {
                        val bytes = try { f.readBytes() } catch (_: Exception) { return@mapNotNull null }
                        val content = bytes.take(limit.toInt()).toByteArray().toString(Charsets.UTF_8)
                        AttachmentItem.FolderItem.FolderFile(f.path, rel, lang, content, size, false)
                    }
                }
                .toList()
            val label = "${folder.name} (${files.size})"
            AttachmentItem.FolderItem(
                id = nextId(), label = label,
                folderPath = folder.path, files = files, truncated = false
            )
        } catch (_: Exception) { null }
    }

    private fun relativePath(filePath: String, basePath: String?): String {
        if (basePath == null) return filePath
        return try {
            File(filePath).relativeTo(File(basePath)).path
        } catch (_: Exception) { filePath }
    }

    private fun languageFromExt(ext: String): String = when (ext) {
        "kt", "kts" -> "kotlin"
        "java" -> "java"
        "py" -> "python"
        "js", "mjs" -> "javascript"
        "ts", "tsx" -> "typescript"
        "jsx" -> "jsx"
        "json" -> "json"
        "xml" -> "xml"
        "html", "htm" -> "html"
        "css", "scss", "sass" -> "css"
        "md", "markdown" -> "markdown"
        "sh", "bash", "zsh" -> "bash"
        "yml", "yaml" -> "yaml"
        "toml" -> "toml"
        "rs" -> "rust"
        "go" -> "go"
        "rb" -> "ruby"
        "php" -> "php"
        "swift" -> "swift"
        "cpp", "cc", "cxx" -> "cpp"
        "c", "h" -> "c"
        "cs" -> "csharp"
        "sql" -> "sql"
        "dockerfile", "Dockerfile" -> "dockerfile"
        else -> ext.ifBlank { "text" }
    }

    private val counter = java.util.concurrent.atomic.AtomicLong(0)
    private fun nextId(): String = "${System.currentTimeMillis().toString(36)}-${counter.getAndIncrement()}"
}
