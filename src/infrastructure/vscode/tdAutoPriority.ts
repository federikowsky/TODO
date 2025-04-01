import * as vscode from 'vscode';

export function registerAutoPriority(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    vscode.workspace.onDidChangeTextDocument(async (event) => {
      const editor = vscode.window.activeTextEditor;
      if (!editor || event.document.languageId !== 'td') return;

      const changes = event.contentChanges;
      if (changes.length !== 1) return;

      const change = changes[0];
      const lineNumber = change.range.start.line;
      const line = event.document.lineAt(lineNumber).text;

      // Se non è un task standard appena scritto
      if (!line.match(/^-\s\[\s\]/)) return;

      // Cerca priorità nei defaults precedenti
      let priorityChar: '!' | '~' | ' ' | null = null;

      for (let i = lineNumber - 1; i >= 0; i--) {
        const prevLine = event.document.lineAt(i).text.trim();

        if (prevLine.startsWith('@defaults:')) {
          const match = prevLine.match(/@prio\((high|medium|low)\)/);
          if (match) {
            if (match[1] === 'high') priorityChar = '!';
            if (match[1] === 'medium') priorityChar = '~';
            if (match[1] === 'low') priorityChar = ' ';
          }
          break; // solo l’ultimo @defaults: conta
        }

        // Sezione o riga vuota blocca l'ereditarietà
        if (/^#/.test(prevLine) || prevLine.trim() === '') break;
      }

      if (!priorityChar) return; // nessun default attivo

    // Sostituisci [ ] → [~] o [!]
    //   const newText = line.replace('[ ]', `[${priorityChar}]`);

      const edit = new vscode.WorkspaceEdit();
      const range = new vscode.Range(lineNumber, 0, lineNumber, line.length);
      edit.replace(event.document.uri, range, line);
      await vscode.workspace.applyEdit(edit);
    })
  );
}