import * as vscode from 'vscode';
import { RootNode, ASTNode, Diagnostic, TaskNode } from './types';
import { parseLineToNode } from './parseLine/parseLine';
import { ASTRepository } from './ASTRepository';
import { ContextManager } from './ContextManager';



/**
 * Rappresenta un cambiamento in una riga del documento.
 * - line: numero di riga
 * - oldNode: nodo preesistente (null se non presente)
 * - newText: nuovo testo della riga
 * - newNode: nuovo nodo risultante dal parsing (null se non valido)
 */
export interface LineChange {
  line: number;
  oldNode: ASTNode | null;
  newText: string;
  newNode: ASTNode | null;
}

/**
 * ASTDocument:
 *  - Gestisce il testo e l'aggiornamento riga per riga dell'AST.
 *  - Si affida a ContextManager per determinare i parent.
 *  - Gestisce la validazione (full o incrementale) via ASTFinalizer.
 */
export class ASTDocument {
  private repo: ASTRepository;
  private ctx: ContextManager;
  private lines: string[];
  private diagnostics: Diagnostic[] = [];
  private astDocs: Map<string, ASTDocument>;

  constructor(initialContent: string) {
    // Salviamo le linee dell'input
    this.lines = initialContent.split('\n');
    // Inizializziamo repository, context e validazione
    this.repo = new ASTRepository(this.lines.length);
    this.ctx = new ContextManager(this.repo, this.lines);
    this.astDocs = new Map();

    // Simuliamo un update su tutte le linee per ottenere l'AST iniziale
    const allChanges: Record<number, string> = {};
    this.lines.forEach((text, i) => (allChanges[i] = text));
    this.updateLines(allChanges);
  }

  public getIstance(key: string, document: vscode.TextDocument): ASTDocument | undefined {
    if (!this.astDocs.has(key)) {
      const astDoc = new ASTDocument(document.getText());
      this.astDocs.set(key, astDoc);
    }
    return this.astDocs.get(key)!;
  }

  /**
   * Restituisce il testo completo (ricomposto dalle righe).
   */
  public getText(): string { return this.lines.join('\n'); }
  /**
   * Restituisce la lista di Diagnostics.
   */
  public getDiagnostics(): Diagnostic[] { return this.diagnostics; }
  /**
   * Ritorna il nodo root.
   */
  public getRoot(): RootNode { return this.repo.root; }

  /**
   * Consente di modificare le impostazioni di indentazione.
   */
  public setIndentConfig(unit: number, spaces: boolean) {
    this.ctx.setIndentSettings(unit, spaces);
  }

  /**
   * handleRemove: gestisce la rimozione di un nodo esistente.
   * - Rimuove il nodo dal repository.
   * - Se il nodo ha un parent, rimuove i nodi orfani e li reinserisce.
   */
  private handleRemove(line: number, oldNode: ASTNode): void {
    const orphans = this.repo.removeNode(oldNode);
    for (const child of orphans) {
      const newParent = this.ctx.resolveParent(child);
      this.repo.insertNode(child, newParent, child.range.startLine);
    }
  }

  /**
   * handleInsert: gestisce l'inserimento di un nuovo nodo.
   * - Trova il parent corretto.
   * - Inserisce il nodo nel repository.
   * - Riassegna i nodi figli del parent. 
   */
  private handleInsert(line: number, newNode: ASTNode): void {
    const parent = this.ctx.resolveParent(newNode);
    this.repo.insertNode(newNode, parent, line);
    this.ctx.reassignSubtree(parent);
  }

  /**
   * handleUpdate: gestisce l'aggiornamento di un nodo esistente.
   * - Se il nodo è lo stesso, aggiorna il nodo e il parent.
   * - Altrimenti, rimuove il nodo vecchio e inserisce quello nuovo.
   */
  private handleUpdate(line: number, oldNode: ASTNode, newNode: ASTNode): void {
    if (oldNode.id === newNode.id) {
      this.repo.updateNode(oldNode, newNode);
      const newParent = this.ctx.resolveParent(oldNode);
      if (newParent !== oldNode.parent) {
        this.repo.removeNode(oldNode);
        this.repo.insertNode(oldNode, newParent, line);
      }
      this.ctx.reassignSubtree(newParent);
    } else {
      const orphans = this.repo.removeNode(oldNode);
      for (const child of orphans) {
        const newParent = this.ctx.resolveParent(child);
        this.repo.insertNode(child, newParent, child.range.startLine);
      }
      this.handleInsert(line, newNode);
    }
  }

