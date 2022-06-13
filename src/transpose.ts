"use strict";

import {
  commands,
  ExtensionContext,
  Position,
  Selection,
  TextEditor,
  TextEditorEdit,
  window,
} from "vscode";

export function activate(context: ExtensionContext) {
  const disposable = commands.registerTextEditorCommand(
    "extension.transpose",
    (textEditor: TextEditor, edit: TextEditorEdit) => {
      const transposer = new Transposer(textEditor, edit);
      transposer.transpose();
    }
  );
  context.subscriptions.push(disposable);
}

// Transposer class
class Transposer {
  private _textEditor: TextEditor;
  private _textEditorEdit: TextEditorEdit;

  constructor(editor: TextEditor, editorEdit: TextEditorEdit) {
    this._textEditorEdit = editorEdit;
    this._textEditor = editor;
  }

  private _isEmpty(s: Selection, _: number, _1: readonly Selection[]) {
    return s.isEmpty;
  }

  // Finds next character position of the given position
  // Returns null if final character
  private _nextChar(position: Position) {
    let nextLine;
    let nextCharacter;
    const lastPositionInLine = this._textEditor.document.lineAt(position.line)
      .range.end;
    if (
      position.line == this._textEditor.document.lineCount - 1 &&
      position.isEqual(lastPositionInLine)
    ) {
      return null;
    }
    if (position.isEqual(lastPositionInLine)) {
      nextLine = position.line + 1;
      nextCharacter = 0;
    } else {
      nextLine = position.line;
      nextCharacter = position.character + 1;
    }
    return new Position(nextLine, nextCharacter);
  }

  // Finds previous character position of the given position
  // Returns null if first character
  private _prevChar(position: Position) {
    let prevLine;
    let prevCharacter;
    if (position.line == 0 && position.character == 0) {
      return null;
    }
    if (position.character == 0) {
      prevLine = position.line - 1;
      prevCharacter =
        this._textEditor.document.lineAt(prevLine).range.end.character;
    } else {
      prevLine = position.line;
      prevCharacter = position.character - 1;
    }
    return new Position(prevLine, prevCharacter);
  }

  // Transpose characters when no selections are made
  public transposeCharacters(selections: readonly Selection[]) {
    selections.forEach((selection) => {
      const p = new Position(selection.active.line, selection.active.character);
      const nextPosition = this._nextChar(p);
      const prevPosition = this._prevChar(p);
      if (nextPosition == null || prevPosition == null) {
        return;
      }
      const _nextChar = this._nextChar(p);
      if (_nextChar === null) {
        return;
      }
      const nextSelection = new Selection(p, _nextChar);
      const nextChar = this._textEditor.document.getText(nextSelection);
      this._textEditorEdit.delete(nextSelection);
      this._textEditorEdit.insert(prevPosition, nextChar);
    });
  }

  public transpose() {
    const selections = this._textEditor.selections;
    const textSelected = !selections.every(this._isEmpty);

    if (textSelected && selections.length == 1) {
      // nothing to transpose
      return;
    }

    // Swap the characters to the left and right of the cursor
    if (!textSelected) {
      this.transposeCharacters(selections);
      return;
    }

    // Transpose the selections
    this.transposeSelection(selections);
  }

  // Tranposes the selections
  public transposeSelection(selections: readonly Selection[]) {
    const selectedTexts = selections.map((s) => {
      return this._textEditor.document.getText(s);
    });
    // Pops the last elements and inserts it into the beginning of the array
    const lastChar: string = selectedTexts.pop()!;
    selectedTexts.unshift(lastChar);
    for (let i = 0; i < selections.length; i++) {
      this._textEditorEdit.replace(selections[i], selectedTexts[i]);
    }
  }
}
