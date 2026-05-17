# Devin Cli Chat — VS Code

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

Aliases aceitos pelo Devin CLI: `auto`, `sonnet`, `opus`, `swe`, `gpt`.  
Valores inválidos são convertidos para `auto` automaticamente.

## Diretórios padrão

| Recurso | Workspace | Global |
|---|---|---|
| Agentes | `.devin/agents` | `~/.config/devin/agents` |
| Skills | `.devin/skills` | `~/.config/devin/skills` |

## Modo de execução

- **Integrado** (`resposta-integrada`): executa `devin -p` e exibe a resposta no chat.
- **Terminal**: abre o terminal integrado com o comando pronto.

## Log de diagnóstico

`View → Output` → selecione **Devin Cli Chat** para ver logs em tempo real.  
Ou execute `Devin Cli Chat: Verificar Devin CLI` na Command Palette — o Output abre automaticamente.

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

## Versão atual: 0.34.1

Veja o [CHANGELOG](CHANGELOG.md) para histórico completo.
