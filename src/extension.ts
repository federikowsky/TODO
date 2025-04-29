import * as vscode from 'vscode';
import { configSnippet } from './config/color';
import { promptEnableColors } from './infrastructure/vscode/messages';
import { strikethroughApply, toggleCheckbox } from './infrastructure/vscode/commands/toggleCheckbox';
import { setPriority } from './infrastructure/vscode/commands/setPriority';
import { togglePriority } from './infrastructure/vscode/commands/togglePriority';
import { applyDefaultsToBlock } from './infrastructure/vscode/commands/applyDefaultsToBlock';
import { setupDiagnostics } from './infrastructure/vscode/diagnostics';
import { tdDocumentSymbolProvider } from './infrastructure/vscode/tdDocumentProvider';
import { tdFoldingProvider, registerFoldingRefresh } from './infrastructure/vscode/tdFoldingProvider';
import { tdCompletionProvider } from './infrastructure/vscode/tdCompletionProvider';
import { registerAutoPriority } from './infrastructure/vscode/tdAutoPriority';
import { registerAutoInsertTask } from './infrastructure/vscode/tdAutoInsertTask';
import { registerWebviewView } from './infrastructure/vscode/webview/TdWebviewViewProvider';

export function activate(context: vscode.ExtensionContext) {
	console.log('td-todo estensione attiva!');

	const enableColors = vscode.commands.registerCommand('td-todo.enableColors', async () => {
		await vscode.env.clipboard.writeText(configSnippet);
		await vscode.commands.executeCommand('workbench.action.openSettingsJson');

		vscode.window.showInformationMessage(
			'🎨 Colori personalizzati copiati! Incolla il codice in settings.json per attivare il supporto colori per .td.',
			{ modal: true },
			'OK'
		);
	});
	
	// Mostra il messaggio all'utente solo una volta
	promptEnableColors(context);
	// Registra i messaggi di errore
	setupDiagnostics(context);
	// Attiva il supporto per la priorità automatica
	registerAutoPriority(context);
	// Attiva l'inserimento automatico di task
	registerAutoInsertTask(context);
	// Attiva il refresh delle folding
	registerFoldingRefresh(context);
	// Attiva la webview
	registerWebviewView(context);

	// Aggiungi un listener per aggiornare le decorazioni strikethrough
    context.subscriptions.push(
        vscode.workspace.onDidChangeTextDocument(() => {
            strikethroughApply();
        }),
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