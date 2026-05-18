# Release Checklist

## Build e validação

- [ ] `npm ci` (instalação limpa de dependências)
- [ ] `npm run compile` (sem erros TypeScript)
- [ ] `node -c out/extension.js` (sintaxe do JS compilado)
- [ ] `npm run validate:webview` (script embutido da webview: sintaxe, CSP, marcadores)
- [ ] `npm run test` (suite unitária: sanitizeModel, baseArgs, fullPrompt, webview syntax)
- [ ] `npm run release:check` (compila + valida webview + roda testes — atalho único)

## Versionamento

- [ ] `package.json` com a versão correta
- [ ] `package-lock.json` com a versão correta
- [ ] `README.md` — "Versão atual" atualizado
- [ ] `CHANGELOG.md` — entrada da versão criada

## Empacotamento

- [ ] `npm run package` (gera `devin-cli-chat-X.Y.Z.vsix`)
- [ ] `npm run validate:vsix` (estrutura, arquivos proibidos, versão interna, tamanho)
- [ ] VSIX < 5 MB
- [ ] VSIX não inclui `node_modules/`
- [ ] VSIX não inclui `source/`
- [ ] VSIX não inclui VSIX aninhado
- [ ] VSIX não inclui `_old/`

## Smoke test manual

- [ ] Instalar VSIX: `Ctrl+Shift+P` → **Extensions: Install from VSIX…**
- [ ] Recarregar janela: **Developer: Reload Window**
- [ ] Painel abre sem erro no console (`Ctrl+Shift+I`)
- [ ] **Histórico** (botão ◷) abre lista
- [ ] **Nova conversa** (botão +) reseta sessão
- [ ] **Atualizar modelos** (botão ↺) não trava
- [ ] **Botão i** → verifica Devin CLI sem sair do painel
- [ ] **Terminal** (botão ⌁) abre terminal com comando correto
- [ ] **Seletor de modelo** abre e fecha sem erro
- [ ] **Seletor de agente** abre e fecha sem erro
- [ ] **Seletor de modo** (Integrado / Terminal) funciona
- [ ] **Skills** abre sem erro
- [ ] **Anexar** abre browser de arquivos
- [ ] **Enviar** com texto → `is-busy` ativo, botão × aparece
- [ ] **Cancelar (×)** durante execução → retorna mensagem de cancelamento
- [ ] Tecla **Enter** (sem Shift) envia prompt
- [ ] **Shift+Enter** insere nova linha sem enviar

## Pos-release

- [ ] `git tag vX.Y.Z` (tag local, sem push)
- [ ] Verificar que `.vscodeignore` exclui `scripts/`, `test/`, `RELEASE_CHECKLIST.md`
- [ ] Arquivar VSIX em local seguro antes de limpar

---

## Release Candidate (1.0.0-rc.N)

- [ ] `package.json` com `"preview": true`
- [ ] Versão SemVer com sufixo `-rc.N`
- [ ] `CHANGELOG.md` com lista de features cobertas e limitações conhecidas
- [ ] README com banner de RC
- [ ] Smoke test em VS Code estável E VS Code Insiders
- [ ] Instalar sobre versão anterior e verificar settings preservados
- [ ] Desinstalar e reinstalar limpo

---

## Troubleshooting — botões não respondem após instalação

1. Abrir **Developer: Toggle Developer Tools** (`Ctrl+Shift+I`)
2. Verificar aba **Console** por `SyntaxError` ou `ReferenceError`
3. Verificar **View → Output → Devin Cli Chat** por erros do host
4. Reinstalar VSIX com `--force`: `code --install-extension devin-cli-chat-X.Y.Z.vsix --force`
5. Executar **Developer: Reload Window**
6. Se persistir: reportar em https://github.com/lferrarezi/Devin-Cli_Chat/issues com o log do console
