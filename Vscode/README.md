# Devin Cli Chat — VS Code

Painel de chat nativo para o **Devin CLI** dentro do VS Code, com interface em português brasileiro.  
Suporte a modelos, agentes, skills, anexos, histórico e contexto automático do editor.

---

## Pré-requisito: Devin CLI

Esta extensão é uma interface gráfica para o **Devin CLI** — o CLI precisa estar instalado e acessível no PATH da sua máquina antes de usar a extensão.

Verifique a instalação abrindo o terminal e executando:

```bash
devin --version
```

Para instalar o Devin CLI, consulte a [documentação oficial do Devin](https://docs.devin.ai).  
Se o executável não estiver no PATH, configure o caminho completo em `devinCliChat.caminhoDevin` (ex.: `/usr/local/bin/devin`).

---

## Instalação da extensão

**Via Marketplace** (recomendado):  
Pesquise **Devin Cli Chat** no VS Code Marketplace e clique em **Install**.

**Via VSIX** (manual):
1. Baixe o VSIX da [página de releases](https://github.com/lferrarezi/Devin-Cli_Chat/releases).
2. No VS Code: `Ctrl+Shift+P` → **Extensions: Install from VSIX…** → selecione o arquivo.
3. Recarregue a janela (`Ctrl+Shift+P` → **Developer: Reload Window**).

---

## Uso rápido

1. Abra uma pasta no VS Code.
2. Clique no ícone **Devin Cli Chat** na Activity Bar.
3. Escolha modelo, agente, modo e skills quando necessário.
4. Digite uma mensagem e pressione **Enter** ou o botão Enviar.

---

## Funcionalidades

- **Chat integrado**: executa `devin -p` e exibe a resposta no painel, sem sair do VS Code.
- **Contexto automático do editor**: inclui automaticamente a seleção ativa ou o arquivo aberto no prompt enviado ao CLI.
- **Modelos**: `auto`, `sonnet`, `opus`, `swe`, `gpt`, `codex`, `adaptive`.
- **Agentes e skills**: scan automático de `.devin/agents` e `.devin/skills` (workspace e global).
- **Anexos**: arquivos, seleção do editor, pastas do workspace.
- **Histórico de sessões**: salvar, carregar, excluir e limpar.
- **Cancelamento**: botão **×** no compositor durante execuções longas.
- **Diagnóstico**: botão **i** no cabeçalho verifica o Devin CLI sem sair do painel.

---

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

---

## Modelos válidos

Use `auto` para deixar o Devin CLI escolher o modelo padrão — a extensão não envia `--model`.  
Aliases aceitos: `sonnet`, `opus`, `swe`, `gpt`, `codex`, `adaptive`.  
Valores inválidos são convertidos para `auto` automaticamente.

---

## Diretórios de agentes e skills

| Recurso | Workspace | Global |
|---|---|---|
| Agentes | `.devin/agents` | `~/.config/devin/agents` |
| Skills | `.devin/skills` | `~/.config/devin/skills` |

---

## Modo de execução

- **Integrado** (`resposta-integrada`): executa `devin -p` e exibe a resposta no chat.
- **Terminal**: abre o terminal integrado com o comando pronto para execução manual.

---

## Contexto automático do editor

Quando habilitado, o chat inclui automaticamente a seleção ativa ou, se não houver seleção, o arquivo aberto como contexto da pergunta. Se houver anexos manuais, o contexto automático é omitido para evitar duplicidade.

Uma referência compacta aparece na bolha do usuário: `📄 Contexto automático: arquivo.ts:10-25`.

| Configuração | Tipo | Padrão | Descrição |
|---|---|---|---|
| `devinCliChat.usarContextoEditorAutomatico` | boolean | `true` | Habilita/desabilita o contexto automático |
| `devinCliChat.limiteBytesContextoEditorAutomatico` | number | `200000` | Limite de bytes. Arquivos maiores são truncados com aviso |
| `devinCliChat.modoContextoEditorAutomatico` | enum | `selecao-ou-arquivo` | `selecao-ou-arquivo` / `somente-selecao` / `somente-arquivo` / `desativado` |

---

## Log de diagnóstico

`View → Output` → selecione **Devin Cli Chat** para ver logs em tempo real.  
Ou execute **Devin Cli Chat: Verificar Devin CLI** na Command Palette — o Output abre automaticamente.

---

## Solução de problemas

### Devin CLI não encontrado

1. Verifique: abra o terminal integrado e execute `devin --version`.
2. Se não estiver no PATH, configure `devinCliChat.caminhoDevin` com o caminho completo (ex.: `/usr/local/bin/devin`).
3. No Windows com Git Bash, configure `devinCliChat.gitBashPath` ou habilite `devinCliChat.usarGitBashNoWindows`.
4. Execute **Devin Cli Chat: Verificar Devin CLI** na Command Palette para diagnóstico automático.

### Painel abre, mas botões não respondem

1. Abra **Developer: Toggle Developer Tools** (`Ctrl+Shift+I`) e verifique a aba **Console**.
2. Verifique `View → Output → Devin Cli Chat` por erros do host.
3. Reinstale com `--force`: `code --install-extension devin-cli-chat-X.Y.Z.vsix --force`.
4. Execute **Developer: Reload Window**.
5. Se persistir, abra uma [issue](https://github.com/lferrarezi/Devin-Cli_Chat/issues) com o log.

### Modelo não reconhecido

1. Use `auto` — a extensão não envia `--model` e o Devin CLI usa o padrão local.
2. Execute **Devin Cli Chat: Atualizar modelos** para redescobrir modelos disponíveis.
3. Use **Devin Cli Chat: Definir modelo manual** para inserir um alias fora da lista padrão.
4. Verifique se o alias é aceito com `devin model set <alias>` no terminal.

### Resposta não aparece no chat

1. Verifique o modo de execução — se for **Terminal**, a resposta não volta para o chat.
2. Aguarde o timeout (padrão 5 min) ou aumente `devinCliChat.timeoutChatMs`.
3. Verifique `View → Output → Devin Cli Chat` por erros de execução.

### Anexos não funcionam

1. Arquivos > 1 MB são ignorados — use pastas com arquivos menores.
2. Diretórios como `node_modules`, `.git`, `dist`, `build` são excluídos automaticamente.
3. É necessário ter uma pasta aberta no VS Code para o browser de workspace funcionar.

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

## Versão atual: 1.0.1

Veja o [CHANGELOG](CHANGELOG.md) para histórico completo.
