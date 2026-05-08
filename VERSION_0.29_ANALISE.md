# Analise e escopo da versao 0.29.0

## Diagnostico sobre a build 0.28.0 anexada

A VSIX 0.28.0 contem `src/extension.ts`, mas parte do comportamento embarcado ainda estava desalinhado com o changelog informado:

- o seletor de modelo ainda possuia lock efetivo no backend/frontend;
- a arvore de modelos ainda continha nomes longos/legados de provedores e versoes;
- `auto` ainda era tratado como ausencia de modelo no gate inicial;
- anexos ainda eram renderizados no chat com o conteudo completo em alguns fluxos;
- pasta anexada ainda podia virar multiplos chips/itens de arquivo;
- o botao Anexar ainda acionava um browser customizado do workspace, nao o QuickPick nativo final;
- selecao do editor podia ser apagada ao perder foco por envio de payload nulo;
- warnings conhecidos de STDERR nao eram filtrados de forma centralizada.

## Decisao de produto para 0.29.0

A 0.29.0 foi tratada como uma release de consolidacao operacional, fechando gaps das linhas 0.26-0.28 e deixando a extensao mais aderente ao contrato real do Devin CLI.

## Alteracoes implementadas

1. **Contrato de modelos enxuto**
   - `VALID_MODELS = ['auto', 'sonnet', 'opus', 'swe', 'gpt']`.
   - `sanitizeModel()` converte qualquer valor legado ou invalido para `auto`.
   - O menu visual de modelos usa apenas os aliases reais.

2. **Seletor sem lock**
   - `setModel` nao bloqueia troca apos o primeiro envio.
   - O frontend nao desabilita o chip de modelo.
   - O badge de cadeado foi removido do markup.

3. **Gate inteligente**
   - `auto` passa a ser modelo valido.
   - O gate so bloqueia se nao houver modelo nenhum.

4. **Enviar resiliente**
   - O botao Enviar nao e desabilitado por `busy` no frontend.
   - O backend continua como fonte de verdade para concorrencia (`this.busy`).

5. **Split displayText/fullText**
   - `displayText`: mensagem compacta no chat, com referencias de anexos.
   - `fullText`: prompt completo enviado ao Devin CLI, com blocos de codigo.
   - Historico persiste o texto compacto e guarda `fullText` no payload da mensagem para auditoria local.

6. **Pasta como chip unico**
   - `readFolderItem()` cria item `type: 'folder'` com `files[]` aninhado.
   - O chip mostra `nome-da-pasta (N)`.
   - A expansao dos arquivos ocorre apenas no `fullText`.

7. **Anexar via QuickPick nativo**
   - Fluxo principal com duas opcoes: **Pastas** e **Arquivos abertos**.
   - Mantidos metodos legados internos para compatibilidade, mas o botao principal usa o QuickPick.

8. **Selecao do editor persistente**
   - `pushCurrentSelection()` nao envia mais `null` quando o editor perde foco.
   - Chip pendente inclui `x` para descarte explicito.

9. **STDERR limpo e erro guiado**
   - `cleanStderr()` remove warnings de migracao conhecidos.
   - `friendlyCliOutput()` gera instrucao objetiva para `No active model set in cog manager`.

## Validacao executada

- `node -c out/extension.js`
- sincronizacao manual de `src/extension.ts` para `out/extension.js`
- revisao de strings legadas de modelos longos no fluxo principal
- revisao de versionamento em `package.json`, `.vsixmanifest`, `README.md` e `CHANGELOG.md`

## Arquivos principais alterados

- `src/extension.ts`
- `out/extension.js`
- `package.json`
- `.vsixmanifest`
- `README.md`
- `CHANGELOG.md`
