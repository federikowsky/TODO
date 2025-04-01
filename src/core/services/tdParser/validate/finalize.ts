// src/core/services/tdParser/incremental/finalize.ts

import {
  RootNode,
  ASTNode,
  SectionNode,
  TaskNode,
  NoteNode,
  MetadataNode,
  Diagnostic
} from '../ast/types';

import { validateSection } from './validators/validateSection';
import { validateTask } from './validators/validateTask';
import { validateMeta } from './validators/validateMeta';
import { validateDefaults } from './validators/validateDefaults';
import { validateNote } from './validators/validateNote';

interface MultiLineContext {
  lastTask?: TaskNode;
}

export class ASTFinalizer {
  private indentUnit: number;
  private useSpaces: boolean;

  constructor(indentUnit: number = 4, useSpaces: boolean = true) {
    this.indentUnit = indentUnit;
    this.useSpaces = useSpaces;
  }

  public setIndentSettings(u: number, s: boolean) {
    this.indentUnit = u;
    this.useSpaces = s;
  }

  // Esegue la validazione "singola riga" in base al tipo del nodo.
  private validateNode(node: ASTNode): Diagnostic[] {
    switch (node.type) {
      case 'section': return validateSection(node as SectionNode);
      case 'task': return validateTask(node as TaskNode);
      case 'meta': return validateMeta(node as MetadataNode);
      case 'defaults': return validateDefaults(node as MetadataNode);
      case 'note': return validateNote(node as NoteNode);
      default: return [];
    }
  }

  // Esegue i controlli contestuali sul nodo corrente, utilizzando il contesto.
  // Ora include anche il controllo per DEFAULTS_ORPHAN se il nodo è di tipo 'defaults'
  private multiLineValidate(node: ASTNode, context: MultiLineContext): Diagnostic[] {
    const diags: Diagnostic[] = [];
    const line = node.range.startLine;

    // META_ORPHAN: il nodo meta deve avere un task immediatamente precedente.
    if (node.type === 'meta') {
      if (!context.lastTask || (line - context.lastTask.range.startLine > 1)) {
        diags.push({
          line,
          message: 'Meta orphan: nessun task immediatamente precedente',
          severity: 'error',
          code: 'META_ORPHAN'
        });
      }
    }

    // NOTE_ORPHAN: una nota deve essere associata a un task immediato.
    if (node.type === 'note') {
      if (!context.lastTask || (line - context.lastTask.range.startLine > 1)) {
        diags.push({
          line,
          message: 'Nota orphan: nessun task associato',
          severity: 'warning',
          code: 'NOTE_ORPHAN'
        });
      }
    }

    // TASK_INDENT_ERROR: per i task, controlla che:
    // 1. L'indent sia un multiplo di indentUnit.
    // 2. Se è un subtask (padre task), l'indent sia esattamente parent.indent + indentUnit.
    if (node.type === 'task') {
      if (node.indent % this.indentUnit !== 0) {
        diags.push({
          line,
          message: `Indent non valido: deve essere multiplo di ${this.indentUnit}`,
          severity: 'error',
          code: 'TASK_INDENT_ERROR'
        });
      }
      if (node.parent && node.parent.type === 'task') {
        const parentTask = node.parent as TaskNode;
        const expectedIndent = parentTask.indent + this.indentUnit;
        if (node.indent !== expectedIndent) {
          diags.push({
            line,
            message: `Subtask mal indentato: atteso ${expectedIndent} (padre ha indent ${parentTask.indent})`,
            severity: 'error',
            code: 'TASK_INDENT_ERROR'
          });
        }
      }
    }

    // DEFAULTS_ORPHAN: se il nodo è defaults, controlla che abbia almeno un task fra i suoi children.
    if (node.type === 'defaults') {
      const hasTask = node.children.some(child => child.type === 'task');
      if (!hasTask) {
        diags.push({
          line,
          message: 'Defaults orphan: mancano task sotto defaults',
          severity: 'error',
          code: 'DEFAULTS_ORPHAN'
        });
      }
    }

    return diags;
  }

  // DFS di validazione: attraversa l'albero, accumulando i diagnostic sia "singola riga" sia contestuali.
  private dfsValidate(node: ASTNode, diagnostics: Diagnostic[], context: MultiLineContext): void {
    diagnostics.push(...this.validateNode(node));
    diagnostics.push(...this.multiLineValidate(node, context));

    // Aggiorna il contesto: se il nodo è un task, lo imposta come ultimo task incontrato.
    const newContext: MultiLineContext = { ...context };
    if (node.type === 'task') {
      newContext.lastTask = node as TaskNode;
    }

    for (const child of node.children) {
      this.dfsValidate(child, diagnostics, newContext);
    }
  }

  // Funzione helper per la DFS di ricerca: trova ricorsivamente il nodo che copre la linea specificata.
  private findNodeDFS(node: ASTNode, line: number): ASTNode | null {
    const { startLine, endLine } = node.range;
    if (line >= startLine && line <= endLine) {
      for (const child of node.children) {
        const found = this.findNodeDFS(child, line);
        if (found) return found;
      }
      return node;
    }
    return null;
  }

  // Unisce i diagnostic raccolti evitando duplicati.
  private flattenDiagnostics(baseDiagnostic: Diagnostic[], additionalDiagnostics: Diagnostic[]): Diagnostic[] {
    const all = new Map<string, Diagnostic>();

    const addDiagnostics = (diagnostics: Diagnostic[]) => {
      for (const diag of diagnostics) {
        const key = `${diag.line}-${diag.code}`;
        if (!all.has(key)) {
          all.set(key, diag);
        }
      }
    };

    addDiagnostics(baseDiagnostic);
    addDiagnostics(additionalDiagnostics);

    return Array.from(all.values());
  }

  // Esegue la validazione completa dell'AST in una sola traversata.
  public finalizeFull(root: RootNode, baseDiagnostic: Diagnostic[]): Diagnostic[] {
    const diagnostics: Diagnostic[] = [];
    const context: MultiLineContext = {};
    this.dfsValidate(root, diagnostics, context);
    const flattened = this.flattenDiagnostics(baseDiagnostic, diagnostics);
    flattened.sort((a, b) => a.line - b.line);
    return flattened;
  }

  // Esegue la validazione incrementale sui nodi impattati, trovandoli tramite la funzione findNodeByLine.
  public finalizeIncremental(
    root: RootNode,
    baseDiagnostic: Diagnostic[],
    changedIndices: number[],
    findNodeByLine: (line: number) => ASTNode | null
  ): Diagnostic[] {
    const diagnostics: Diagnostic[] = [];
    const impactedNodes = new Set<ASTNode>();

    for (const line of changedIndices) {
      const candidate = findNodeByLine(line) || this.findNodeDFS(root, line);
      if (!candidate) continue;
      impactedNodes.add(candidate);
      let cur = candidate.parent;
      while (cur && cur !== root && cur.type !== 'section') {
        impactedNodes.add(cur);
        cur = cur.parent;
      }
    }
    const context: MultiLineContext = {};
    impactedNodes.forEach(node => this.dfsValidate(node, diagnostics, context));
    const flattened = this.flattenDiagnostics(baseDiagnostic, diagnostics);
    flattened.sort((a, b) => a.line - b.line);
    return flattened;
  }
}