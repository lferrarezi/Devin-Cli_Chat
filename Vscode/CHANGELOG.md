# Changelog

## 1.11.0

- Pre-release com nome exibido `Devin-Cli Chat for VS Code`.
- Remove o ajuste automatico que movia a Primary Sidebar do VS Code para a direita no primeiro uso.
- Adiciona checkbox de Bypass no composer, persistindo `devinCliChat.usarBypass` e enviando `--permission-mode dangerous` quando habilitado.
- Faz a interface e o prefixo padrao acompanharem o idioma do VS Code entre portugues e ingles.
- Documenta instalacao alternativa por linha de comando para ambientes corporativos onde o Marketplace falha ao baixar a assinatura do VSIX.

## 1.10.4

- Ajusta o nome exibido da nova publicacao do Marketplace para `Devin-Cli`.

## 1.10.3

- Ajusta o nome exibido da nova publicacao para `Devin Cli Chat VSCode`, necessario para publicar sob o owner `lferrarezi` sem conflitar com a publicacao antiga.

## 1.10.2

- Ajusta o ID tecnico da extensao para `devin-cli-chat-vscode`, necessario para publicar sob o novo publisher `lferrarezi`.
- Mantem o nome exibido como Devin Cli Chat.

## 1.10.1

- Altera o publisher do Marketplace VS Code para `lferrarezi`, usando o novo owner `Luiz Ferrarezi`.
- Mantem a versao final no canal estavel para validar instalacao em ambientes corporativos que bloqueavam o dominio antigo do publisher.

## 1.10.0

- Promove para canal final o pacote validado da série 1.9.x para novas instalações pelo Marketplace.
- Mantém as correções de pacote, descoberta de modelos, Effort dinâmico, anexos, agentes, skills, tools e chat integrado.
- Corrige a URL canônica do repositório nos metadados publicados.

## 1.9.8

- Corrige a descoberta de modelos para ignorar opções da CLI e arquivos de configuração como `permission-mode`, `prompt-file` e `config.json`.
- Filtra também modelos já persistidos em configuração local quando não parecem aliases/modelos reais.

## 1.9.7

- Adiciona seletor dinamico de Effort quando o Devin CLI local expõe `--effort` ou `--reasoning-effort`.
- Envia o Effort selecionado para a CLI apenas quando houver flag compatível, mantendo `auto` como opção de não forçar.
- Corrige o menu de modelos do painel para usar a lista descoberta localmente, sem depender da lista fixa do webview.

## 1.9.6

- O seletor de modelos passa a priorizar modelos descobertos do Devin CLI local do usuario.
- Aliases fixos ficam apenas como fallback quando nao houver descoberta local.
- Ao abrir o seletor de modelo, a extensao tenta atualizar a lista a partir do Devin CLI antes de mostrar as opcoes.

## 1.9.5

- Remove o seletor Integrado/Terminal do composer.
- Fixa o chat no modo integrado como comportamento unico.
- Remove o comando de selecionar modo de execucao.

## 1.9.4

- Troca o icone de Tools por uma chave inglesa.
- Mantem os botoes do composer com icone + texto tambem em telas estreitas, usando rolagem horizontal quando necessario.

## 1.9.3

- Adiciona importacao de arquivo Markdown como agente, copiando para `.devin/agents/<nome>/AGENT.md`.
- Adiciona suporte a tools selecionaveis e importaveis, usando `.devin/tools/<nome>/TOOL.md`.
- Adiciona seletor de tools no painel e na Command Palette.
- Inclui tools selecionadas no prompt enviado ao Devin CLI.

## 1.9.2

- Corrige erro ao enviar anexos com bytes nulos, removendo `\0` do prompt antes de chamar o Devin CLI.
- Adiciona sugestoes de slash commands ao digitar `/` no campo de mensagem.
- Adiciona sugestoes de arquivos do workspace ao digitar `@`, anexando o arquivo escolhido.
- Simplifica botoes de excluir/limpar historico no webview para evitar bloqueio por `confirm()`.

## 1.9.1

- Adiciona importacao de arquivo Markdown como skill pelo seletor de skills.
- O arquivo `.md` selecionado passa a ser copiado para o diretorio padrao de skills do workspace como `<nome-normalizado>/SKILL.md`.
- A skill importada e selecionada automaticamente e passa a aparecer na descoberta normal de skills.
- Adiciona acao equivalente no menu de skills do painel.
- Em primeira instalacao sem historico anterior, posiciona a Primary Sidebar do VS Code a direita para aproximar a experiencia de chat lateral.

## 1.9.0

