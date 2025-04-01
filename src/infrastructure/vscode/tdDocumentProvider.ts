// src/infrastructure/vscode/tdDocumentSymbols.ts

import * as vscode from 'vscode';

export const tdDocumentSymbolProvider: vscode.DocumentSymbolProvider = {
  provideDocumentSymbols(document: vscode.TextDocument): vscode.ProviderResult<vscode.DocumentSymbol[]> {
    const symbols: vscode.DocumentSymbol[] = [];

    const headerRegex = /^(#{1,3})\s+(.*)$/;

    for (let i = 0; i < document.lineCount; i++) {
      const lineText = document.lineAt(i).text;
      const match = lineText.match(headerRegex);

      if (match) {
        const level = match[1].length;
        const title = match[2].trim();
        const range = new vscode.Range(i, 0, i, lineText.length);

        const symbol = new vscode.DocumentSymbol(
          title,
          '',
          level === 1 ? vscode.SymbolKind.Namespace :
          level === 2 ? vscode.SymbolKind.Module :
                         vscode.SymbolKind.Object,
          range,
          range
        );

        symbols.push(symbol);
      }
    }

    return symbols;
  }
};