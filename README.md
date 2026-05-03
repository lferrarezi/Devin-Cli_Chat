# Devin Cli Chat

Tela propria de chat para usar o Devin CLI dentro do VS Code.

## Versao 0.21.0

Esta versao mantem o layout e o icone da versao funcional anterior e adiciona suporte operacional a:

- anexar arquivos ao prompt;
- selecionar e aplicar agentes `AGENT.md`;
- selecionar e aplicar skills Markdown `SKILL.md`;
- mencionar agentes com `@nome-do-agente` no prompt;
- mencionar skills com `#nome-da-skill` no prompt;
- executar o Devin com o fluxo funcional `devin -p -- "<prompt>"`.

## Uso

1. Instale o VSIX.
2. Abra uma pasta no VS Code.
3. Abra a Activity Bar **Devin Cli Chat**.
4. Selecione modelo, agente e skills quando necessario.
5. Anexe arquivos pelo botao de clipe.
6. Digite uma mensagem e pressione **Enviar** ou **Enter**.

## Agentes

A extensao procura agentes em:

```text
.devin/agents/<nome>/AGENT.md
.agents/agents/<nome>/AGENT.md
.claude/agents/*.md
~/.config/devin/agents/<nome>/AGENT.md
%APPDATA%\devin\agents\<nome>\AGENT.md
```

Quando um agente e selecionado ou mencionado com `@nome`, o conteudo do `AGENT.md` e incluido no prompt enviado ao Devin CLI.

## Skills

A extensao procura skills em:

```text
.devin/skills/<nome>/SKILL.md
.skills/*.md
.agents/skills/*.md
.claude/skills/*.md
~/.config/devin/skills/<nome>/SKILL.md
%APPDATA%\devin\skills\<nome>\SKILL.md
```

Quando uma skill e selecionada ou mencionada com `#nome`, o conteudo do Markdown e incluido no prompt.

## Configuracoes principais

```json
{
  "devinCliChat.caminhoDevin": "devin",
  "devinCliChat.modeloAtual": "auto",
  "devinCliChat.agenteAtual": "auto",
  "devinCliChat.skillsAtuais": [],
  "devinCliChat.modoExecucaoChat": "resposta-integrada",
  "devinCliChat.limiteBytesAnexo": 524288,
  "devinCliChat.maximoAnexos": 10,
  "devinCliChat.limiteBytesArquivoMd": 65536
}
```
# Devin-Cli-Chat
