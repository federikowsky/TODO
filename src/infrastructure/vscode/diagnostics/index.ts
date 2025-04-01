import * as vscode from 'vscode';
import { DiagnosticsRunner } from './diagnosticsRunner';

const DEBOUNCE_DELAY = 250;

// Map per accumulare le modifiche per ogni documento (chiave = document URI)
const pendingChanges: Map<string, Record<number, string>> = new Map();
// Map per gestire i timer debounce per ogni documento
const debounceTimers: Map<string, ReturnType<typeof setTimeout>> = new Map();

export function setupDiagnostics(context: vscode.ExtensionContext): void {
  const runner = DiagnosticsRunner.getInstance();

  // Funzione helper per eseguire diagnostics su un documento con eventuali modifiche
  const runForDocument = (document: vscode.TextDocument, changes?: Record<number, string>) => {
    runner.runDiagnostics(document, changes);
  };

  // Esegui diagnostics per i documenti già aperti all'attivazione
  vscode.window.visibleTextEditors.forEach(editor => {
    if (editor.document.languageId === 'td') {
      runForDocument(editor.document);
    }
  });

  // Gestione degli eventi: apertura documenti e cambio di editor attivo
  context.subscriptions.push(
    vscode.workspace.onDidOpenTextDocument(doc => {
      if (doc.languageId === 'td') {
        runForDocument(doc);
      }
    }),
    vscode.window.onDidChangeActiveTextEditor(editor => {
      if (editor?.document.languageId === 'td') {
        runForDocument(editor.document);
      }
    })
  );

  // Accumula le modifiche in batch e applica la logica tramite debounce
  context.subscriptions.push(
    vscode.workspace.onDidChangeTextDocument(event => {
      const { document, contentChanges } = event;
      if (document.languageId !== 'td' || contentChanges.length === 0) return;
      const key = document.uri.toString();

      // Accumula le modifiche per questo documento
      const changesForDoc = pendingChanges.get(key) || {};
      for (const change of contentChanges) {
        const line = change.range.start.line;
        changesForDoc[line] = document.lineAt(line).text;
      }
      pendingChanges.set(key, changesForDoc);

      // Imposta o resetta il debounce per questo documento
      if (debounceTimers.has(key)) {
        clearTimeout(debounceTimers.get(key)!);
      }
      debounceTimers.set(
        key,
        setTimeout(() => {
          runForDocument(document, pendingChanges.get(key));
          pendingChanges.delete(key);
          debounceTimers.delete(key);
        }, DEBOUNCE_DELAY)
      );
    })
  );

  // Aggiorna diagnostics quando il cursore si sposta (per mostrare errori su righe che hanno perso il focus)
  context.subscriptions.push(
    vscode.window.onDidChangeTextEditorSelection(event => {
      const doc = event.textEditor.document;
      if (doc.languageId !== 'td') return;
      runForDocument(doc);
    })
  );
}