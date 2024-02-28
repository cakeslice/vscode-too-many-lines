import * as vscode from "vscode";
import { addLineCounter, updateLineCounter } from "./line-counter";

export enum WarningLevel {
   INFO = "info",
   WARNING = "warning",
   ERROR = "error",
}

const extensionConfig = () => vscode.workspace.getConfiguration("tooManyLines");
export const warningLines = () =>
   extensionConfig().get<number>("warningLevel") || 100;
export const maxLines = () =>
   extensionConfig().get<number>("errorLevel") || 200;

export function activate(context: vscode.ExtensionContext) {
   console.log('Extension "too-many-lines" is now active!');

   const disposables: vscode.Disposable[] = [];
   disposables.push(
      vscode.commands.registerCommand("too-many-lines.start", () => {})
   );
   disposables.push(
      vscode.workspace.onDidOpenTextDocument((document) => {
         const editor = vscode.window.activeTextEditor;
         if (editor && document === editor.document) {
            addLineCounter(editor);
         }
      })
   );
   disposables.push(
      vscode.window.onDidChangeTextEditorSelection((event) => {
         const editor = event.textEditor;
         updateLineCounter(editor);
      })
   );
   disposables.push(
      vscode.workspace.onDidChangeTextDocument((event) => {
         const editor = vscode.window.visibleTextEditors.find(
            (editor) => editor.document === event.document
         );
         addLineCounter(editor);
      })
   );
   disposables.push(vscode.window.onDidChangeActiveTextEditor(addLineCounter));
   disposables.push(
      vscode.window.onDidChangeVisibleTextEditors((editors) => {
         editors.forEach((editor) => {
            addLineCounter(editor);
         });
      })
   );

   vscode.window.visibleTextEditors.forEach((editor) => {
      addLineCounter(editor);
   });

   disposables.forEach((disposable) => context.subscriptions.push(disposable));

   vscode.commands.executeCommand("too-many-lines.start");
}

export function deactivate() {}
