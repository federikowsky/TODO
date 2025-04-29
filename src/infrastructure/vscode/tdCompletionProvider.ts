import * as vscode from 'vscode';

// Helper per estrarre tag custom dal documento
function extractCustomTags(text: string): Set<string> {
  const tags = new Set<string>();
  const regex = /@(\w+)/g;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(text))) {
    tags.add(match[1]);
  }
  return tags;
}

const BUILTIN_COMPLETIONS = [
  { label: 'prio', insert: '@prio(${1|high,medium,none|})', detail: 'Priorità' },
  { label: 'due', insert: '@due(${1:YYYY-MM-DD})', detail: 'Scadenza' },
  { label: 'file', insert: '@file(${1:path/to/file:42})', detail: 'File + linea' },
];

export const tdCompletionProvider: vscode.CompletionItemProvider = {
  async provideCompletionItems(document, position) {
    const line = document.lineAt(position).text;
    const prefix = line.slice(0, position.character);
    const match = prefix.match(/@(\w*)$/);
    if (!match) return undefined;

    const typed = match[1];
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

    // Tag personalizzati
    const userTags = extractCustomTags(document.getText());
    for (const tag of userTags) {
      if (!BUILTIN_COMPLETIONS.some(b => b.label === tag) && tag.startsWith(typed)) {
        const s = new vscode.CompletionItem(`@${tag}`, vscode.CompletionItemKind.Keyword);
        s.insertText = new vscode.SnippetString(`@${tag}`);
        s.range = range;
        s.filterText = `@${tag}`;
        s.detail = 'Tag personalizzato';
        suggestions.push(s);
      }
    }

    return suggestions.length > 0 ? suggestions : undefined;
  }
};