// src/core/utils/tdSearchUtils.ts
import { ASTNode, SectionNode, TaskNode } from '../../../core/services/tdParser/types';
import { cleanText } from '../../../core/services/tdParser/utils/textUtils';

/**
 * Determina se il nodo soddisfa il filtro specificato.
 */
export function matchesFilter(node: ASTNode, query: string): boolean {
  if (!query) return true;
  const q = query.trim().toLowerCase();
  if (q.startsWith("#")) {
    return filterSections(node, q.substring(1).trim());
  } else if (q.startsWith("@")) {
    return filterTasksByMeta(node, q.substring(1).trim());
  } else {
    return filterGeneric(node, q);
  }
}

/** Filtra solo le sezioni */
export function filterSections(node: ASTNode, filterText: string): boolean {
  if (node.type !== 'section') return false;
  const nodeText = ((node as SectionNode).title || cleanText(node.text)).toLowerCase();
  return nodeText.includes(filterText);
}

/** Filtra solo i task basandosi sui meta */
export function filterTasksByMeta(node: ASTNode, filterText: string): boolean {
  if (node.type !== 'task') return false;
  const task = node as TaskNode;
  if (!task.meta) return false;
  return Object.entries(task.meta).some(([key, value]) =>
    key.toLowerCase().includes(filterText) || String(value).toLowerCase().includes(filterText)
  );
}

/** Filtro generico sul testo e, per i task, anche su status, priority e meta */
export function filterGeneric(node: ASTNode, query: string): boolean {
  const nodeText = cleanText(node.text).toLowerCase();
  if (nodeText.includes(query)) return true;

  if (node.type === 'task') {
    const task = node as TaskNode;
    return matchTaskAttributes(task, query);
  }

  return false;
}

/** Controlla attributi specifici dei task */
export function matchTaskAttributes(task: TaskNode, query: string): boolean {
  return (
    (task.status && task.status.toLowerCase().includes(query)) ||
    (task.priority && task.priority.toLowerCase().includes(query)) ||
    (task.meta && Object.values(task.meta).some(val => String(val).toLowerCase().includes(query))) ||
    (task.notes && task.notes.some(note => cleanText(note.text).toLowerCase().includes(query)))
  );
}

/** Restituisce l'etichetta (label) da mostrare per il nodo */
export function getLabel(node: ASTNode): string {
  switch (node.type) {
    case 'section':
      return ((node as SectionNode).title || cleanText(node.text)).trim();
    case 'task':
      return cleanText(node.text);
    default:
      return cleanText(node.text);
  }
}

/** Restituisce la descrizione da mostrare per il nodo */
export function getDescription(node: ASTNode): string {
  switch (node.type) {
    case 'task': {
      const task = node as TaskNode;
      let desc = `[${task.status}] - ${task.priority}`;
      if (task.meta && Object.keys(task.meta).length > 0) {
        const metaStr = Object.entries(task.meta)
          .map(([key, value]) => `${key}: ${value}`)
          .join(', ');
        desc += ` | ${metaStr}`;
      }
      return desc;
    }
    case 'section':
      return `[SECTION]`;
    case 'note':
      return `[NOTE]`;
    default:
      return '';
  }
}

/** Restituisce il dettaglio (detail) del nodo (la riga) */
export function getDetail(node: ASTNode): string {
  return `Linea ${node.range.startLine + 1}`;
}

/**
 * Esegue una traversata ricorsiva dell'AST per raccogliere tutti i nodi che soddisfano il filtro.
 * Questa funzione viene usata per ottenere una lista piatta dei risultati per la QuickPick.
 */
export function extractFilteredNodes(root: ASTNode, query: string): ASTNode[] {
  const results: ASTNode[] = [];
  function traverse(node: ASTNode) {
    if (matchesFilter(node, query)) {
      results.push(node);
    }
    if (node.children && node.children.length > 0) {
      node.children.forEach(child => traverse(child));
    }
  }
  traverse(root);
  return results;
}