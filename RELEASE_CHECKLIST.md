# Checklist de Release — Devin Cli Chat

Execute cada item antes de publicar uma nova versão.

## 1. Versões

- [ ] `Vscode/package.json` → `"version"` atualizado
- [ ] `JetBrains/build.gradle.kts` → `version` atualizado
- [ ] `JetBrains/src/main/resources/META-INF/plugin.xml` → `<version>` atualizado
- [ ] As três versões são **iguais**

## 2. Changelog

- [ ] `Vscode/CHANGELOG.md` tem entrada para a nova versão
- [ ] `JetBrains/plugin.xml` → `<change-notes>` tem entrada para a nova versão

## 3. Build VSCode

```bash
cd Vscode
npm install
npm run compile          # sem erros TypeScript
npm run package          # gera devin-cli-chat-X.Y.Z.vsix
```

- [ ] Compilação sem erros
- [ ] VSIX gerado com sucesso

## 4. Build JetBrains

```bash
cd JetBrains
JAVA_HOME=/caminho/jdk17 ./gradlew buildPlugin
```

- [ ] Build sem erros
- [ ] ZIP gerado em `build/distributions/devin-cli-chat-X.Y.Z.zip`

## 5. Smoke test VSCode

- [ ] Instalar VSIX: `Extensions: Install from VSIX…`
- [ ] `Devin Cli Chat: Verificar Devin CLI` → mostra versão do CLI
- [ ] Enviar mensagem simples no chat → resposta aparece
- [ ] Modo terminal: mensagem abre terminal com comando correto

## 6. Smoke test JetBrains

- [ ] Instalar ZIP via `Settings → Plugins → Install Plugin from Disk`
- [ ] Painel de chat abre sem erro
- [ ] Enviar mensagem simples → resposta aparece

## 7. Commit e push

```bash
git add -p          # revisar cada hunk
git commit -m "chore: bump to vX.Y.Z — <resumo>"
git push origin main
```

- [ ] Nenhum arquivo sensível ou temporário incluído
- [ ] Commit message descreve o que mudou

## 8. Release GitHub

```bash
gh release create vX.Y.Z \
  Vscode/devin-cli-chat-X.Y.Z.vsix \
  JetBrains/build/distributions/devin-cli-chat-X.Y.Z.zip \
  --title "vX.Y.Z" \
  --notes "..."
```

- [ ] Release criada com ambos os artefatos
- [ ] URL da release verificada no browser
