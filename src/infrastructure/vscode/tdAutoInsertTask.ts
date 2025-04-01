import * as vscode from 'vscode';

export function registerAutoInsertTask(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    vscode.workspace.onDidChangeTextDocument(async (event) => {
      const editor = vscode.window.activeTextEditor;
      if (!editor || editor.document.languageId !== 'td') return;

      const changes = event.contentChanges;
      if (changes.length !== 1) return;

      const change = changes[0];
      const insertedText = change.text;
      const position = change.range.start;

      // Attiva solo se è stato appena digitato "- " all'inizio o dopo spazi (supporta anche sub-task indentati)
      const linePrefix = event.document.lineAt(position.line).text.slice(0, position.character + 1);
      if (insertedText !== ' ' || !linePrefix.match(/^\s*-\s$/)) return;

      const lineNumber = position.line;
      const currentLine = event.document.lineAt(lineNumber).text;

      if (!currentLine.trimStart().startsWith('- ')) return;

      // Cerca @defaults attivo sopra
      let priorityChar: ' ' | '~' | '!' = ' ';
      for (let i = lineNumber - 1; i >= 0; i--) {
        const line = event.document.lineAt(i).text.trim();

        if (line.startsWith('@defaults:')) {
          const match = line.match(/@prio\((high|medium)\)/);
          if (match) {
            priorityChar = match[1] === 'high' ? '!' : '~';
          }
          break;
        }

        if (line.startsWith('#') || line === '') break;
      }

      // Costruisci la riga completa
      const indent = currentLine.match(/^(\s*)-/)?.[1] ?? '';
      const newText = `${indent}- [${priorityChar}] Todo`;

      const edit = new vscode.WorkspaceEdit();
      const range = new vscode.Range(lineNumber, 0, lineNumber, currentLine.length);
      edit.replace(event.document.uri, range, newText);
      await vscode.workspace.applyEdit(edit);

      // Seleziona la parola "Todo"
      const startChar = newText.indexOf('Todo');
      const endChar = startChar + 'Todo'.length;
      const selection = new vscode.Selection(
        new vscode.Position(lineNumber, startChar),
        new vscode.Position(lineNumber, endChar)
      );
      editor.selection = selection;
    })
  );
}