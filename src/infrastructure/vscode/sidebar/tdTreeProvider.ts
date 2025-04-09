// src/infrastructure/vscode/sidebar/tdTreeProvider.ts
import * as vscode from 'vscode';
import { TdTreeItem } from './tdTreeItem';
import { ASTNode } from '../../../core/services/tdParser/types';
import { ASTDocumentService } from '../../../core/services/tdParser/ASTDocumentService';
import { matchesFilter } from './tdSearchUtils';

export class TdTreeProvider implements vscode.TreeDataProvider<ASTNode> {
  private readonly astService = ASTDocumentService.getInstance();
  private _onDidChangeTreeData = new vscode.EventEmitter<ASTNode | void>();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  private filterQuery: string = '';

  constructor(private documentUri: string) {}

  public setFilter(query: string): void {
    this.filterQuery = query.trim().toLowerCase();
    this.refresh();
  }

  public refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  public getTreeItem(element: ASTNode): vscode.TreeItem {
    const collapsibleState = this.getCollapsibleState(element);
    return new TdTreeItem(element, collapsibleState);
  }

  public async getChildren(element?: ASTNode): Promise<ASTNode[]> {
    const astDoc = this.astService.has(this.documentUri)
      ? this.astService.get(this.documentUri, '')
      : null;
    if (!astDoc) return [];
    const node: ASTNode = element || astDoc.getRoot();
    return node.children
      .filter(this.isRenderable)
      .filter(node => matchesFilter(node, this.filterQuery));
  }

  private isRenderable(node: ASTNode): boolean {
    // Esclude le note (sono usate solo in altri contesti)
    return node.type === 'section' || node.type === 'task';
  }

  private getCollapsibleState(node: ASTNode): vscode.TreeItemCollapsibleState {
    const hasRenderableChildren = node.children.some(child => this.isRenderable(child));
    return hasRenderableChildren
      ? vscode.TreeItemCollapsibleState.Expanded
      : vscode.TreeItemCollapsibleState.None;
  }
}