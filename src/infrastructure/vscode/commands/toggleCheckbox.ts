import * as vscode from 'vscode';

const strikethroughDecoration = vscode.window.createTextEditorDecorationType({
  textDecoration: 'line-through',
});

/**
 * Applica la decorazione "line-through" ai task completati nel documento attivo.
 */
export function strikethroughApply(): void {
  const editor = vscode.window.activeTextEditor;
  if (!editor) return;

  const doc = editor.document;
  const decorations: vscode.DecorationOptions[] = [];

  for (let i = 0; i < doc.lineCount; i++) {
    const lineText = doc.lineAt(i).text;
    const match = /^(\s*)- \[X\](.*)$/.exec(lineText);
    if (match) {
      const indent = match[1];
      const start = new vscode.Position(i, indent.length + 6); // dopo "- [X] "
      const end = new vscode.Position(i, lineText.length);
      decorations.push({ range: new vscode.Range(start, end) });
    }
  }

  editor.setDecorations(strikethroughDecoration, decorations);
}

/**
 * Alterna lo stato della checkbox (completata/non completata) per le righe selezionate.
 */
export function toggleCheckbox(): void {
  const editor = vscode.window.activeTextEditor;
  if (!editor) return;

  const document = editor.document;
  const selections = editor.selections;

  editor.edit(editBuilder => {
    for (const selection of selections) {
      const line = document.lineAt(selection.active.line);
      const match = /^(\s*)- \[( |X)\](.*)$/.exec(line.text);

      if (match) {
        const indent = match[1];
        const state = match[2] === ' ' ? 'X' : ' ';
        const content = match[3];
        const newText = `${indent}- [${state}]${content}`;
        editBuilder.replace(line.range, newText);
      }
    }
  }).then(() => {
    // Applica le decorazioni dopo aver modificato il documento
    strikethroughApply();
  });
}