// src/config/color.ts

export const configSnippet = `
"editor.tokenColorCustomizations": {
  "textMateRules": [
    {
      "scope": "markup.task.urgent.high.td",
      "settings": { "foreground": "#FF0000" } // 🔴 Priorità alta
    },
    {
      "scope": "markup.task.urgent.medium.td",
      "settings": { "foreground": "#FFA500" } // 🟠 Priorità media
    },
    {
      "scope": "markup.task.todo.normal.td",
      "settings": { "foreground": "#FFFFFF" } // ⚪ Neutro
    },
    {
      "scope": "markup.line.task.done.td",
      "settings": { "foreground": "#808080" } // ✅ Completato
    },
    {
      "scope": "entity.name.tag.td",
      "settings": { "foreground": "#56B6C2" } // 🟦 Tag semplici
    },
    {
      "scope": "support.function.meta.td",
      "settings": { "foreground": "#C586C0" } // 🟪 Tag con argomenti
    },
    {
      "scope": "markup.note.blockquote.td",
      "settings": {
        "foreground": "#9CDCFE", // Azzurro
        "fontStyle": "italic"
      }
    },
    {
      "scope": "comment.line.double-slash.td",
      "settings": {
        "foreground": "#6A9955", // Verde
        "fontStyle": "italic"
      }
    },
    {
      "scope": "markup.heading.td",
      "settings": {
        "foreground": "#E06C75",
        "fontStyle": "bold"
      }
    }
  ]
}
`;