import * as vscode from 'vscode';

const BUILTIN_COMPLETIONS = [
  { label: 'prio', insert: '@prio(${1|high,medium,none|})', detail: 'Priorità' },
  { label: 'due', insert: '@due(${1:YYYY-MM-DD})', detail: 'Scadenza' },
  { label: 'file', insert: '@file(${1:path/to/file:42})', detail: 'File + linea' },
  { label: 'keybinding', insert: '@keybinding(${1:ctrl+shift+x})', detail: 'Shortcut personalizzata' },
];

export const tdCompletionProvider: vscode.CompletionItemProvider = {
  async provideCompletionItems(document, position) {
    const line = document.lineAt(position).text;
    const prefix = line.slice(0, position.character);

    const match = prefix.match(/@(\w*)$/); // matcha anche @ o @pr
    if (!match) return undefined;

    const typed = match[1]; // "prio", "du", ecc.
    // Tag personalizzati già presenti nel file
    const tagRegex = /@(\w+)/g;
    const userTags = new Set<string>();
    
    const suggestions: vscode.CompletionItem[] = [];

    const startPos = position.translate(0, -typed.length - 1);
    const range = new vscode.Range(startPos, position);

    // Built-in tag
    for (const item of BUILTIN_COMPLETIONS) {
      if (item.label.startsWith(typed)) {
        const s = new vscode.CompletionItem(`@${item.label}`, vscode.CompletionItemKind.Function);
        s.insertText = new vscode.SnippetString(item.insert);
        s.range = range;
        s.filterText = `@${item.label}`;
        s.detail = item.detail;
        suggestions.push(s);
      }
    }

    // Custom tags
    for (const tag of Array.from(userTags)) {
      if (tag.startsWith(typed)) {
        const s = new vscode.CompletionItem(`@${tag}`, vscode.CompletionItemKind.Keyword);
        s.insertText = new vscode.SnippetString(tag); // solo tag, non con @
        s.range = range;
        s.filterText = `@${tag}`;
        s.detail = 'Tag personalizzato';
        suggestions.push(s);
      }
    }

    return suggestions.length > 0 ? suggestions : undefined;
  }
};