import * as vscode from "vscode";
import { maxLines } from "./extension";
import { createDecoration, fileStyle } from "./style";

const documentLineCount: Record<string, number> = {};
let documentFileDecorations: Record<string, CustomFileDecorationProvider> = {};
let documentDecorations: Record<
   string,
   vscode.TextEditorDecorationType | undefined
> = {};

export class CustomFileDecorationProvider
   implements vscode.FileDecorationProvider
{
   private disposables: vscode.Disposable[];

   constructor(fileUri: vscode.Uri | undefined = undefined) {
      this.fileUri = fileUri;

      this.disposables = [];
      this.disposables.push(vscode.window.registerFileDecorationProvider(this));
   }

   fileUri: vscode.Uri | undefined = undefined;
   async provideFileDecoration(uri: vscode.Uri) {
      if (this.fileUri?.toString() !== uri.toString()) {
         return;
      }

      const lineCount = documentLineCount[uri.toString()];
      const isError = maxLines() < lineCount;

      if (isError) {
         return fileStyle(lineCount);
      }
   }

   dispose() {
      this.disposables.forEach((d) => d.dispose());
   }
}

const removeDecoration = (doc: vscode.TextDocument) => {
   const activeDecoration = documentDecorations[doc.uri.toString()];
   if (activeDecoration) {
      activeDecoration.dispose();
      documentDecorations[doc.uri.toString()] = undefined;
   }
};

export const addLineCounter = (editor?: vscode.TextEditor) => {
   if (!editor) {
      return;
   }
   const doc = editor.document;
   if (
      !doc ||
      doc.uri.scheme === "vscode-userdata" ||
      doc.uri.scheme !== "file"
   ) {
      // Ignore settings.json and keybindings.json
      return;
   }

   let lineCount = 0;

   for (let i = 0; i < doc.lineCount; i++) {
      const trimmedLine = doc.lineAt(i).text.trim();

      const disabledFlag = "disable-too-many-lines";
      if (
         trimmedLine.startsWith(`// ${disabledFlag}`) ||
         trimmedLine.startsWith(`/* ${disabledFlag}`) ||
         trimmedLine.startsWith(`# ${disabledFlag}`)
      ) {
         removeDecoration(doc);
         return;
      }

      const isEmpty = trimmedLine === "";
      const isComment =
         trimmedLine.startsWith("//") ||
         trimmedLine.startsWith("/*") ||
         trimmedLine.startsWith("*") ||
         trimmedLine.startsWith("*/");

      if (!isEmpty && !isComment) {
         lineCount++;
      }
   }

   let fileDecoration = documentFileDecorations[doc.uri.toString()];
   if (!fileDecoration) {
      documentFileDecorations[doc.uri.toString()] =
         new CustomFileDecorationProvider(doc.uri);
   }

   fileDecoration = documentFileDecorations[doc.uri.toString()];
   if (documentLineCount[doc.uri.toString()] !== lineCount) {
      fileDecoration.dispose();
      const newFileDecoration = new CustomFileDecorationProvider(doc.uri);
      documentFileDecorations[doc.uri.toString()] = newFileDecoration;
      newFileDecoration.provideFileDecoration(doc.uri);
   }

   documentLineCount[doc.uri.toString()] = lineCount;

   const decoration = vscode.window.createTextEditorDecorationType({
      ...createDecoration(lineCount, false),
      rangeBehavior: vscode.DecorationRangeBehavior.ClosedClosed,
      light: createDecoration(lineCount, true),
   });

   removeDecoration(doc);
   documentDecorations[doc.uri.toString()] = decoration;
   updateLineCounter(editor);
};

export const updateLineCounter = (editor?: vscode.TextEditor) => {
   if (!editor) {
      return;
   }
   const doc = editor.document;
   if (!doc) {
      return;
   }

   const firstVisibleRange = editor.visibleRanges.find(
      (range) => !range.isEmpty
   );
   if (!firstVisibleRange) {
      return;
   }

   const cursorPos = editor.selection.active;
   const decoration = documentDecorations[doc.uri.toString()];
   if (decoration) {
      editor.setDecorations(decoration, [doc.lineAt(cursorPos).range]);
   }
};
