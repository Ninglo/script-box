import * as vscode from 'vscode';

const fs = vscode.workspace.fs;

export class ScriptTreeItem implements vscode.TreeItem {
    public contextValue: string;
    public command: vscode.Command;
    constructor(
        public readonly resourceUri: vscode.Uri,
        public parentGroup?: GroupItem,
    ) {
        this.contextValue = resourceUri.toString();
        this.command = {
            title: 'Open...',
            command: 'vscode.open',
            arguments: [this.resourceUri]
        };
    }

    updatePositionTo(newParentGroup: GroupItem) {
        this.parentGroup?.remove(this);
        this.parentGroup = newParentGroup;
        newParentGroup.append(this);

        return this;
    }
}

export class GroupItem implements vscode.TreeItem {
    collapsibleState = vscode.TreeItemCollapsibleState.Expanded;
    contextValue: string;

    files: ScriptTreeItem[] = [];

    constructor(
        public readonly id: string,
        public readonly label: string
    ) {
        this.contextValue = id;
    }

    remove(removeFile: ScriptTreeItem) {
        const filtedFiles = this.files.filter(file => file !== removeFile);

        this.files = filtedFiles;
    }

    appendOne(appendFile: ScriptTreeItem) {
        if (this.files.some(file => file.resourceUri.toString() === appendFile.resourceUri.toString())) { return; }

        this.files = this.files.concat(appendFile);
    }

    append(...appendFiles: ScriptTreeItem[]) {
        appendFiles.forEach(file => this.appendOne(file));
    }

    appendAfter(beforeFile: ScriptTreeItem | undefined, ...appendFiles: ScriptTreeItem[]) {
        if (!beforeFile || !this.files.includes(beforeFile)) {
            this.append(...appendFiles);
            return;
        }

        const filtedFiles = this.files.filter(file => !appendFiles.includes(file));
        const i = filtedFiles.indexOf(beforeFile);

        this.files = [
            ...filtedFiles.slice(0, i + 1),
            ...appendFiles,
            ...filtedFiles.slice(i + 1, filtedFiles.length)
        ];
    }
}


export class ScriptTreeDataProvider implements vscode.TreeDataProvider<ScriptTreeItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<ScriptTreeItem | undefined | null | void> = new vscode.EventEmitter<ScriptTreeItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<ScriptTreeItem | undefined | null | void> = this._onDidChangeTreeData.event;

    constructor(private workspaceRoot: vscode.Uri) { }

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: ScriptTreeItem): vscode.TreeItem {
        return element;
    }

    getChildren(element?: GroupItem | ScriptTreeItem): vscode.ProviderResult<ScriptTreeItem[]> {
        if (!element) {
            return this.getScripts(this.workspaceRoot);
        } else if (element instanceof GroupItem) {
            return element.files;
        } else {
            return [];
        }
    }

    private async getScripts(dir: vscode.Uri): Promise<ScriptTreeItem[]> {
        const scripts = await fs.readDirectory(dir);
        return scripts.map(([script]) => {
            const item = new ScriptTreeItem(
                vscode.Uri.joinPath(dir, script),
                undefined,
            );
            return item;
        });
    }
}
