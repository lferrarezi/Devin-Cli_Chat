package com.lferrarezi.devinclichat.ui

import com.intellij.ui.JBColor
import com.intellij.util.ui.UIUtil
import java.awt.Color

object MessageRenderer {

    fun toHtml(text: String, isUser: Boolean): String {
        val fg = UIUtil.getLabelForeground()
        val codeBg = if (JBColor.isBright()) "#f0f0f0" else "#2b2b2b"
        val codeFg = if (JBColor.isBright()) "#1a1a1a" else "#a9b7c6"
        val fgHex = colorToHex(fg)

        val sb = StringBuilder()
        sb.append("""<html><body style="font-family:sans-serif;font-size:12px;color:$fgHex;margin:0;padding:0;">""")

        val parts = text.split(Regex("```([a-zA-Z0-9]*)\n?"))
        var inCode = false
        for ((i, part) in parts.withIndex()) {
            if (i % 2 == 0) {
                val escaped = part.htmlEscape()
                    .replace("\n", "<br/>")
                    .replace("  ", "&nbsp;&nbsp;")
                if (escaped.isNotBlank()) sb.append(escaped)
            } else {
                val lang = if (i == 1 && part.lines().first().run { isNotBlank() && !contains(' ') }) {
                    part.lines().first()
                } else ""
                val code = if (lang.isNotBlank()) part.lines().drop(1).joinToString("\n") else part
                sb.append("""<pre style="background:$codeBg;color:$codeFg;padding:8px 10px;border-radius:4px;margin:4px 0;overflow:auto;font-family:monospace;font-size:11px;"><code>""")
                sb.append(code.htmlEscape())
                sb.append("</code></pre>")
                inCode = !inCode
            }
        }
        sb.append("</body></html>")
        return sb.toString()
    }

    private fun String.htmlEscape(): String = this
        .replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
        .replace("\"", "&quot;")

    private fun colorToHex(c: Color): String =
        "#%02x%02x%02x".format(c.red, c.green, c.blue)
}
