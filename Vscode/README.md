# Devin Cli Chat — VS Code

> **1.0.0 — Pre-release.** Esta versão é publicada como pre-release no VS Code Marketplace. Corresponde à `1.0.0-rc.2`. Estável para uso — reporte problemas em [Issues](https://github.com/lferrarezi/Devin-Cli_Chat/issues).

Painel de chat nativo para o **Devin CLI** dentro do VS Code.  
Interface em português brasileiro com suporte a modelos, agentes, skills, anexos e histórico.

## Instalação

1. Baixe o VSIX da [página de releases](https://github.com/lferrarezi/Devin-Cli_Chat/releases).
2. No VS Code: `Ctrl+Shift+P` → **Extensions: Install from VSIX…** → selecione o arquivo.
3. Recarregue a janela (`Ctrl+Shift+P` → **Developer: Reload Window**).

## Uso rápido

1. Abra uma pasta no VS Code.
2. Clique no ícone **Devin Cli Chat** na Activity Bar.
3. Escolha modelo, agente, modo e skills quando necessário.
4. Digite uma mensagem e pressione **Enter** ou o botão Enviar.

## Configurações principais

```json
{
  "devinCliChat.caminhoDevin": "devin",
  "devinCliChat.modeloAtual": "auto",
  "devinCliChat.modoExecucaoChat": "resposta-integrada",
  "devinCliChat.agenteAtual": "auto",
  "devinCliChat.prefixoPromptPadrao": "Responda em português brasileiro..."
}
```

## Modelos válidos

Use `auto` para deixar o Devin CLI escolher o modelo padrão — nesse caso a extensão não envia `--model`.  
Outros aliases aceitos: `sonnet`, `opus`, `swe`, `gpt`, `codex`, `adaptive`.  
Valores inválidos são convertidos para `auto` automaticamente.

## Diretórios padrão

| Recurso | Workspace | Global |
|---|---|---|
| Agentes | `.devin/agents` | `~/.config/devin/agents` |
| Skills | `.devin/skills` | `~/.config/devin/skills` |

## Modo de execução

- **Integrado** (`resposta-integrada`): executa `devin -p` e exibe a resposta no chat.
- **Terminal**: abre o terminal integrado com o comando pronto.

## Controles do painel

- **×** (botão no compositor): aparece durante execuções longas — clique para solicitar cancelamento. A resposta será `Execucao cancelada pelo usuario.`
- **i** (botão no cabeçalho): verifica se o Devin CLI está acessível sem sair do painel lateral.

Durante respostas longas, use o botão **×** para solicitar cancelamento; use **i** no cabeçalho para verificar o Devin CLI.

## Contexto automático do editor

Quando habilitado, o chat inclui automaticamente a seleção ativa ou, se não houver seleção, o arquivo aberto como contexto da pergunta. Se houver anexos manuais, o contexto automático não é adicionado para evitar duplicidade.

Uma referência compacta aparece na bolha do usuário: `📄 Contexto automático: arquivo.ts:10-25`.

Configurações:

| Configuração | Tipo | Padrão | Descrição |
|---|---|---|---|
| `devinCliChat.usarContextoEditorAutomatico` | boolean | `true` | Habilita/desabilita o contexto automático |
| `devinCliChat.limiteBytesContextoEditorAutomatico` | number | `200000` | Limite de bytes do arquivo. Arquivos maiores são truncados com aviso |
| `devinCliChat.modoContextoEditorAutomatico` | enum | `selecao-ou-arquivo` | `selecao-ou-arquivo`: usa seleção quando houver, senão arquivo; `somente-selecao`: só seleção; `somente-arquivo`: só arquivo aberto; `desativado`: nunca usa contexto automático |

## Log de diagnóstico

`View → Output` → selecione **Devin Cli Chat** para ver logs em tempo real.  
Ou execute `Devin Cli Chat: Verificar Devin CLI` na Command Palette — o Output abre automaticamente.

---

## Solução de problemas

### Painel abre, mas botões não respondem

1. Abra **Developer: Toggle Developer Tools** (`Ctrl+Shift+I`).
2. Verifique a aba **Console** por erros `SyntaxError` ou `ReferenceError`.
3. Verifique `View → Output → Devin Cli Chat` por erros do host.
4. Reinstale o VSIX com `--force`: `code --install-extension devin-cli-chat-X.Y.Z.vsix --force`.
5. Execute **Developer: Reload Window**.
6. Se persistir, abra uma issue em https://github.com/lferrarezi/Devin-Cli_Chat/issues com o log.

> Esta release inclui validação automática do script da webview que impede regressões desse tipo.

### Devin CLI não encontrado

1. Execute **Devin Cli Chat: Verificar Devin CLI** na Command Palette — o Output abre automaticamente.
2. Configure o caminho completo em `devinCliChat.caminhoDevin` (ex.: `/usr/local/bin/devin`).
3. Verifique se o executável está no PATH: abra o terminal integrado e execute `devin --version`.
4. No Windows com Git Bash, configure `devinCliChat.gitBashPath` ou `devinCliChat.usarGitBashNoWindows`.

### Modelo não reconhecido

1. Use `auto` — a extensão não envia `--model` e o Devin CLI usa o padrão local.
2. Execute **Devin Cli Chat: Atualizar modelos** para redescobrir modelos disponíveis.
3. Use **Devin Cli Chat: Definir modelo manual** para inserir um alias fora da lista padrão.
4. Verifique se o alias é aceito pelo seu Devin CLI com `devin model set <alias>` no terminal.

### Resposta não aparece no chat

1. Verifique o modo de execução — se for **Terminal**, a resposta não volta para o chat.
2. Aguarde o timeout (padrão 5 min) ou aumente `devinCliChat.timeoutChatMs`.
3. Verifique `View → Output → Devin Cli Chat` por erros de execução.
4. Confirme que `devinCliChat.caminhoDevin` aponta para o executável correto.

### Anexos não funcionam

1. Arquivos > 1 MB são ignorados — use pasta com arquivos menores.
2. Diretórios como `node_modules`, `.git`, `dist`, `build` são excluídos automaticamente.
3. É necessário ter uma pasta aberta no VS Code para o browser de workspace funcionar.
4. Para arquivos fora do workspace, use o botão **disco...** no browser de arquivos.

---

## Segurança

Esta extensão executa o Devin CLI localmente e não coleta dados. Arquivos anexados são incluídos no prompt enviado ao CLI — revise antes de enviar conteúdo sensível.

Consulte [SECURITY.md](SECURITY.md) para detalhes sobre CSP, logging, execução do CLI e modelo de ameaças.

---

## Desenvolvimento

### Pré-requisitos

- Node.js 18+
- VS Code 1.92+
- Devin CLI instalado e acessível no PATH

### Setup

```bash
cd Vscode
npm install
```

### Comandos

| Comando | Descrição |
|---|---|
| `npm run compile` | Compila TypeScript → `out/extension.js` |
| `npm run watch` | Compila em modo watch |
| `npm run test` | Roda suite de testes unitários (`test/unit.js`) |
| `npm run validate:webview` | Valida sintaxe e CSP do script embutido da webview |
| `npm run validate:vsix` | Valida estrutura e conteúdo do VSIX gerado |
| `npm run release:check` | Compila + valida webview + roda testes (gate único antes do package) |
| `npm run package` | Gera o VSIX (`devin-cli-chat-X.Y.Z.vsix`) |

### Testar em desenvolvimento

1. Abra a pasta `Vscode/` no VS Code.
2. Pressione `F5` — abre uma janela de extensão de desenvolvimento.
3. Ou instale o VSIX gerado: `npm run package` → instale via UI.

### Estrutura relevante

```
Vscode/
├── src/extension.ts   # código-fonte principal
├── out/extension.js   # saída compilada (versionada no repo)
├── media/             # ícones
├── package.json       # manifest da extensão
└── tsconfig.json      # configuração TypeScript
```

---

---

## Escopo da versão 1.0

A release 1.0 estabilizará a API pública da extensão e não introduzirá breaking changes após seu lançamento. Funcionalidades previstas para a 1.0 final, pendentes de feedback desta RC:

- Confirmação do contrato de modelos compatível com futuras versões do Devin CLI.
- Possível suporte a streaming de resposta (exibição incremental no chat).
- Documentação de configuração avançada (Windows / Git Bash, proxies corporativos).

Se algo não funcionar conforme esperado nesta RC, abra uma issue com logs do Output Channel (`View → Output → Devin Cli Chat`).

---

## Versão atual: 1.0.0 (pre-release)

Veja o [CHANGELOG](CHANGELOG.md) para histórico completo.
