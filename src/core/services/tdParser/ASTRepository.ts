import { v4 as uuidv4 } from 'uuid';
import { ASTNode, RootNode } from './types';

/**
 * ASTRepository:
 *  - Mantiene la mappatura line->node (lineNodes).
 *  - Gestisce metodi CRUD (insert, remove, update) per i nodi.
 *  - Inserisce i child in ordine di linea (startLine).
 */
export class ASTRepository {
  public root: RootNode;
  private lineNodes: (ASTNode | null)[];

  constructor(lineCount: number) {
    this.root = {
      id: uuidv4(),
      type: 'root',
      range: { startLine: 0, endLine: 0 },
      parent: undefined,
      children: [],
      text: 'ROOT'
    };
    this.lineNodes = Array(lineCount).fill(null);
  }

  /**
   * getNodeAtLine: ritorna il nodo associato a line, se presente.
   */
  public getNodeAtLine(line: number): ASTNode | null {
    if (line < 0 || line >= this.lineNodes.length) {
      return null;
    }
    return this.lineNodes[line];
  }

  /**
   * setNodeAtLine: imposta o rimuove il nodo associato a una certa linea.
   */
  public setNodeAtLine(line: number, node: ASTNode | null): void {
    if (line < 0) return;
    if (line >= this.lineNodes.length) {
      this.ensureLineNodesSize(line + 1);
    }
    this.lineNodes[line] = node;
  }

  /**
   * insertNode:
   *  - Inserisce il nodo come figlio di 'parent'.
   *  - Lo registra in lineNodes.
   *  - Ordina i child del parent in base a startLine.
   */
  public insertNode(node: ASTNode, parent: ASTNode, lineNumber: number): void {
    node.parent = parent;
    this.setNodeAtLine(lineNumber, node);

    node.range.startLine = lineNumber;
    node.range.endLine = lineNumber;

    this.insertChildSorted(parent, node);
  }

  /**
   * removeNode:
   *  - Rimuove il nodo dal parent.
   *  - Cancella i riferimenti in lineNodes.
   */
  public removeNode(node: ASTNode): ASTNode[] {
    // Detach and return children
    const orphans = [...node.children];

    const p = node.parent!;
    const idx = p.children.indexOf(node);
    if (idx !== -1) p.children.splice(idx, 1);
  
    // Clean up lineNodes
    const { startLine, endLine } = node.range;
    for (let i = startLine; i <= endLine && i < this.lineNodes.length; i++) {
      if (this.lineNodes[i]?.id === node.id) {
        this.lineNodes[i] = null;
      }
    }
    // Clear parent reference
    return orphans;
  }


  /**
   * moveNode: rimuove il nodo e lo reinserisce sotto un nuovo parent.
   * - Non cambia le proprietà del nodo, solo il parent.
   */
  public moveNode(node: ASTNode, newParent: ASTNode): void {
    this.removeNode(node);
    this.insertNode(node, newParent, node.range.startLine);
  }

  /**
   * updateNode: aggiorna le proprietà dell'oldNode con quelle di newNode (eccetto parent e children).
   */
  public updateNode(oldNode: ASTNode, newNode: ASTNode): void {
    const { children: _, parent: _2, ...rest } = newNode;
    Object.assign(oldNode, rest);
  }

  /**
   * insertChildSorted: inserisce 'child' in 'parent.children' in ordine di startLine.
   */
  private insertChildSorted(parent: ASTNode, child: ASTNode): void {
    const line = child.range.startLine;
    let left = 0;
    let right = parent.children.length;
    while (left < right) {
      const mid = (left + right) >>> 1;
      if (parent.children[mid].range.startLine < line) {
        left = mid + 1;
      } else {
        right = mid;
      }
    }
    parent.children.splice(left, 0, child);
  }

  /**
   * ensureLineNodesSize: estende l'array lineNodes se necessario.
   */
  public ensureLineNodesSize(size: number): void {
    if (size <= this.lineNodes.length) return;
    const extra = size - this.lineNodes.length;
    this.lineNodes.push(...Array(extra).fill(null));
  }
}