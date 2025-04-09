import * as vscode from 'vscode';
import { ASTNode, TaskNode } from '../../../core/services/tdParser/types';
import { cleanText } from '../../../core/services/tdParser/utils/textUtils';

export class TdTreeItem extends vscode.TreeItem {
  constructor(
    public readonly node: ASTNode,
    collapsibleState: vscode.TreeItemCollapsibleState
  ) {
    super(TdTreeItem.getLabel(node), collapsibleState);

    this.description = undefined; // Nessun troncamento
    this.tooltip = TdTreeItem.getTooltip(node);
    this.iconPath = TdTreeItem.getIconPath(node);

    if (node.type === 'task') {
      this.command = {
        command: 'revealLine',
        title: 'Vai al Task',
        arguments: [{ lineNumber: node.range.startLine, at: 'center' }]
      };
    }
  }

  /**
   * Label con ✏️ se ci sono note.
   */
  static getLabel(node: ASTNode): string {
    const baseLabel = cleanText(node.text).trim();

    if (node.type === 'task') {
      const task = node as TaskNode;
      if (task.notes && task.notes.length > 0) {
        return `✏️ ${baseLabel}`;
      }
    }

    return baseLabel;
  }

  /**
   * Tooltip in formato richiesto:
   * @meta1, @meta2, @meta3(...)
   *
   * Testo delle note joinato con '\n'
   */
  static getTooltip(node: ASTNode): vscode.MarkdownString | string {
    if (node.type !== 'task') {
      return `[${node.type.toUpperCase()}] ${cleanText(node.text).trim()}`;
    }

    const task = node as TaskNode;

    // Estrai e formatta i metatag (@meta, @prio(...), ecc.)
    const metaTags = task.meta
      ? Object.entries(task.meta).map(([key, value]) =>
          value === true ? `@${key}` : `@${key}(${value})`
        )
      : [];

    // Prima riga: metatag separati da virgola
    const metaLine = metaTags.join(', ');

    // Testo delle note come testo unico joinato con '\n'
    const notesText = task.notes && task.notes.length > 0
      ? Array.from(task.notes.values())
          .map(note => cleanText(note.text).trim())
          .join('\n')
      : '';

    // Combina meta e note come richiesto
    const fullTooltip = metaLine
      ? `${metaLine}\n\n${notesText}`
      : notesText;

    const markdownTooltip = new vscode.MarkdownString(fullTooltip.trim());
    markdownTooltip.isTrusted = true;

    return markdownTooltip;
  }

  /**
   * Icone invariate.
   */
  static getIconPath(node: ASTNode): vscode.ThemeIcon | undefined {
    if (node.type === 'task') {
      const task = node as TaskNode;
      if (task.status === 'done') {
        return new vscode.ThemeIcon('check-all');
      }
      switch (task.priority) {
        case 'high':
          return new vscode.ThemeIcon('debug-breakpoint-log', new vscode.ThemeColor('charts.red'));
        case 'medium':
          return new vscode.ThemeIcon('debug-breakpoint-log', new vscode.ThemeColor('charts.yellow'));
        default:
          return new vscode.ThemeIcon('debug-breakpoint-log', new vscode.ThemeColor('charts.blue'));
      }
    }

    if (node.type === 'section') {
      return new vscode.ThemeIcon('symbol-number', new vscode.ThemeColor('charts.purple'));
    }

    return undefined;
  }
}