- Pre-release acumulada com hardening do webview: nonce criptografico por renderizacao e validacao centralizada de mensagens recebidas do painel.
- Adiciona slash commands produtivos (`/review`, `/tests`, `/plan`, `/explain`, `/security`, `/docs`, `/commit-msg`) com expansao segura no backend.
- Adiciona exportacao de conversas em Markdown pela Command Palette e pelo historico.
- Amplia testes unitarios para 66 casos cobrindo nonce, validacao de mensagens, slash commands e exportacao.

## 1.0.1

- Reescreve o README para uso no GitHub e no VS Code Marketplace.
- Adiciona seção de pré-requisito do Devin CLI com instrução de verificação (`devin --version`) e link para documentação oficial.
- Remove seção "Escopo da versão 1.0" (conteúdo de RC, obsoleto na estável).
- Consolida instruções de instalação via Marketplace e via VSIX.
- Sem mudanças funcionais na extensão.

## 1.0.0

Release estável. Promovida da `1.0.0-rc.2` após período de RC sem regressões reportadas.

Mesmas funcionalidades da 1.0.0-rc.2 — veja entrada abaixo para o detalhamento completo.

## 1.0.0-rc.2

- Adiciona contexto automático do editor ativo: quando o usuário envia uma pergunta sem anexos manuais, a extensão inclui automaticamente a seleção ativa ou, se não houver seleção, o arquivo aberto como contexto do prompt enviado ao Devin CLI.
- Evita duplicidade: contexto automático não é adicionado quando há anexos manuais (`hasExplicitContext`).
- Adiciona configurações `devinCliChat.usarContextoEditorAutomatico`, `devinCliChat.modoContextoEditorAutomatico` e `devinCliChat.limiteBytesContextoEditorAutomatico`.
- Arquivo aberto maior que o limite é truncado com nota explícita e label `(truncado)`.
- Exibe referência compacta `📄 Contexto automatico: arquivo.ts:10-25` na bolha do usuário via `ctxHint`.
- Expande suite de testes para 55 (11 novos casos cobrindo todos os modos de contexto automático).
- Mantém todos os gates de validação: webview syntax, validate:vsix, release:check.

## 1.0.0-rc.1

Release candidate para a versão 1.0. Inclui todas as correções e melhorias das releases 0.36.1–0.38.0.

### Mudanças nesta release

- `deactivate()` agora chama `cancelIntegratedRun()` — cancela processos pendentes ao desativar a extensão.
- `"preview": true` adicionado ao `package.json` — sinaliza RC no Marketplace.
- `validate-vsix.js` agora verifica SemVer prerelease e flag `"preview": true` em releases candidate.
- `test/unit.js` agora inclui smoke test de `activate()` — verifica que subscriptions são registradas sem exceção.

### Funcionalidades cobertas (desde 0.9.0)

- Chat interativo com Devin CLI via `devin -p` (modo integrado e terminal).
- Seletor de modelo (`auto`, `sonnet`, `opus`, `swe`, `gpt`, `codex`, `adaptive`) com `auto` omitindo `--model`.
- Seletor de agente e skills com scan de `.devin/agents` e `.devin/skills`.
- Histórico de sessões com carregar, excluir e limpar.
- Anexos: arquivos abertos, seleção do editor, pastas do workspace.
- Cancelamento de execução longa via botão ×.
- Verificação de CLI via botão i no cabeçalho.
- Log de diagnóstico em `View → Output → Devin Cli Chat`.
- CSP nonce, XSS eliminado (`textContent`), `execFile` (sem shell injection).
- Suite de testes e validadores reproduzíveis (`validate:webview`, `validate:vsix`, `test`, `release:check`).

### Limitações conhecidas nesta RC

- Streaming de resposta não implementado — a resposta completa aparece de uma vez ao final.
- Modo terminal não retorna resposta para o painel de chat.
- Descoberta automática de modelos é local-only (sem execução de processos externos por padrão).

## 0.38.0

- Corrige 4 ocorrências de `innerHTML` com dados controlados por usuário (nomes de arquivo, labels, seleção do editor) — substituídas por construção DOM com `textContent`, eliminando risco de XSS.
- Promove warnings de innerHTML no `validate-webview.js` para erros (exit 1) — o validador agora falha se detectar dados de usuário em `innerHTML`.
- Adiciona `SECURITY.md`: modelo de ameaças, mitigações de CSP/XSS/execFile, política de logging e dados enviados ao Devin CLI.
- Adiciona seção de Troubleshooting no README: botões não respondem, CLI não encontrado, modelo não reconhecido, resposta não aparece, anexos.
- Adiciona seção de Segurança no README com link para `SECURITY.md`.

## 0.37.0

