import * as vscode from 'vscode';
import * as path from 'path';
import { configSnippet } from './config/color';
import { promptEnableColors } from './infrastructure/vscode/messages';
import { strikethroughApply, toggleCheckbox } from './infrastructure/vscode/commands/toggleCheckbox';
import { setPriority } from './infrastructure/vscode/commands/setPriority';
import { togglePriority } from './infrastructure/vscode/commands/togglePriority';
import { applyDefaultsToBlock } from './infrastructure/vscode/commands/applyDefaultsToBlock';
// import { setupDiagnostics } from './infrastructure/vscode/diagnostics';
import { tdDocumentSymbolProvider } from './infrastructure/vscode/tdDocumentProvider';
import { tdFoldingProvider, registerFoldingRefresh } from './infrastructure/vscode/tdFoldingProvider';
import { tdCompletionProvider } from './infrastructure/vscode/tdCompletionProvider';
import { registerAutoPriority } from './infrastructure/vscode/tdAutoPriority';
import { registerAutoInsertTask } from './infrastructure/vscode/tdAutoInsertTask';
import { FileLinkProvider } from './infrastructure/vscode/fileLinkProvider';
import { TagCache } from './infrastructure/vscode/tagCache';

export function activate(context: vscode.ExtensionContext) {
	console.log('td-todo estensione attiva!');

	// Inizializza cache dei tag personalizzati
	TagCache.initialize(context);
	
	const enableColors = vscode.commands.registerCommand('td-todo.enableColors', async () => {
		await vscode.env.clipboard.writeText(configSnippet);
		await vscode.commands.executeCommand('workbench.action.openSettingsJson');

		vscode.window.showInformationMessage(
			'🎨 Colori personalizzati copiati! Incolla il codice in settings.json per attivare il supporto colori per .td.',
			{ modal: true },
			'OK'
		);
	});
	
	// Auto-detect files named "TODO" without extension and set language to 'td'
	context.subscriptions.push(
		vscode.workspace.onDidOpenTextDocument(doc => {
			if (path.basename(doc.uri.fsPath) === 'TODO') {
				vscode.languages.setTextDocumentLanguage(doc, 'td');
			}
		})
	);
	// Apply for any already opened TODO files
	vscode.workspace.textDocuments.forEach(doc => {
		if (path.basename(doc.uri.fsPath) === 'TODO') {
			vscode.languages.setTextDocumentLanguage(doc, 'td');
		}
	});

	// Mostra il messaggio all'utente solo una volta
	promptEnableColors(context);
	// Registra i messaggi di errore
	// setupDiagnostics(context);
	// Attiva il supporto per la priorità automatica
	registerAutoPriority(context);
	// Attiva l'inserimento automatico di task
	registerAutoInsertTask(context);
	// Attiva il refresh delle folding
	registerFoldingRefresh(context);

	// Aggiungi un listener per aggiornare le decorazioni strikethrough
    context.subscriptions.push(
        vscode.workspace.onDidChangeTextDocument(() => {
            strikethroughApply();
        }),
    );

	// Registra il provider modulare per @file
    const rootPath = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
    context.subscriptions.push(
        vscode.languages.registerDocumentLinkProvider(
            { language: 'td' },
            new FileLinkProvider(rootPath)
        )
    );

	// Registra i comandi dell'estensione
	context.subscriptions.push(
		enableColors,
		vscode.commands.registerCommand('td-todo.toggleCheckbox', toggleCheckbox),
		vscode.commands.registerCommand('td-todo.togglePriority', togglePriority),
		vscode.commands.registerCommand('td-todo.setPriorityHigh', () => setPriority('!')),
		vscode.commands.registerCommand('td-todo.setPriorityMedium', () => setPriority('~')),
		vscode.commands.registerCommand('td-todo.setPriorityNone', () => setPriority(' ')),
		vscode.commands.registerCommand('td-todo.applyDefaultsToBlock', applyDefaultsToBlock),
		// ✅ Completion
		vscode.languages.registerDocumentSymbolProvider({ language: 'td' }, tdDocumentSymbolProvider),
		vscode.languages.registerFoldingRangeProvider({ language: 'td' }, tdFoldingProvider),
		vscode.languages.registerCompletionItemProvider({ language: 'td' }, tdCompletionProvider, '@'),
	);
}

export function deactivate() { }