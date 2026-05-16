package com.lferrarezi.devinclichat.prompt

sealed class AttachmentItem {
    abstract val id: String
    abstract val label: String

    data class FileItem(
        override val id: String,
        override val label: String,
        val filePath: String,
        val relativePath: String,
        val language: String,
        val content: String,
        val size: Long,
        val truncated: Boolean,
        val binary: Boolean
    ) : AttachmentItem()

    data class FolderItem(
        override val id: String,
        override val label: String,
        val folderPath: String,
        val files: List<FolderFile>,
        val truncated: Boolean
    ) : AttachmentItem() {
        data class FolderFile(
            val filePath: String,
            val relativePath: String,
            val language: String,
            val content: String,
            val size: Long,
            val binary: Boolean
        )
    }

    data class SelectionItem(
        override val id: String,
        override val label: String,
        val filePath: String,
        val relativePath: String,
        val language: String,
        val startLine: Int,
        val endLine: Int,
        val content: String
    ) : AttachmentItem()
}
