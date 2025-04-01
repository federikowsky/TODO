import * as vscode from 'vscode';
import { ASTDocument } from '../../../core/services/tdParser';

export class DiagnosticsRunner {
  private static instance: DiagnosticsRunner;
  private diagnosticCollection: vscode.DiagnosticCollection;
  private astDocs: Map<string, ASTDocument>;
  // Tiene traccia della riga attiva (della run precedente) per ogni documento
  private lastActiveLine: Map<string, number>;

  private constructor() {
    this.diagnosticCollection = vscode.languages.createDiagnosticCollection('td');
    this.astDocs = new Map();
    this.lastActiveLine = new Map();
  }

  public static getInstance(): DiagnosticsRunner {
    if (!DiagnosticsRunner.instance) {
      DiagnosticsRunner.instance = new DiagnosticsRunner();
    }
    return DiagnosticsRunner.instance;
  }

  /**
   * Recupera o crea l'ASTDocument associato al documento.
   */
  private getAstDoc(document: vscode.TextDocument): ASTDocument {
    const key = document.uri.toString();
    if (!this.astDocs.has(key)) {
      const astDoc = new ASTDocument(document.getText());
      this.astDocs.set(key, astDoc);
    }
    return this.astDocs.get(key)!;
  }

  /**
   * Esegue il parsing incrementale e pubblica i diagnostics.
   * - Imposta le configurazioni di indentazione PRIMA di applicare le modifiche.
   * - Applica le modifiche (se presenti).
   * - Calcola i diagnostics e li filtra: per la riga attiva vengono mostrati solo
   *   se la riga attiva è cambiata dalla run precedente.
   */
  public runDiagnostics(document: vscode.TextDocument, changes?: Record<number, string>): void {
    if (document.languageId !== 'td') return;
    const key = document.uri.toString();
    const astDoc = this.getAstDoc(document);

    // Imposta le opzioni di indentazione dal documento attivo (se presente)
    const editor = vscode.window.activeTextEditor;
    if (editor && editor.document.uri.toString() === key) {
      const tabSize = Number(editor.options.tabSize) || 4;
      const insertSpaces = Boolean(editor.options.insertSpaces);
      astDoc.setIndentConfig(tabSize, insertSpaces);
    }

    // Applica le modifiche in batch se presenti
    if (changes && Object.keys(changes).length > 0) {
      astDoc.updateLines(changes);
    }

    astDoc.printTree(); // Debug: stampa l'AST

    // Calcola i diagnostics dall'AST
    const computedDiagnostics = astDoc.getDiagnostics();

    // Determina la riga attiva corrente (se il documento è attivo)
    let currentActiveLine = -1;
    if (editor && editor.document.uri.toString() === key) {
      currentActiveLine = editor.selection.active.line;
    }
    // Recupera la riga attiva della run precedente (se esiste)
    const previousActive = this.lastActiveLine.get(key);
    // Aggiorna lo stato con la riga attiva corrente
    this.lastActiveLine.set(key, currentActiveLine);

    // Costruiamo l'array finale dei diagnostics
    const finalDiagnostics: vscode.Diagnostic[] = [];
    for (const diag of computedDiagnostics) {
      // Creazione dell'oggetto Diagnostic VSCode
      const start = new vscode.Position(diag.line, 0);
      const end = new vscode.Position(diag.line, document.lineAt(diag.line).text.length);
      const vscodeDiag = new vscode.Diagnostic(
        new vscode.Range(start, end),
        diag.message,
        diag.severity === 'error'
          ? vscode.DiagnosticSeverity.Error
          : vscode.DiagnosticSeverity.Warning
      );
      // Se il diagnostic appartiene alla riga attiva e la riga non è cambiata,
      // omettiamo i diagnostics (quindi non mostriamo nuovi errori fino a quando l'utente sposta il cursore)
      if (diag.line === currentActiveLine && previousActive === currentActiveLine) {
        continue;
      }
      finalDiagnostics.push(vscodeDiag);
    }

    this.diagnosticCollection.set(document.uri, finalDiagnostics);
  }
}