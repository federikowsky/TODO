import { RootNode, ASTNode, Diagnostic } from './ast/types';
import { parseLineToNode } from './parseLine/parseLine';
import { ASTRepository } from './repository/ASTRepository';
import { ContextManager } from './context/ContextManager';
import { ASTFinalizer } from './validate/finalize';

/**
 * ASTDocument:
 *  - Gestisce il testo e l'aggiornamento riga per riga dell'AST.
 *  - Si affida a ContextManager per determinare i parent.
 *  - Gestisce la validazione (full o incrementale) via ASTFinalizer.
 */
export class ASTDocument {
  private repo: ASTRepository;
  private ctx: ContextManager;
  private finalizer: ASTFinalizer;
  private lines: string[];
  private diagnostics: Diagnostic[] = [];

  constructor(initialContent: string) {
    // Salviamo le linee dell'input
    this.lines = initialContent.split('\n');
    // Inizializziamo repository, context e validazione
    this.repo = new ASTRepository(this.lines.length);
    this.ctx = new ContextManager(this.repo, this.lines);
    this.finalizer = new ASTFinalizer();

    // Simuliamo un update su tutte le linee per ottenere l'AST iniziale
    const allChanges: Record<number, string> = {};
    this.lines.forEach((text, i) => (allChanges[i] = text));
    this.updateLines(allChanges);
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
    this.finalizer.setIndentSettings(unit, spaces);
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
  private finalizeDiagnostics(changedLines: number[]) {
    const threshold = Math.ceil(this.lines.length * 0.4);
    if (changedLines.length >= threshold) {
      this.diagnostics = this.finalizer.finalizeFull(this.repo.root, []);
    } else {
      this.diagnostics = this.finalizer.finalizeIncremental(
        this.repo.root,
        this.diagnostics,
        changedLines,
        (ln) => this.repo.getNodeAtLine(ln)
      );
    }
  }

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

    for (const line of changedLines) {
      const raw = changed[line] ?? '';
      const text = raw.trimEnd();
      this.lines[line] = text;

      const oldNode = this.repo.getNodeAtLine(line);
      const { node: newNode } = parseLineToNode(text, line);

      if (!newNode || !text) {
        if (oldNode) this.handleRemove(line, oldNode);
        continue;
      }

      if (!oldNode) {
        this.handleInsert(line, newNode);
        continue;
      }

      this.handleUpdate(line, oldNode, newNode);
    }

    this.finalizeDiagnostics(changedLines);
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
      result += `${'  '.repeat(depth)}${node.text.trim()} (${node.range.startLine}:${node.range.endLine}) [${node.id}] [${node.parent?.id}]\n`;
      node.children.forEach(child => traverse(child, depth + 1));
    };
    traverse(node);
    console.log(result);
  }
}