  /**
   * finalizeDiagnostics: decide se fare una validazione full o incrementale
   * in base alla percentuale di linee cambiate.
   * - Se >= 40% delle linee cambiate, fa una validazione full.
   * - Altrimenti, fa una validazione incrementale.
   */
  // private finalizeDiagnostics(changedLines: number[]) {
  //   const threshold = Math.ceil(this.lines.length * 0.4);
  //   const mode: FinalizeMode = changedLines.length >= threshold ? 'full' : 'incremental';
  //   this.diagnostics = this.finalizer.finalize(
  //     mode,
  //     this.repo.root,
  //     this.diagnostics,
  //     changedLines,
  //     (ln) => this.repo.getNodeAtLine(ln)
  //   );
  // }

  /**
   * updateLines: aggiorna l'AST in base alle righe modificate.
   * Decide se fare una validazione full o incrementale in base
   * alla percentuale di linee cambiate.
   */
  public updateLines(changed: Record<number, string>): Diagnostic[] {
    const changedLines = Object.keys(changed).map(Number);
    if (!changedLines.length) return this.diagnostics;

    const maxLine = Math.max(...changedLines);
    this.ensureLineCapacity(maxLine);

    // snapshot delle righe cambiate
    const changes: LineChange[] = changedLines.map(line => {
      const raw = changed[line] ?? '';
      const newText = raw.trimEnd();
      const oldNode = this.repo.getNodeAtLine(line);
      const { node: newNode } = parseLineToNode(newText, line);
      return { line, oldNode, newText, newNode };
    });

    for (const { line, oldNode, newText, newNode } of changes) {
      this.lines[line] = newText;

      // Gestione casi in ordine di priorità
      if (oldNode && (!newNode || !newText)) {
        // Nodo rimosso o invalidato
        this.handleRemove(line, oldNode);
      } else if (newNode && !oldNode) {
        // Nuovo nodo aggiunto
        this.handleInsert(line, newNode);
      } else if (newNode && oldNode) {
        // Nodo aggiornato
        this.handleUpdate(line, oldNode, newNode);
      }
    }

    /**
     * Gestisci la validazione dei nodi cambiati.
     * Da sistemare la funzione e trovarne un'utilità.
     */
    // this.finalizeDiagnostics(changedLines);
    this.trimTrailingEmptyLines();

    return this.diagnostics;
  }

  /**
   * ensureLineCapacity: allunga lines/lineNodes se serve.
   */
  private ensureLineCapacity(lineIndex: number): void {
    if (lineIndex >= this.lines.length) {
      this.lines.length = lineIndex + 1;
    }
    this.repo.ensureLineNodesSize(this.lines.length);
  }

  /**
   * trimTrailingEmptyLines: rimuove linee vuote in coda.
   */
  private trimTrailingEmptyLines(): void {
    let lastNonEmpty = this.lines.length - 1;
    while (lastNonEmpty >= 0 && !this.lines[lastNonEmpty].trim()) {
      lastNonEmpty--;
    }
    this.lines.length = lastNonEmpty + 1;
    this.repo.ensureLineNodesSize(this.lines.length);
  }

  /**
   * printTree: debug per mostrare la struttura AST
   */
  public printTree(node: ASTNode = this.repo.root): void {
    let result = '\n';

    const traverse = (node: ASTNode, depth: number = 0) => {
      const indent = '  '.repeat(depth);
        result += `${indent}${node.text.trim()} (${node.range.startLine}:${node.range.endLine}) [${node.id}] [${node.parent?.id}]\n`;
      node.children.forEach(child => traverse(child, depth + 1));
    };

    traverse(node);
    console.log(result);
  }
}