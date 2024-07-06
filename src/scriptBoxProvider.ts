import * as vscode from "vscode";

export class ScriptBoxProvider implements vscode.TreeDataProvider<vscode.Uri> {
    private _onDidChangeTreeData = new vscode.EventEmitter<vscode.Uri | undefined>();
    readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

    constructor(private rootPath: vscode.Uri) { }

    refresh(): void {
        this._onDidChangeTreeData.fire(undefined);
    }

    getTreeItem(element: vscode.Uri): vscode.TreeItem | Thenable<vscode.TreeItem> {
        const treeItem = new vscode.TreeItem(element, vscode.TreeItemCollapsibleState.None);
        treeItem.command = { command: 'vscode.open', title: "Open File", arguments: [element] };
        treeItem.contextValue = 'file';
        return treeItem;
    }

    async getChildren(_element?: vscode.Uri): Promise<vscode.Uri[]> {
        const element = _element ?? this.rootPath;
        const files = await vscode.workspace.fs.readDirectory(element);
        return files.map(([file]) => vscode.Uri.joinPath(element, file));
    }
}