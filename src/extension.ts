import * as vscode from 'vscode';
import * as vm from 'vm';
import { ScriptBoxProvider } from './scriptBoxProvider';

const Uri = vscode.Uri;
const fs = vscode.workspace.fs;

class Result<T> {
	result?: T;

	set(result: T) {
		this.result = result;
	}
}

export async function activate(context: vscode.ExtensionContext) {
	const scriptsDir = vscode.Uri.joinPath(context.globalStorageUri, 'scripts');
	await fs.createDirectory(scriptsDir);
	const provider = new ScriptBoxProvider(scriptsDir);

	context.subscriptions.push(vscode.commands.registerCommand('script-box.new-script', async () => {
		const name = await vscode.window.showInputBox({ prompt: '脚本名称' });
		if (name) {
			const filePath = Uri.joinPath(scriptsDir, name);
			await fs.writeFile(filePath, new Uint8Array());
			provider.refresh();

			const document = await vscode.workspace.openTextDocument(filePath);
			await vscode.window.showTextDocument(document);
		}
	}));

	context.subscriptions.push(vscode.commands.registerCommand('script-box.deleteScript', async (uri?: vscode.Uri) => {
		if (uri) {
			await fs.delete(uri);
			provider.refresh();
		}
	}));

	context.subscriptions.push(vscode.commands.registerCommand('script-box.runScript', async (uri?: vscode.Uri) => {
		if (!uri) { return; }

		const data = await vscode.workspace.fs.readFile(uri);
		const code = new TextDecoder().decode(data);

		try {
			const result = new Result();
			const context = vm.createContext({ vscode, result });
			const script = new vm.Script(code, { filename: 'script.js' });
			script.runInContext(context);

			console.log(result.result);
		} catch (error) {
			const errorMsg = error instanceof Error ? error.message : String(error);
			vscode.window.showErrorMessage(`执行脚本时出错: ${errorMsg}`);
		}
	}));

	context.subscriptions.push(vscode.commands.registerCommand('script-box.renameScript', async (uri?: vscode.Uri) => {
		if (!uri) { return; }

		const newName = await vscode.window.showInputBox({ prompt: '新的脚本名称' });
		if (newName) {
			fs.rename(uri, Uri.joinPath(scriptsDir, newName));
			provider.refresh();
		}
	}));

	context.subscriptions.push(vscode.commands.registerCommand('script-box.refresh', () => provider.refresh()));

	context.subscriptions.push(vscode.window.registerTreeDataProvider('script-box', provider));
}

export function deactivate() { }
