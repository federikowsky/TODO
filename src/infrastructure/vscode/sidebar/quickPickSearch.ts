// src/infrastructure/vscode/sidebar/quickPickSearch.ts
import * as vscode from 'vscode';
import { ASTDocumentService } from '../../../core/services/tdParser/ASTDocumentService';
import { ASTNode, TaskNode, SectionNode } from '../../../core/services/tdParser/types';
import { cleanText } from '../../../core/services/tdParser/utils/textUtils';

/**
 * Mostra la QuickPick per la ricerca rapida dei nodi (task e sezioni) nel documento TD.
 * Il filtraggio avviene in tempo reale basandosi su node.text e informazioni aggiuntive.
 */
export async function showQuickPickSearch(documentUri: string): Promise<void> {
  const astService = ASTDocumentService.getInstance();
  const astDoc = astService.has(documentUri)
    ? astService.get(documentUri, '')
    : null;

  if (!astDoc) {
    vscode.window.showInformationMessage('Documento TD non trovato.');
    return;
  }

  const nodes = extractRelevantNodes(astDoc.getRoot());
  if (nodes.length === 0) {
    vscode.window.showInformationMessage('Nessun task o sezione trovato.');
    return;
  }

  const items = createQuickPickItems(nodes);

  const selected = await vscode.window.showQuickPick(items, {
    placeHolder: 'Cerca task, sezioni o meta...',
    matchOnDescription: true,
    matchOnDetail: true
  });

  if (selected) {
    const node = nodes.find(n => getLabel(n) === selected.label && getDetail(n) === selected.detail);
    if (node) {
      vscode.commands.executeCommand('revealLine', {
        lineNumber: node.range.startLine,
        at: 'center'
      });
    }
  }
}

/**
 * Estrae ricorsivamente i nodi di interesse (task e sezioni) dall'albero AST.
 * @param root Nodo radice dell'AST.
 * @returns Array di TaskNode e SectionNode.
 */
function extractRelevantNodes(root: ASTNode): (TaskNode | SectionNode)[] {
  const collected: (TaskNode | SectionNode)[] = [];
  function traverse(node: ASTNode): void {
    switch (node.type) {
      case 'task':
      case 'section':
        collected.push(node as TaskNode | SectionNode);
        break;
    }
    if (node.children && node.children.length > 0) {
      node.children.forEach(child => traverse(child));
    }
  }
  traverse(root);
  return collected;
}

/**
 * Crea un array di QuickPickItem a partire dai nodi forniti.
 * @param nodes Array di nodi rilevanti.
 * @returns Array di QuickPickItem.
 */
function createQuickPickItems(nodes: (TaskNode | SectionNode)[]): vscode.QuickPickItem[] {
  return nodes.map(node => ({
    label: getLabel(node),
    description: getDescription(node),
    detail: getDetail(node)
  }));
}

/**
 * Restituisce il testo di visualizzazione del nodo.
 * Per le sezioni, se esiste il campo title lo utilizza, altrimenti si usa node.text.
 * Per i task, usa il campo node.text pulito.
 * @param node Il nodo AST.
 * @returns Il testo da mostrare.
 */
function getLabel(node: ASTNode): string {
  switch (node.type) {
    case 'section':
      return ((node as SectionNode).title || cleanText(node.text)).trim();
    case 'task':
      return cleanText(node.text);
    default:
      return cleanText(node.text);
  }
}

/**
 * Restituisce una descrizione aggiuntiva in base al tipo di nodo.
 * Per i task, include lo status, la priorità e i meta (se presenti).
 * Per le sezioni, indica semplicemente il tipo.
 * @param node Il nodo AST.
 * @returns La descrizione del nodo.
 */
function getDescription(node: ASTNode): string {
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
    default:
      return '';
  }
}

/**
 * Restituisce il dettaglio del nodo, in questo caso la riga in cui si trova.
 * @param node Il nodo AST.
 * @returns Una stringa con il numero di riga.
 */
function getDetail(node: ASTNode): string {
  return `Linea ${node.range.startLine + 1}`;
}