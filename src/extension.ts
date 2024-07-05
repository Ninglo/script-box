import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as vm from 'vm';
import { ScriptTreeDataProvider, ScriptTreeItem } from './scriptTreeView';

export function activate(context: vscode.ExtensionContext) {
	const scriptsDir = path.join(context.globalStorageUri.fsPath, 'scripts');
	if (!fs.existsSync(scriptsDir)) {
		fs.mkdirSync(scriptsDir, { recursive: true });
	}

	context.subscriptions.push(vscode.commands.registerCommand('script-box.addScript', async () => {
		const name = await vscode.window.showInputBox({ prompt: '脚本名称' });
		if (name) {
			const filePath = path.join(scriptsDir, name);
			fs.writeFileSync(filePath, '');
			const document = await vscode.workspace.openTextDocument(filePath);
			await vscode.window.showTextDocument(document);
		}
	}));

	context.subscriptions.push(vscode.commands.registerCommand('script-box.editScript', async (scriptPath: string) => {
		const filePath = path.join(scriptsDir, scriptPath)
		const document = await vscode.workspace.openTextDocument(filePath)
		await vscode.window.showTextDocument(document)
	}));

	context.subscriptions.push(vscode.commands.registerCommand('script-box.deleteScript', async () => {
		const name = await vscode.window.showQuickPick(fs.readdirSync(scriptsDir), { placeHolder: '选择一个脚本' });
		if (name) {
			fs.unlinkSync(path.join(scriptsDir, name));
		}
	}));

	context.subscriptions.push(vscode.commands.registerCommand('script-box.runScript', () => {
		const editor = vscode.window.activeTextEditor;
		if (editor) {
			const code = editor.document.getText();
			try {
				const script = new vm.Script(code, { filename: editor.document.fileName });
				const context = vm.createContext({ vscode });
				script.runInContext(context);

				console.log(context)
			} catch (error) {
				const errorMsg = error instanceof Error ? error.message : String(error)
				vscode.window.showErrorMessage(`执行脚本时出错: ${errorMsg}`);
			}
		}
	}));

	context.subscriptions.push(vscode.commands.registerCommand('script-box.renameScript', async (item: ScriptTreeItem) => {
		const newName = await vscode.window.showInputBox({ prompt: '新的脚本名称' });
		if (newName) {
			fs.renameSync(path.join(scriptsDir, item.label), path.join(scriptsDir, newName));
			treeDataProvider.refresh();
		}
	}));

	const treeDataProvider = new ScriptTreeDataProvider(scriptsDir);
	const treeView = vscode.window.createTreeView('scriptBox', { treeDataProvider });
	treeView.onDidChangeSelection(async e => {
		const filePath = path.join(scriptsDir, e.selection[0].label)
		const document = await vscode.workspace.openTextDocument(filePath)
		await vscode.window.showTextDocument(document)
	})
	context.subscriptions.push(vscode.commands.registerCommand('script-box.refresh', () => treeDataProvider.refresh()));
}

export function deactivate() { }
