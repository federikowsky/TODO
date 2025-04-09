// src/infrastructure/vscode/sidebar/registerSidebar.ts
import * as vscode from 'vscode';
import { ASTDocumentService } from '../../../core/services/tdParser/ASTDocumentService';
import { TdTreeProviderService } from './TdTreeProviderService';
import { getLabel, getDescription, extractFilteredNodes } from './tdSearchUtils';

/**
 * Registra e configura la Sidebar per l'estensione TD.
 * Integra la QuickPick che funge da search box.
 * Mentre l'utente digita, la QuickPick mostra in tempo reale i risultati (con getLabel, getDescription, getDetail)
 * e contemporaneamente aggiorna la TreeView (sidebar) filtrando i nodi.
 */
export function registerSidebar(context: vscode.ExtensionContext): void {
  // const treeProviderService = TdTreeProviderService.getInstance();

  // // Registra la sidebar con l'id "td-sidebar" per il documento attivo
  // const activeEditor = vscode.window.activeTextEditor;
  // if (activeEditor && activeEditor.document.languageId === 'td') {
  //   const documentUri = activeEditor.document.uri.toString();
  //   const tdTreeProvider = treeProviderService.get(documentUri);
  //   vscode.window.registerTreeDataProvider('td-sidebar', tdTreeProvider);
  // }

  // // Comando "td.search": apre la QuickPick integrata nella sidebar
  // const searchCommand = vscode.commands.registerCommand('td.search', async () => {
  //   const activeEditor = vscode.window.activeTextEditor;
  //   if (!activeEditor || activeEditor.document.languageId !== 'td') return;

  //   const documentUri = activeEditor.document.uri.toString();
  //   const tdTreeProvider = treeProviderService.get(documentUri);

  //   const quickPick = vscode.window.createQuickPick<vscode.QuickPickItem>();
  //   quickPick.placeholder = 'Filtra nodi (sezioni: #, task meta: @, note: >, o filtro generico)';

  //   async function updateItems(filter: string) {
  //     tdTreeProvider.setFilter(filter);

  //     const astService = ASTDocumentService.getInstance();
  //     const astDoc = astService.has(documentUri) ? astService.get(documentUri, '') : null;
  //     if (!astDoc) {
  //       quickPick.items = [];
  //       return;
  //     }

  //     const filteredNodes = extractFilteredNodes(astDoc.getRoot(), filter);
  //     quickPick.items = filteredNodes.map(node => ({
  //       label: getLabel(node),
  //       description: getDescription(node),
  //     }));
  //   }

  //   quickPick.onDidChangeValue(async (value) => {
  //     await updateItems(value);
  //   });

  //   quickPick.onDidAccept(() => {
  //     quickPick.hide();
  //   });

  //   quickPick.onDidHide(() => {
  //     quickPick.dispose();
  //   });

  //   quickPick.show();
  //   await updateItems('');
  // });

  // // Registrazione degli eventi per aggiornare la sidebar in caso di cambiamenti nel documento o nell'editor attivo
  // context.subscriptions.push(
  //   searchCommand,
  //   vscode.workspace.onDidChangeTextDocument((event) => {
  //     const documentUri = event.document.uri.toString();
  //     if (treeProviderService.has(documentUri)) {
  //       const tdTreeProvider = treeProviderService.get(documentUri);
  //       tdTreeProvider.refresh();
  //     }
  //   }),
  //   vscode.window.onDidChangeActiveTextEditor((editor) => {
  //     if (editor && editor.document.languageId === 'td') {
  //       const documentUri = editor.document.uri.toString();
  //       const tdTreeProvider = treeProviderService.get(documentUri);
  //       vscode.window.registerTreeDataProvider('td-sidebar', tdTreeProvider);
  //     }
  //   }),
  //   vscode.workspace.onDidCloseTextDocument((document) => {
  //     const documentUri = document.uri.toString();
  //     if (treeProviderService.has(documentUri)) {
  //       treeProviderService.remove(documentUri);
  //     }
  //   })
  // );
}