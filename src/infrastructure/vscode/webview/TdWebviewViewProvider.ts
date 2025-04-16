import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { FilterManager, FilterOptions } from '../../../core/services/tdParser/FilterManager';
import { ASTNode } from '../../../core/services/tdParser/types';
import { serializeAST } from '../../../core/services/tdParser/utils/astUtils';
import { ASTDocumentService } from '../../../core/services/tdParser/ASTDocumentService';

export function registerWebviewView(context: vscode.ExtensionContext): void {
  const provider = new TdWebviewViewProvider(context);
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      TdWebviewViewProvider.viewType,
      provider,
      { webviewOptions: { retainContextWhenHidden: true } }
    )
  );
}

export class TdWebviewViewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'td-todo.tdWebFilters';

  private _view?: vscode.WebviewView;
  private currentDocumentUri: string | null = null;
  private readonly astService = ASTDocumentService.getInstance();
  private readonly filterManager = new FilterManager();

  constructor(private readonly context: vscode.ExtensionContext) {
    vscode.workspace.onDidChangeTextDocument(this.onDidChangeTextDocument, this, context.subscriptions);
    vscode.window.onDidChangeActiveTextEditor(this.onDidChangeActiveTextEditor, this, context.subscriptions);
  }

  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    _context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ): void {
    this._view = webviewView;
    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [vscode.Uri.file(path.join(this.context.extensionPath, 'media', 'webview'))],
    };

    this.setActiveTdDocument();
    const ast = this.getCurrentAst();
    webviewView.webview.html = this.getHtmlForWebview(webviewView.webview, ast);
    this.initializeMessageListener(webviewView);
  }

  // --- Live sync: aggiorna la sidebar quando il file .td viene modificato ---
  private onDidChangeTextDocument(event: vscode.TextDocumentChangeEvent): void {
    if (!this.isTdDocument(event.document)) return;
    if (!this.isCurrentDocument(event.document.uri)) return;
    this.sendAstToWebview();
  }

  // --- Live sync: aggiorna la sidebar quando si cambia file attivo ---
  private onDidChangeActiveTextEditor(editor: vscode.TextEditor | undefined): void {
    if (!editor || !this.isTdDocument(editor.document)) return;
    this.currentDocumentUri = editor.document.uri.toString();
    this.sendAstToWebview();
  }

  // --- Invio AST aggiornato alla webview ---
  private sendAstToWebview(): void {
    if (!this._view) return;
    const ast = this.getCurrentAst();
    this._view.webview.postMessage({ type: 'ast-update', ast });
  }

  // --- Recupera l'AST corrente ---
  private getCurrentAst(): ASTNode | null {
    if (!this.currentDocumentUri) return null;
    const doc = vscode.workspace.textDocuments.find(
      d => d.uri.toString() === this.currentDocumentUri
    );
    if (!doc) return null;
    const astDoc = this.astService.get(this.currentDocumentUri, doc.getText());
    return astDoc.getRoot();
  }

  // --- Helpers per documenti .td ---
  private isTdDocument(doc: vscode.TextDocument): boolean {
    return doc.languageId === 'td';
  }
  private isCurrentDocument(uri: vscode.Uri): boolean {
    return this.currentDocumentUri === uri.toString();
  }

  // --- HTML e risorse ---
  private getHtmlForWebview(webview: vscode.Webview, ast: ASTNode | null): string {
    const htmlPath = path.join(this.context.extensionPath, 'media', 'webview', 'src', 'ui', 'templates', 'index.html');
    let html = fs.readFileSync(htmlPath, 'utf8');
    const injection = `<script>window.initialAst = ${serializeAST(ast)};</script>`;
    html = html.replace('</head>', injection + '\n</head>');
    const htmlDir = path.dirname(htmlPath);
    html = html.replace(/(src|href)="((?:\.\.\/|\.\/)*)([^"]+)"/g, (match, attr, relativePath, file) => {
      const resolvedPath = path.resolve(htmlDir, relativePath || '', file);
      const resourceUri = webview.asWebviewUri(vscode.Uri.file(resolvedPath));
      return `${attr}="${resourceUri}"`;
    });
    return html;
  }

  // --- Message passing webview <-> extension ---
  private initializeMessageListener(webviewView: vscode.WebviewView): void {
    webviewView.webview.onDidReceiveMessage(
      (msg) => this.handleMessage(msg, webviewView),
      undefined,
      this.context.subscriptions
    );
  }

  private handleMessage(msg: { command: string; [key: string]: any }, webviewView: vscode.WebviewView): void {
    switch (msg.command) {
      case 'applyFilters':
        this.applyFiltersAndSendResults(msg.filters, webviewView);
        break;
      case 'revealLine':
        this.revealLineInEditor(msg.line);
        break;
      default:
        break;
    }
  }

  private applyFiltersAndSendResults(filters: FilterOptions, webviewView: vscode.WebviewView): void {
    if (!this.currentDocumentUri) return;
    const ast = this.getCurrentAst();
    if (!ast) return;
    const filteredNodes = this.filterManager.getFilteredNodes(ast, filters);
    webviewView.webview.postMessage({
      command: 'updateResults',
      nodes: filteredNodes.map((node: ASTNode) => ({
        line: node.range.startLine,
        text: node.text,
      })),
    });
  }

  private async revealLineInEditor(line: number): Promise<void> {
    if (!this.currentDocumentUri) return;
    const docUri = vscode.Uri.parse(this.currentDocumentUri);
    const editors = vscode.window.visibleTextEditors.filter(
      (editor) => editor.document.uri.toString() === docUri.toString()
    );
    if (editors.length === 0) {
      const doc = await vscode.workspace.openTextDocument(docUri);
      const editor = await vscode.window.showTextDocument(doc, { preview: false });
      this.revealLine(editor, line);
    } else {
      this.revealLine(editors[0], line);
    }
  }

  private revealLine(editor: vscode.TextEditor, line: number): void {
    const position = new vscode.Position(line, 0);
    editor.selection = new vscode.Selection(position, position);
    editor.revealRange(new vscode.Range(position, position), vscode.TextEditorRevealType.InCenter);
  }

  private setActiveTdDocument(): void {
    const editor = vscode.window.activeTextEditor;
    if (editor && this.isTdDocument(editor.document)) {
      this.currentDocumentUri = editor.document.uri.toString();
    }
  }
}