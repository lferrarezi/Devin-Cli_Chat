# Changelog

## 0.29.0

- Consolida o contrato real de modelos aceito pelo Devin CLI: `auto`, `sonnet`, `opus`, `swe`, `gpt`.
- Adiciona `sanitizeModel()` em todos os fluxos de selecao/configuracao: valores legados ou invalidos sao convertidos para `auto` antes de chegar ao CLI.
- Remove o lock efetivo do seletor de modelo: o chip permanece clicavel durante toda a conversa; a concorrencia segue controlada no backend.
- Corrige o gate de primeira mensagem para tratar `auto` como modelo valido, evitando bloqueio artificial do envio.
- Botao Enviar deixa de depender do estado `busy` do frontend; o backend continua impedindo execucoes concorrentes.
- Reimplementa `displayText` vs `fullText` no envio:
  - `displayText` mantém o chat enxuto com referencias de anexos.
  - `fullText` envia ao Devin CLI o prompt completo com codigo e arquivos anexados.
- Pasta anexada passa a trafegar como chip unico `pasta (N)`, com `files[]` aninhado, expandido somente no `fullText` enviado ao CLI.
- Botao **Anexar** usa QuickPick nativo com duas rotas principais: **Pastas** e **Arquivos abertos**.
- Selecao pendente do editor nao e mais apagada quando o foco sai do editor; o chip pendente inclui acao explicita para descartar.
- Filtra warnings ruidosos de migracao no STDERR e exibe mensagem operacional quando o CLI retorna `No active model set in cog manager`.


## 0.20.0

- Reimplementa o fluxo dos botões e do chat com caminho funcional baseado na versão 0.5.0.
- Mantém layout e ícone.
- Adiciona testes automatizados para envio, botões, seleção de modelo/agente e chamada `devin -p`.


## 0.19.0

- Mantem layout e icone da versao anterior.
- Reescreve a camada de eventos do webview para garantir funcionamento dos botoes.
- Corrige o envio por clique e por Enter sem bloquear digitacao no textarea.
- O chat renderiza a mensagem do usuario imediatamente e envia ao backend com controle de eco para evitar duplicidade.
- Revisa os botoes: Enviar, Nova conversa, Atualizar modelos, Terminal, Contexto do editor, Modelo manual, seletores e cards rapidos.
- Mantem a chamada funcional ao Devin CLI via `devin -p -- <prompt>`, recuperando o comportamento validado na versao 0.5.0.

## 0.18.0

- Mantem layout e icone da versao anterior.
- Corrige o botao Enviar no painel proprio.
- Revisa os handlers dos botoes Nova conversa, Atualizar modelos, Terminal, Contexto do editor, Modelo manual, starters, seletores de modelo/agente e envio por Enter.
- Adiciona tratamento de erro no webview para evitar estado ocupado preso.
- O botao de contexto do editor passa a inserir o contexto no composer, sem disparar envio automatico.


## 0.17.0

- Corrige travamento visual em `Workspace: carregando`.
- A primeira renderização da tela agora usa metadados locais imediatos.
- A leitura de agentes/modelos roda depois da renderização inicial.
- Layout e ícones preservados.

## 0.16.0

- Mantem layout e icone da versao anterior.
- Corrige estado preso em "detectando modelos...".
- A leitura de modelos passa a iniciar em segundo plano apos a primeira renderizacao da tela.
- A descoberta padrao fica local-only: config.json, team_settings.bin, model_configs.bin, cache da extensao e fallback manual.
- Nao executa `devin acp` nem comandos externos para listar modelos por padrao.

## 0.15.0

- Mantem layout e icone da versao anterior sem alteracoes.
- Substitui a leitura textual/fuzzy dos caches por parser protobuf local.
- Interpreta model_configs.bin como lista de configs: registro top-level field 1; id do modelo no field 22; nome amigavel no field 1.
- Interpreta team_settings.bin como allowlist/cache de equipe: modelos nos fields 7 e 26.
- Nao edita arquivos .bin e nao inicia processos do Devin CLI por padrao.

## 0.14.0

- Mantido layout e icone da versao anterior.
- Corrigida descoberta de modelos para evitar travamento persistente.
- A extensao agora le `agent.model` em `%APPDATA%\devin\config.json` quando `devinCliChat.modeloAtual` nao foi configurado no VS Code.
- A lista de modelos e extraida em modo somente leitura de `%LOCALAPPDATA%\Devin\CLI\model_configs.bin` e `%LOCALAPPDATA%\Devin\CLI\team_settings.bin`.
- `devin acp` e outros comandos externos continuam opt-in.


## 0.13.0

- Mantido layout e ícone da versão anterior.
- Corrigido travamento na detecção de modelos.
- `devin acp` deixou de ser executado por padrão.
- O seletor usa cache, configuração local, `auto` e modelos manuais.
- Consulta externa ao CLI agora é opt-in por configuração explícita.


## 0.12.0

- Mantido layout e icone da versao 0.11.0, sem alteracoes visuais.
- Descoberta de modelos ajustada para nao travar o seletor nem a tela.
- Reducao do timeout padrao por tentativa para 3 segundos.
- Adicionado orcamento total de descoberta por ciclo.
- Encerramento forcado de subprocessos `devin acp`/fallbacks em caso de timeout.
- Removidos fallbacks legados por padrao; podem ser reativados em `devinCliChat.tentarComandosLegadosDescobertaModelos`.
- Seletor de modelos abre imediatamente com cache, config local ou `auto`, mesmo enquanto a descoberta roda em background.

## 0.11.0

- Icone da extensao atualizado a partir da imagem fornecida.
- `package.json` agora aponta `icon` para `media/devin-cli-chat.png`.
- Activity Bar passa a usar `media/devin-cli-chat-activity.svg`, derivado do mesmo conceito visual.
- Pacote VSIX atualizado para exibir a identidade visual `Devin Cli Chat` na lista de extensoes.


## 0.10.0

- Redesenho completo da tela propria de chat.
- Composer inferior com seletores de modelo e agente, inspirado no fluxo de extensoes agentic modernas.
- Remocao de qualquer dependencia da tela nativa Chat do VS Code.
- Area de conversa mais limpa, sem cards grandes para cada resposta.
- Acoes rapidas para revisar diff, planejar tarefa, explicar contexto e abrir sessao terminal.
- Instrucoes de instalacao limpa para remover participantes legados `iuDevaChat`.

## 0.9.0

- Descoberta automatica de modelos via Devin CLI, com uso de ACP quando disponivel.
