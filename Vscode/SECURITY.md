# Segurança e Privacidade

## Modelo de ameaças

Esta extensão é uma interface local para o **Devin CLI**. Ela:

- executa o Devin CLI como processo filho usando `child_process.execFile` (sem shell);
- passa o prompt do usuário como argumento `-p` protegido por aspas;
- lê arquivos do workspace apenas quando o usuário solicita explicitamente;
- persiste o histórico de chat via `ExtensionContext.globalState` (local, não sincronizado).

## Superfícies e mitigações

### Webview

| Risco | Mitigação |
|---|---|
| Execução de scripts injetados | Content Security Policy com `nonce` único por sessão; `script-src 'nonce-{nonce}'`; sem `unsafe-inline` ou `unsafe-eval` |
| XSS via nomes de arquivos/labels | Todos os dados de usuário (nomes de arquivo, labels, seleções) são inseridos via `textContent`, nunca por `innerHTML` |
| Mensagens postMessage maliciosas | Apenas tipos de mensagem esperados são processados; campos desconhecidos são ignorados |

### Execução do CLI

| Risco | Mitigação |
|---|---|
| Injeção de comandos | `execFile` não usa shell; modelo é validado por regex (`^[a-zA-Z0-9][a-zA-Z0-9._-]{1,80}$`) antes de ser passado como flag |
| Path traversal via config | Caminhos de config são expandidos com `path.join`; listagem de workspace respeita `ATTACH_SKIP_DIRS` |
| Modelos inválidos | `sanitizeModel()` rejeita valores fora do padrão, retornando `auto` |

### Logging

| O que é registrado | O que NÃO é registrado |
|---|---|
| Tamanho do prompt em chars | Conteúdo do prompt |
| Caminho configurado do executável | Conteúdo de arquivos anexados |
| Versão do CLI | Tokens ou credenciais |
| Erros resumidos | Chaves de API em stderr/stdout |
| Modo de execução | |

O Output Channel `Devin Cli Chat` pode mostrar fragmentos de `stderr`/`stdout` truncados (máximo 200–500 chars) para diagnóstico, nunca o prompt ou anexos completos.

## Dados enviados ao Devin CLI

Quando o usuário envia uma mensagem:

1. O **prefixo de prompt** configurado em `devinCliChat.prefixoPromptPadrao` é incluído.
2. O **contexto do workspace** (nome, diretório raiz, modelo, agente, skills) é incluído no prompt.
3. **Arquivos anexados** têm seu conteúdo incluído no prompt enviado ao CLI — revise antes de enviar.
4. **Pastas anexadas** podem incluir múltiplos arquivos; arquivos > 1 MB são ignorados; máximo 50 arquivos.
5. O Devin CLI pode transmitir dados para serviços externos conforme sua própria política de privacidade.

## Descoberta de modelos

Por padrão, a extensão busca modelos em:

- `~/.config/devin/config.json` (leitura local, sem rede);
- arquivos de cache locais do Devin CLI (`model_configs.bin`, `team_settings.bin`);
- lista de fallback interna.

O campo `devinCliChat.comandoDescobertaModelos` aceita um comando opcional para listar modelos. Ele **só é executado se explicitamente preenchido** pelo usuário.

## Histórico

O histórico de chat é armazenado localmente via `ExtensionContext.globalState`. Não é sincronizado entre máquinas pelo VS Code por padrão. Pode conter conteúdo de prompts anteriores — use `Devin Cli Chat: Limpar historico` para removê-lo.

## Como reportar vulnerabilidades

Abra uma issue em https://github.com/lferrarezi/Devin-Cli_Chat/issues com o label `security` ou envie e-mail para lferrarezi@gmail.com.

Não publique detalhes de exploração antes de uma correção estar disponível.

## Fora de escopo

- Ataques por um usuário mal-intencionado com acesso à própria máquina local.
- Comportamento do Devin CLI após receber o prompt (responsabilidade do Devin CLI).
- Conteúdo dos arquivos do workspace (responsabilidade do usuário ao selecionar anexos).
