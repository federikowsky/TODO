// src/commands/togglePriority.ts

import * as vscode from 'vscode';

const PRIORITY_SEQUENCE: Record<string, string> = {
  ' ': '~',  // none → medium
  '~': '!',  // medium → high
  '!': ' ',  // high → none
  'X': 'X',  // done → unchanged
};

export async function togglePriority() {
  const editor = vscode.window.activeTextEditor;
  if (!editor) return;

  const doc = editor.document;
  const line = editor.selection.active.line;
  const text = doc.lineAt(line).text;

  const checkboxRegex = /^(\s*)- \[([ X~!])\](.*)$/;
  const match = checkboxRegex.exec(text);
  if (!match) return;

  const indent = match[1];
  const currentChar = match[2];
  const content = match[3];

  const nextChar = PRIORITY_SEQUENCE[currentChar] ?? currentChar;

  const newLine = `${indent}- [${nextChar}]${content}`;
  const range = new vscode.Range(line, 0, line, text.length);

  const edit = new vscode.WorkspaceEdit();
  edit.replace(doc.uri, range, newLine);
  await vscode.workspace.applyEdit(edit);
}