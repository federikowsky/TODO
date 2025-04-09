import * as vscode from 'vscode';

/**
 * Raccoglie le righe modificate da un evento VSCode, includendo ±1 riga per gestire swap e contesto.
 */
export function collectChangedLines(
  document: vscode.TextDocument,
  contentChanges: readonly vscode.TextDocumentContentChangeEvent[]
): Record<number, string> {
  const changed: Record<number, string> = {};

  for (const change of contentChanges) {
    const start = change.range.start.line;
    const end = change.range.end.line;

    // Linee modificate direttamente
    for (let i = start; i <= end; i++) {
      changed[i] = safeLineText(document, i);
    }

    // riga start.line -1 per validazione tag
    changed[start - 1] = safeLineText(document, start - 1);
  }

  return changed;
}

function safeLineText(doc: vscode.TextDocument, line: number): string {
  return line >= 0 && line < doc.lineCount ? doc.lineAt(line).text : '';
}