import * as vscode from 'vscode';

export async function applyDefaultsToBlock() {
  const editor = vscode.window.activeTextEditor;
  if (!editor || editor.document.languageId !== 'td') return;

  const doc = editor.document;
  const cursorLine = editor.selection.active.line;
  const currentLine = doc.lineAt(cursorLine).text.trim();

  if (!currentLine.startsWith('@defaults:')) {
    vscode.window.showInformationMessage('Posizionati su una riga con @defaults:');
    return;
  }

  // Estrai i defaults
  const prioMatch = currentLine.match(/@prio\((high|medium|low)\)/);
  const priorityChar = prioMatch?.[1] === 'high' ? '!' : prioMatch?.[1] === 'medium' ? '~' : prioMatch?.[1] === 'low' ? ' ' : null;

  // const tagMatches = currentLine.match(/@(\w+)/g)
  //   ?.filter(tag => !tag.startsWith('@prio') && tag !== '@defaults') || [];

  const edits = new vscode.WorkspaceEdit();

  for (let i = cursorLine + 1; i < doc.lineCount; i++) {
    const line = doc.lineAt(i).text;
    const trimmed = line.trim();

    if (trimmed === '' || trimmed.startsWith('@defaults:') || trimmed.startsWith('#')) break;

    const checkboxMatch = trimmed.match(/^(\s*)- \[([ X~!])\](.*)$/);
    if (!checkboxMatch) continue;

    const indent = checkboxMatch[1];
    const content = checkboxMatch[3];

    // Solo se non ha priorità implicita
    // const newChar = currentCheckbox === ' ' ? (priorityChar ?? ' ') : currentCheckbox;
    const newChar = priorityChar;
    const newTaskLine = `${indent}- [${newChar}]${content}`;
    edits.replace(doc.uri, new vscode.Range(i, 0, i, line.length), newTaskLine);

    // Verifica la riga sopra: deve contenere già i tag (e non @defaults)
    // const prevLineIndex = i - 1;
    // const prevLine = prevLineIndex >= 0 ? doc.lineAt(prevLineIndex).text.trim() : '';
    // const isTagLine = prevLine.startsWith('@') && !prevLine.startsWith('@defaults:');

    // if (tagMatches.length > 0 && !isTagLine) {
    //   const tagLine = indent + tagMatches.join(', ');
    //   edits.insert(doc.uri, new vscode.Position(i, 0), tagLine + '\n');
    // }
  }

  await vscode.workspace.applyEdit(edits);
}