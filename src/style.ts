import * as vscode from "vscode";
import { WarningLevel, maxLines, warningLines } from "./extension";
import { objectToCssString } from "./utils";

const lineCountToLevel = (lines: number) => {
   return lines > maxLines()
      ? WarningLevel.ERROR
      : lines > warningLines()
      ? WarningLevel.WARNING
      : WarningLevel.INFO;
};

const levelColor = (level: WarningLevel) =>
   level === WarningLevel.INFO
      ? "rgba(255,255,255,.33)"
      : level === WarningLevel.WARNING
      ? "rgba(255,255,0,.33)"
      : "rgb(209,0,209,.75)";

export const fileStyle: (lines: number) => vscode.FileDecoration = (lines) => {
   const level = lineCountToLevel(lines);

   return {
      badge: level === WarningLevel.ERROR ? "\u2B55" : undefined,
      color:
         level === WarningLevel.ERROR
            ? new vscode.ThemeColor("tooManyLines.fileHighlight")
            : undefined,
      propagate: true,
      tooltip:
         level === WarningLevel.ERROR
            ? `There's ${lines} lines in this file, this is unnacceptable!`
            : level === WarningLevel.WARNING
            ? `This file has ${lines} lines, consider refactoring`
            : undefined,
   };
};

const style = (level: WarningLevel, light?: boolean) => {
   return objectToCssString({
      "padding-left": "20px",
      ["pointer-events"]: "none",
      ["color"]: levelColor(level),
   });
};
export const createDecoration = (
   lines: number,
   light?: boolean
): vscode.DecorationRenderOptions => {
   const level = lineCountToLevel(lines);

   return {
      after: {
         contentText:
            level === WarningLevel.INFO
               ? ``
               : level === WarningLevel.WARNING
               ? `⚠️ This file has ${lines} lines, consider refactoring`
               : `⭕ This file has ${lines} lines, this is unnacceptable!`,
         textDecoration: `none; ${style(level, light)}`,
      },
   };
};
