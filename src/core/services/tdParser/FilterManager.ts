// src/core/services/tdParser/FilterManager.ts
import { ASTNode } from './types';
import { IFilterSpecification } from './filters/IFilterSpecification';
import { SectionFilter } from './filters/SectionFilter';
import { MetaTagFilter } from './filters/MetaTagFilter';
import { TaskStatusFilter } from './filters/TaskStatusFilter';
import { TaskPriorityFilter } from './filters/TaskPriorityFilter';
import { TaskNotesFilter } from './filters/TaskNotesFilter';
import { TextSearchFilter } from './filters/TextSearchFilter';
import { cleanText } from './utils/textUtils';

export interface FilterOptions {
  sections?: boolean; // Include sezioni e sub-sezioni
  metaTag?: { key: string; value?: string | boolean };
  status?: 'todo' | 'done';
  priority?: 'none' | 'low' | 'medium' | 'high';
  hasNotes?: boolean;
  search?: string;
}

/**
 * FilterManager: gestisce il filtraggio dell’AST.
 * Usa un caching interno per ottimizzare il processo.
 */
export class FilterManager {
  private cacheKey: string = '';
  private cacheResult: ASTNode[] = [];
  private cacheResultTree: ASTNode | null = null;
  private lastDocumentHash: string = '';

  // Generator per iterare l'AST in modo lazy
  private *traverseAST(root: ASTNode): Generator<ASTNode> {
    const stack: ASTNode[] = [root];
    while (stack.length) {
      const node = stack.pop()!;
      yield node;
      if (node.children && node.children.length > 0) {
        for (let i = node.children.length - 1; i >= 0; i--) {
          stack.push(node.children[i]);
        }
      }
    }
  }

  // Costruisce la specifica composta in base alle opzioni
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
    if (options.search && options.search.trim() !== '') {
      const searchSpec = new TextSearchFilter(options.search);
      spec = spec ? spec.and(searchSpec) : searchSpec;
    }
    return spec;
  }

  /**
   * Restituisce un nuovo AST filtrato, mantenendo la struttura gerarchica.
   * I nodi che non soddisfano il filtro e non hanno figli filtrati vengono esclusi.
   */
  public getFilteredTree(root: ASTNode, options: FilterOptions): ASTNode | null {
    const newKey = 'tree:' + JSON.stringify(options);
    const currentDocumentHash = `${root.id}:${root.text}`;
    if (newKey === this.cacheKey && currentDocumentHash === this.lastDocumentHash) {
      return this.cacheResultTree as ASTNode | null;
    }

    const spec = this.buildSpecification(options);
    // Funzione ricorsiva per filtrare l'albero
    const filterNode = (node: ASTNode): ASTNode | null => {
      if (!node.children || node.children.length === 0) {
        // Nodo foglia: includi solo se soddisfa il filtro
        return !spec || spec.isSatisfiedBy(node) 
        ? { ...node, text: cleanText(node.text), children: [] }
        : null;
      }
      // Filtra ricorsivamente i figli
      const filteredChildren = node.children
        .map(filterNode)
        .filter((child): child is ASTNode => child !== null);

      // Includi il nodo se soddisfa il filtro o ha figli filtrati
      if ((!spec || spec.isSatisfiedBy(node)) || filteredChildren.length > 0) {
        return {
          ...node,
          text: cleanText(node.text),
          children: filteredChildren
        };
      }
      return null;
    };

    const filteredTree = filterNode(root);

    this.cacheKey = newKey;
    this.lastDocumentHash = currentDocumentHash;
    this.cacheResultTree = filteredTree;
    return filteredTree;
  }

  /**
   * Restituisce i nodi filtrati, usando caching se possibile.
   */
  public getFilteredNodes(root: ASTNode, options: FilterOptions): ASTNode[] {
    const newKey = JSON.stringify(options);
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