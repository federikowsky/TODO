import * as vscode from 'vscode';
import { toggleCheckbox } from './commands/toggleCheckbox';
import { setPriority } from './commands/setPriority';
import { togglePriority } from './commands/togglePriority';
import { promptEnableColors } from './infrastructure/vscode/messages';
import { configSnippet } from './config/color';
import { tdDocumentSymbolProvider } from './infrastructure/vscode/tdDocumentProvider';
import { tdFoldingProvider } from './infrastructure/vscode/tdFoldingProvider';
import { setupDiagnostics } from './infrastructure/vscode/diagnostics';
import { tdCompletionProvider } from './infrastructure/vscode/tdCompletionProvider';
import { registerAutoPriority } from './infrastructure/vscode/tdAutoPriority';
import { applyDefaultsToBlock } from './commands/applyDefaultsToBlock';
import { registerAutoInsertTask } from './infrastructure/vscode/tdAutoInsertTask';

const strikethroughDecoration = vscode.window.createTextEditorDecorationType({
  textDecoration: 'line-through',
});

function strikethroughApply() {

	const editor = vscode.window.activeTextEditor;
	if (!editor) return;

	const doc = editor.document;
	const decorations: vscode.DecorationOptions[] = [];

	for (let i = 0; i < doc.lineCount; i++) {
		const lineText = doc.lineAt(i).text;
		const match = /^(\s*)- \[X\](.*)$/.exec(lineText);
		if (match) {
			const indent = match[1];
			const content = match[2];
			const start = new vscode.Position(i, indent.length + 6); // dopo "- [X] "
			const end = new vscode.Position(i, lineText.length);
			decorations.push({ range: new vscode.Range(start, end) });
		}
	}

	editor.setDecorations(strikethroughDecoration, decorations);
}

export function activate(context: vscode.ExtensionContext) {
	console.log('td-todo estensione attiva!');

	// ✅ Document Symbols (Outline)
	const symbolProvider = vscode.languages.registerDocumentSymbolProvider({ language: 'td' }, {
		provideDocumentSymbols(document) {
			const symbols: vscode.DocumentSymbol[] = [];

			for (let i = 0; i < document.lineCount; i++) {
				const line = document.lineAt(i);
				if (line.text.startsWith('#')) {
					const title = line.text.replace(/^#+\s*/, '').trim();
					const symbol = new vscode.DocumentSymbol(
						title,
						'',
						vscode.SymbolKind.Namespace,
						line.range,
						line.range
					);
					symbols.push(symbol);
				}
			}

			return symbols;
		}
	});

	// ✅ Folding (solo su intestazioni `#`)
	const foldingProvider = vscode.languages.registerFoldingRangeProvider({ language: 'td' }, {
		provideFoldingRanges(document) {
			const ranges: vscode.FoldingRange[] = [];
			let start: number | null = null;

			for (let i = 0; i < document.lineCount; i++) {
				const line = document.lineAt(i);
				if (line.text.startsWith('#')) {
					if (start !== null && i > start + 1) {
						ranges.push(new vscode.FoldingRange(start, i - 1));
					}
					start = i;
				}
			}

			// chiudi l’ultimo blocco se serve
			if (start !== null && start < document.lineCount - 1) {
				ranges.push(new vscode.FoldingRange(start, document.lineCount - 1));
			}

			return ranges;
		}
	});

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
	

	// Aggiungi un listener per aggiornare le decorazioni strikethrough
    context.subscriptions.push(
        vscode.workspace.onDidChangeTextDocument(() => {
            strikethroughApply();
        }),
		
    );

	// Registra i comandi dell'estensione
	context.subscriptions.push(
		symbolProvider,
		foldingProvider,
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