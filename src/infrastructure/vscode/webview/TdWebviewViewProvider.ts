// src/infrastructure/vscode/webview/TdWebviewViewProvider.ts
import * as vscode from 'vscode';
import * as fs from 'fs';
import { FilterManager, FilterOptions } from '../../../core/services/tdParser/FilterManager';
import { ASTNode } from '../../../core/services/tdParser/types';
import { ASTDocumentService } from '../../../core/services/tdParser/ASTDocumentService';

export class TdWebviewViewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'td-todo.tdWebFilters';

  private _view?: vscode.WebviewView;
  private currentDocumentUri: string | null = null;
  private readonly astService = ASTDocumentService.getInstance();
  private readonly filterManager = new FilterManager();

  constructor(private readonly context: vscode.ExtensionContext) {}

  public static register(context: vscode.ExtensionContext): void {
    const provider = new TdWebviewViewProvider(context);
    const registration = vscode.window.registerWebviewViewProvider(TdWebviewViewProvider.viewType, provider);
    context.subscriptions.push(registration);
  }

  /**
   * Invocato da VSCode alla creazione o riapertura della webview.
   */
  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    _context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ): void {
    this._view = webviewView;
    webviewView.webview.options = { enableScripts: true };

    webviewView.webview.html = this.getHtmlForWebview(webviewView.webview);
    this.initializeMessageListener(webviewView);
    this.initializeAst();
  }

  /**
   * Imposta il listener per i messaggi provenienti dal front-end.
   */
  private initializeMessageListener(webviewView: vscode.WebviewView): void {
    webviewView.webview.onDidReceiveMessage(
      msg => this.handleMessage(msg, webviewView),
      undefined,
      this.context.subscriptions
    );
  }

  /**
   * Legge l'HTML, sostituisce i riferimenti relativi e restituisce il contenuto finale.
   */
  private getHtmlForWebview(webview: vscode.Webview): string {
    const htmlPath = vscode.Uri.joinPath(this.context.extensionUri, 'media', 'webview', 'index.html');
    const cssUri = webview.asWebviewUri(vscode.Uri.joinPath(this.context.extensionUri, 'media', 'webview', 'style.css'));
    const jsUri = webview.asWebviewUri(vscode.Uri.joinPath(this.context.extensionUri, 'media', 'webview', 'bundle.js'));

    let html = fs.readFileSync(htmlPath.fsPath, 'utf8');
    html = html.replace('./style.css', cssUri.toString());
    html = html.replace('./bundle.js', jsUri.toString());
    return html;
  }

  /**
   * Gestisce i messaggi in arrivo dalla webview.
   */
  private handleMessage(
    msg: { command: string; [key: string]: any },
    webviewView: vscode.WebviewView
  ): void {
    switch (msg.command) {
      case 'applyFilters':
        this.applyFiltersAndSendResults(msg.filters, webviewView);
        break;
      case 'revealLine':
        this.revealLineInEditor(msg.line);
        break;
      default:
        console.warn(`Comando non gestito: ${msg.command}`);
        break;
    }
  }

  /**
   * Invia l'AST iniziale alla webview, utile per il bootstrap lato React.
   */
  private initializeAst(): void {
    this.setActiveTdDocument();
    if (!this.currentDocumentUri) {
      return;
    }
    const astDoc = this.astService.get(this.currentDocumentUri, '');
    if (!astDoc) {
      return;
    }
    const root = astDoc.getRoot();
    this._view?.webview.postMessage({ command: 'initAst', ast: root });
  }

  /**
   * Applica i filtri usando FilterManager e invia i nodi filtrati alla webview.
   */
  private applyFiltersAndSendResults(filters: FilterOptions, webviewView: vscode.WebviewView): void {
    if (!this.currentDocumentUri) {
      return;
    }
    const astDoc = this.astService.get(this.currentDocumentUri, '');
    if (!astDoc) {
      return;
    }
    const root = astDoc.getRoot();
    const filteredNodes = this.filterManager.getFilteredNodes(root, filters);

    // Invia i dati minimizzati alla webview
    webviewView.webview.postMessage({
      command: 'updateResults',
      nodes: filteredNodes.map((node: ASTNode) => ({ line: node.range.startLine, text: node.text }))
    });
  }

  /**
   * Rivela la riga specificata nell'editor, aprendo il documento se necessario.
   */
  private async revealLineInEditor(line: number): Promise<void> {
    if (!this.currentDocumentUri) {
      return;
    }
    const docUri = vscode.Uri.parse(this.currentDocumentUri);
    const editors = vscode.window.visibleTextEditors.filter(editor => editor.document.uri.toString() === docUri.toString());
    if (editors.length === 0) {
      const doc = await vscode.workspace.openTextDocument(docUri);
      const editor = await vscode.window.showTextDocument(doc, { preview: false });
      this.revealLine(editor, line);
    } else {
      this.revealLine(editors[0], line);
    }
  }

  /**
   * Imposta la selezione e rivela la riga nell'editor.
   */
  private revealLine(editor: vscode.TextEditor, line: number): void {
    const position = new vscode.Position(line, 0);
    editor.selection = new vscode.Selection(position, position);
    editor.revealRange(new vscode.Range(position, position), vscode.TextEditorRevealType.InCenter);
  }

  /**
   * Imposta l'URI del documento attivo se il file è di tipo .td.
   */
  private setActiveTdDocument(): void {
    const editor = vscode.window.activeTextEditor;
    if (editor && editor.document.languageId === 'td') {
      this.currentDocumentUri = editor.document.uri.toString();
    }
  }
}