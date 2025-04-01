// src/infrastructure/vscode/tdFoldingProvider.ts

import * as vscode from 'vscode';

// ...existing code...

export const tdFoldingProvider: vscode.FoldingRangeProvider = {
  provideFoldingRanges(document: vscode.TextDocument): vscode.ProviderResult<vscode.FoldingRange[]> {
    const foldingRanges: vscode.FoldingRange[] = [];
    const headerRegex = /^(#{1,3})\s+(.*)$/;

    const headerStack: { line: number, level: number }[] = [];

    for (let i = 0; i < document.lineCount; i++) {
      const lineText = document.lineAt(i).text;
      const match = lineText.match(headerRegex);

      if (match) {
        const level = match[1].length;

        // Chiudi le sezioni di livello maggiore o uguale
        while (headerStack.length > 0) {
          const lastHeader = headerStack[headerStack.length - 1];
          
          // Se il livello dell'elemento in cima allo stack è maggiore di quello corrente
          // oppure se è uguale e di stesso livello, chiudiamo la sezione
          if (lastHeader.level > level || (lastHeader.level === level)) {
            const { line: start } = headerStack.pop()!;
            const end = i - 1;
            if (end > start) {
              foldingRanges.push(new vscode.FoldingRange(start, end));
            }
          } else {
            // Se il livello è minore (sezione principale mentre stiamo analizzando una sottosezione)
            // non chiudiamo nulla e manteniamo la gerarchia
            break;
          }
        }

        // Aggiungi la nuova intestazione allo stack
        headerStack.push({ line: i, level });
      }
    }

    // Chiudi eventuali sezioni rimaste nello stack
    while (headerStack.length > 0) {
      const { line: start } = headerStack.pop()!;
      const end = document.lineCount - 1;
      if (end > start) {
        foldingRanges.push(new vscode.FoldingRange(start, end));
      }
    }

    return foldingRanges;
  }
};