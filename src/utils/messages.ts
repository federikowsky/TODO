import * as vscode from 'vscode';

function promptEnableColors(context: vscode.ExtensionContext) {
    const hasPrompted = context.globalState.get<boolean>('td.colors.prompted');
    if (!hasPrompted) {
        vscode.window.showInformationMessage(
            'Vuoi attivare il supporto ai colori personalizzati per i file .td?',
            'Attiva ora',
            'Non ora'
        ).then(async (selection) => {
            if (selection === 'Attiva ora') {
                await vscode.commands.executeCommand('td-todo.enableColors');
            }
        });
        context.globalState.update('td.colors.prompted', true);
    }
}

export { promptEnableColors };