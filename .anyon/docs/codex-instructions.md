# ANYON Method - Codex Instructions

## Activating Agents

ANYON agents, tasks and workflows are installed as custom prompts in
`$CODEX_HOME/prompts/anyon-*.md` files. If `CODEX_HOME` is not set, it
defaults to `$HOME/.codex/`.

### Examples

```
/anyon-anyon-method-agents-dev - Activate development agent
/anyon-anyon-method-agents-architect - Activate architect agent
/anyon-anyon-method-workflows-dev-story - Execute dev-story workflow
```

### Notes

Prompts are autocompleted when you type /
Agent remains active for the conversation
Start a new conversation to switch agents
