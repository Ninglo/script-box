import * as vscode from 'vscode';
import * as vm from 'vm';
import { ScriptTreeDataProvider, ScriptTreeItem } from './scriptTreeView';

const Uri = vscode.Uri;
const fs = vscode.workspace.fs;

export async function activate(context: vscode.ExtensionContext) {
	context.globalStorageUri;
	const scriptsDir = vscode.Uri.joinPath(context.globalStorageUri, 'scripts');
	await fs.createDirectory(scriptsDir);

	context.subscriptions.push(vscode.commands.registerCommand('script-box.addScript', async () => {
		const name = await vscode.window.showInputBox({ prompt: '脚本名称' });
		if (name) {
			const filePath = Uri.joinPath(scriptsDir, name);
			await fs.writeFile(filePath, new Uint8Array());
			const document = await vscode.workspace.openTextDocument(filePath);
			await vscode.window.showTextDocument(document);
		}
	}));

	context.subscriptions.push(vscode.commands.registerCommand('script-box.editScript', async (scriptPath: string) => {
		const filePath = Uri.joinPath(scriptsDir, scriptPath);
		const document = await vscode.workspace.openTextDocument(filePath);
		await vscode.window.showTextDocument(document);
	}));

	context.subscriptions.push(vscode.commands.registerCommand('script-box.deleteScript', async (item: ScriptTreeItem) => {
		if (item.label) {
			await fs.delete(Uri.joinPath(scriptsDir, item.label));
		}
	}));

	context.subscriptions.push(vscode.commands.registerCommand('script-box.runScript', async (item?: ScriptTreeItem) => {
		let code = '';
		if (item) {
			const unit8Array = await fs.readFile(Uri.joinPath(scriptsDir, item.label));
			code = new TextDecoder().decode(unit8Array);
		} else {
			const editor = vscode.window.activeTextEditor;
			if (editor) {
				code = editor.document.getText();
			} else {
				return;
			}
		}

		try {
			const script = new vm.Script(code, { filename: 'script.js' });
			const context = vm.createContext({ vscode });
			script.runInContext(context);

			console.log(context);
		} catch (error) {
			const errorMsg = error instanceof Error ? error.message : String(error);
			vscode.window.showErrorMessage(`执行脚本时出错: ${errorMsg}`);
		}
	}));

	context.subscriptions.push(vscode.commands.registerCommand('script-box.renameScript', async (item: ScriptTreeItem) => {
		const newName = await vscode.window.showInputBox({ prompt: '新的脚本名称' });
		if (newName) {
			fs.rename(Uri.joinPath(scriptsDir, item.label), Uri.joinPath(scriptsDir, newName));
			treeDataProvider.refresh();
		}
	}));

	const treeDataProvider = new ScriptTreeDataProvider(scriptsDir);
	const treeView = vscode.window.createTreeView('scriptBox', { treeDataProvider });
	treeView.onDidChangeSelection(async e => {
		const filePath = Uri.joinPath(scriptsDir, e.selection[0].label);
		const document = await vscode.workspace.openTextDocument(filePath);
		await vscode.window.showTextDocument(document);
	});
	context.subscriptions.push(vscode.commands.registerCommand('script-box.refresh', () => treeDataProvider.refresh()));
}

export function deactivate() { }
