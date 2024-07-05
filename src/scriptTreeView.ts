import * as vscode from 'vscode';
import * as fs from 'fs';

export class ScriptTreeItem extends vscode.TreeItem {
    iconPath = new vscode.ThemeIcon('file')

    constructor(
        public readonly label: string,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,
        public readonly command?: vscode.Command
    ) {
        super(label, collapsibleState);
    }

    contextValue = 'script';
}

export class ScriptTreeDataProvider implements vscode.TreeDataProvider<ScriptTreeItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<ScriptTreeItem | undefined | null | void> = new vscode.EventEmitter<ScriptTreeItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<ScriptTreeItem | undefined | null | void> = this._onDidChangeTreeData.event;

    constructor(private workspaceRoot: string) { }

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: ScriptTreeItem): vscode.TreeItem {
        return element;
    }

    getChildren(element?: ScriptTreeItem): Thenable<ScriptTreeItem[]> {
        if (!this.workspaceRoot) {
            vscode.window.showInformationMessage('No scripts in empty workspace');
            return Promise.resolve([]);
        }

        return Promise.resolve(this.getScripts(this.workspaceRoot));
    }

    private getScripts(dir: string): ScriptTreeItem[] {
        const scripts = fs.readdirSync(dir);
        return scripts.map(script => {
            const item = new ScriptTreeItem(
                script,
                vscode.TreeItemCollapsibleState.None,
                {
                    command: 'script-box.editScript',
                    title: '',
                    arguments: [script]
                }
            )
            return item
        });
    }
}
