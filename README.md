# Devin Cli Chat

Tela propria de chat para usar o Devin CLI dentro do VS Code.

## Versao 0.29.0

Esta versao consolida o contrato operacional iniciado nas releases 0.26-0.28:

- modelos reais do CLI: `auto`, `sonnet`, `opus`, `swe`, `gpt`;
- seletor de modelo sempre clicavel;
- `auto` tratado como modelo valido;
- anexos exibidos no chat como referencias compactas;
- conteudo completo enviado ao Devin CLI via `fullText`;
- pasta anexada como chip unico `pasta (N)`;
- QuickPick nativo para **Pastas** e **Arquivos abertos**;
- filtro de warnings de migracao no STDERR.

## Uso

1. Instale o VSIX ou abra este fonte em modo desenvolvimento no VS Code.
2. Abra uma pasta no VS Code.
3. Abra a Activity Bar **Devin Cli Chat**.
4. Escolha modelo, agente, modo e skills quando aplicavel.
5. Digite uma mensagem e pressione **Enviar** ou **Enter**.

## Configuracoes principais

```json
{
  "devinCliChat.caminhoDevin": "devin",
  "devinCliChat.modeloAtual": "auto",
  "devinCliChat.argumentoModelo": "--model",
  "devinCliChat.agenteAtual": "auto",
  "devinCliChat.modoExecucaoChat": "resposta-integrada"
}
```

## Modelos validos

A versao 0.29.0 sanitiza qualquer modelo legado ou invalido para `auto` antes de invocar o CLI.

Aliases aceitos:

- `auto`
- `sonnet`
- `opus`
- `swe`
- `gpt`

## Anexos

O chat renderiza apenas referencias, por exemplo:

```text
Implemente a melhoria X

📎 api.ts:10-42, 📎 src (18)
```

O Devin CLI recebe o prompt completo internamente, com blocos de codigo e todos os arquivos elegiveis da pasta anexada.

## Desenvolvimento

O arquivo de entrada da extensao e `out/extension.js`. O fonte editavel equivalente esta em `src/extension.ts`.
