import * as vscode from 'vscode';
import { DiagnosticsRunner } from './diagnosticsRunner';
import { collectChangedLines } from './utils';

const DEBOUNCE_DELAY = 250;
const pendingChanges = new Map<string, Record<number, string>>();
const debounceTimers = new Map<string, ReturnType<typeof setTimeout>>();

export function setupDiagnostics(context: vscode.ExtensionContext): void {
  const runner = DiagnosticsRunner.getInstance();

  const runForDocument = (
    document: vscode.TextDocument,
    changes?: Record<number, string>
  ): void => {
    runner.runDiagnostics(document, changes);
  };

  // Diagnostica iniziale su documenti già aperti
  for (const editor of vscode.window.visibleTextEditors) {
    const doc = editor.document;
    if (doc.languageId === 'td') runForDocument(doc);
  }

  // Documenti aperti o cambio editor attivo
  context.subscriptions.push(
    vscode.workspace.onDidOpenTextDocument(doc => {
      if (doc.languageId === 'td') runForDocument(doc);
    }),

    vscode.window.onDidChangeActiveTextEditor(editor => {
      const doc = editor?.document;
      if (doc?.languageId === 'td') runForDocument(doc);
    }),

    vscode.window.onDidChangeTextEditorSelection(event => {
      const doc = event.textEditor.document;
      if (doc.languageId === 'td') runForDocument(doc);
    }),

    vscode.workspace.onDidChangeTextDocument(event => {
      const { document, contentChanges } = event;
      if (document.languageId !== 'td' || contentChanges.length === 0) return;

      const key = document.uri.toString();
      const existing = pendingChanges.get(key) ?? {};
      const detected = collectChangedLines(document, contentChanges);

      Object.assign(existing, detected);
      pendingChanges.set(key, existing);

      // Debounce
      const existingTimer = debounceTimers.get(key);
      if (existingTimer) clearTimeout(existingTimer);

      const newTimer = setTimeout(() => {
        const changes = pendingChanges.get(key);
        if (changes) runForDocument(document, changes);
        pendingChanges.delete(key);
        debounceTimers.delete(key);
      }, DEBOUNCE_DELAY);

      debounceTimers.set(key, newTimer);
    })
  );
}