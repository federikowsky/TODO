// src/core/services/tdParser/filters/FilterManager.ts
import { ASTNode } from './types';
import { IFilterSpecification } from './filters/IFilterSpecification';
import { SectionFilter } from './filters/SectionFilter';
import { MetaTagFilter } from './filters/MetaTagFilter';
import { TaskStatusFilter } from './filters/TaskStatusFilter';
import { TaskPriorityFilter } from './filters/TaskPriorityFilter';
import { TaskNotesFilter } from './filters/TaskNotesFilter';

export interface FilterOptions {
  sections?: boolean; // Include sezioni e sub-sezioni
  metaTag?: { key: string; value?: string | boolean };
  status?: 'todo' | 'done';
  priority?: 'none' | 'low' | 'medium' | 'high';
  hasNotes?: boolean;
}

export class FilterManager {
  private cacheKey: string = '';
  private cacheResult: ASTNode[] = [];
  private lastDocumentHash: string = '';

  // Utilizza un generator per iterare l'AST
  private *traverseAST(root: ASTNode): Generator<ASTNode> {
    const stack: ASTNode[] = [root];
    while (stack.length) {
      const node = stack.pop()!;
      yield node;
      if (node.children && node.children.length > 0) {
        // Aggiungo figli in ordine inverso per mantenere l'ordine
        for (let i = node.children.length - 1; i >= 0; i--) {
          stack.push(node.children[i]);
        }
      }
    }
  }

  // Costruzione della specifica composta tramite i flag delle opzioni
  private buildSpecification(options: FilterOptions): IFilterSpecification | null {
    let spec: IFilterSpecification | null = null;
    
    if (options.sections) {
      spec = new SectionFilter();
    }
    if (options.metaTag) {
      const metaSpec = new MetaTagFilter(options.metaTag.key, options.metaTag.value);
      spec = spec ? spec.and(metaSpec) : metaSpec;
    }
    if (options.status) {
      const statusSpec = new TaskStatusFilter(options.status);
      spec = spec ? spec.and(statusSpec) : statusSpec;
    }
    if (options.priority) {
      const prioSpec = new TaskPriorityFilter(options.priority);
      spec = spec ? spec.and(prioSpec) : prioSpec;
    }
    if (options.hasNotes) {
      const notesSpec = new TaskNotesFilter();
      spec = spec ? spec.and(notesSpec) : notesSpec;
    }
    return spec;
  }

  // Metodo principale per filtrare l’AST utilizzando il generator per una valutazione lazy
  public getFilteredNodes(root: ASTNode, options: FilterOptions): ASTNode[] {
    const newKey = JSON.stringify(options);
    // Eventuale controllo sul documento (se cambia, invalidare la cache)
    const currentDocumentHash = `${root.id}:${root.text}`;
    if (newKey === this.cacheKey && currentDocumentHash === this.lastDocumentHash) {
      return this.cacheResult;
    }

    const spec = this.buildSpecification(options);
    const result: ASTNode[] = [];
    for (const node of this.traverseAST(root)) {
      if (!spec || spec.isSatisfiedBy(node)) {
        result.push(node);
      }
    }

    this.cacheKey = newKey;
    this.lastDocumentHash = currentDocumentHash;
    this.cacheResult = result;
    return result;
  }
}