- Adiciona `scripts/validate-webview.js`: valida sintaxe do JavaScript embutido, CSP, delegação de cliques e marcadores obrigatórios — impede regressão como "painel abre sem botões".
- Adiciona `scripts/validate-vsix.js`: valida estrutura do VSIX, arquivos obrigatórios, ausência de `node_modules/` e `source/`, versão interna e tamanho.
- Adiciona `test/unit.js`: 43 testes unitários para `sanitizeModel`, `isSafeModelId`, `baseArgs` (incluindo que `auto` não envia `--model`), `fullPrompt`, `modelsForUi`, `scanAgents`, `scanSkills` e sintaxe do script da webview.
- Adiciona scripts `test`, `validate:webview`, `validate:vsix` e `release:check` em `package.json`.
- Cria `RELEASE_CHECKLIST.md` com checklist de build, versionamento, empacotamento, smoke test e troubleshooting.
- Expõe `sanitizeModel`, `isSafeModelId` e `cancelIntegratedRun` em `_internal` para uso nos testes.
- Adiciona `scripts/`, `test/`, `RELEASE_CHECKLIST.md` e `docs/` ao `.vscodeignore`.

## 0.36.1

- Corrige bug crítico: escapes `\n` dentro do bloco `<script>` da webview eram injetados como quebras de linha reais, causando `SyntaxError` e impedindo todos os botões de responder.
- Funções afetadas: `attachmentTextForTokens`, `attachmentFullBlock` e `sendPrompt` — todas as ocorrências de `'\n'` e `'\n\n'` convertidas para `'\\n'` e `'\\n\\n'`.

## 0.36.0

- Performance: cache de modelos (TTL configurável `cacheModelosMs`, padrão 30 min), agentes e skills (TTL 10 s) para reduzir leituras síncronas repetidas no refresh do painel.
- Novo botão **i** no cabeçalho do painel para verificar o Devin CLI sem sair da interface lateral.
- Novo botão **×** no compositor: aparece durante execuções integradas longas e solicita cancelamento.
- `auto` agora omite `--model` — o Devin CLI usa o padrão local configurado.
- `invalidateMetaCache()` chamado ao alterar configuração, executar refresh de modelos ou salvar configuração via `setConfig()`.

## 0.35.1

- Corrige JavaScript do webview: todos os botões do painel lateral agora funcionam via delegação `data-action`.
- `auto` passa a omitir `--model`, deixando o Devin CLI escolher o padrão local.
- Logging de erros do cliente webview: `window.onerror` e `unhandledrejection` são capturados e registrados no Output Channel `Devin Cli Chat`.

## 0.35.0

- Indicação de truncamento no prompt: pastas e arquivos truncados por limite de tamanho exibem nota explicativa enviada ao Devin CLI.
- JetBrains: `maxFilesPerFolder` separado de `maximoAnexos` como configuração independente.
- JetBrains: flag `truncated` corrigida em `readFolderItem` (estava sempre `false`).
- README reescrito: instruções de uso, configuração, dev setup e estrutura de arquivos.
- `RELEASE_CHECKLIST.md` criado na raiz do repositório.

## 0.34.1

- OutputChannel `Devin Cli Chat` adicionado: logs de ativação, webview, CLI e erros visíveis em `View → Output`.
- `Devin Cli Chat: Verificar Devin CLI` agora abre o Output automaticamente.

## 0.34.0

- Diretório padrão de skills corrigido para `.devin/skills` (padrão oficial do Devin CLI) em ambas as extensões.
- Script `npm run package` e devDependency `@vscode/vsce` adicionados ao VSCode.
- Caminho absoluto de JDK removido do `gradle.properties` JetBrains; substituído por instruções de configuração via `JAVA_HOME`.

## 0.33.0

- Corrige modo terminal: adiciona flag `-p` ao comando enviado ao Devin CLI, alinhando com o modo integrado.
- Remove `activationEvents` redundantes do `package.json` (gerados automaticamente pelo VS Code).
- Adiciona scripts de build (`compile`, `vscode:prepublish`, `watch`) e `devDependencies` de TypeScript.
- Garante rastreamento de `out/extension.js` no repositório.

## 0.32.0

- Licença atualizada para Apache 2.0 em ambas as extensões.
- Arquivo NOTICE criado com autor e repositório.

## 0.31.0

- Alinhamento de versão VSCode/JetBrains em 0.31.0.
- Correções: scroll do chat, rendering de blocos de código, metadados de sessão no histórico.

## 0.30.0

- Evolui o botao **Historico** do painel VS Code para persistir a sessao atual antes de abrir a lista.
- Adiciona acoes explicitas para carregar, excluir com confirmacao e limpar todo o historico.
- Ao excluir a sessao aberta ou limpar o historico, o chat reseta a conversa atual para evitar estado inconsistente.
- Adiciona o comando **Devin Cli Chat: Abrir historico** na Command Palette.
- Mantem `out/extension.js` sincronizado com `src/extension.ts` para o pacote VSIX carregar a implementacao atual.

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
