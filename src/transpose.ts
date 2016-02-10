'use strict';

import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
    let disposable = vscode.commands.registerTextEditorCommand('extension.transpose', (textEditor: vscode.TextEditor,
        edit: vscode.TextEditorEdit) => {
        let transposer = new Transposer(textEditor, edit);
        transposer.transpose()
    })
    context.subscriptions.push(disposable);
}

// Transposer class
class Transposer {
    private _textEditor: vscode.TextEditor;
    private _textEditorEdit: vscode.TextEditorEdit;

    constructor(editor: vscode.TextEditor, editorEdit: vscode.TextEditorEdit) {
        this._textEditorEdit = editorEdit;
        this._textEditor = editor;
    }

    private _isEmpty(s: vscode.Selection, i: number, a: vscode.Selection[]) {
        return s.isEmpty
    }

    // Finds next character position of the given position
    // Returns null if final character
    private _nextChar(position: vscode.Position) {
        let s = new vscode.Selection(position, position)
        var nextLine;
        var nextCharacter;
        let lastPositionInLine = this._textEditor.document.lineAt(position.line).range.end;
        if ((position.line == (this._textEditor.document.lineCount - 1)) && (position.isEqual(lastPositionInLine))) {
            return null
        }
        if (position.isEqual(lastPositionInLine)) {
            nextLine = position.line + 1;
            nextCharacter = 0;
        } else {
            nextLine = position.line;
            nextCharacter = position.character + 1;
        }
        return new vscode.Position(nextLine, nextCharacter)
    }

    // Finds previous character position of the given position
    // Returns null if first character
    private _prevChar(position: vscode.Position) {
        let s = new vscode.Selection(position, position)
        var prevLine;
        var prevCharacter;
        if ((position.line == 0) && (position.character == 0)) {
            return null
        }
        if (position.character == 0) {
            prevLine = position.line - 1;
            prevCharacter = this._textEditor.document.lineAt(prevLine).range.end.character;
        } else {
            prevLine = position.line;
            prevCharacter = position.character - 1;
        }
        return new vscode.Position(prevLine, prevCharacter);
    }

    // Transpose characters when no selections are made
    public transposeCharacters(selections: vscode.Selection[]) {
        selections.forEach(selection => {
            let p = new vscode.Position(selection.active.line, selection.active.character)
            let nextPosition = this._nextChar(p);
            let prevPosition = this._prevChar(p);
            if (nextPosition == null || prevPosition == null) {
                return
            }
            let nextSelection = new vscode.Selection(p, this._nextChar(p))
            let nextChar = this._textEditor.document.getText(nextSelection);
            this._textEditorEdit.delete(nextSelection)
            this._textEditorEdit.insert(prevPosition, nextChar)
        });
    }

    public transpose() {
        let selections = this._textEditor.selections;
        let textSelected = !selections.every(this._isEmpty)

        if (textSelected && selections.length == 1) {
            // nothing to transpose
            return
        }

        // Swap the characters to the left and right of the cursor
        if (!textSelected) {
            this.transposeCharacters(selections);
            return
        }

        // Transpose the selections
        this.transposeSelection(selections);
    }

    // replace selection s2 with s1
    private _replaceSelections(s1: vscode.Selection, s2: vscode.Selection) {
        let range;
        let prevSelection;
        if (s1.isEmpty) {
            range = this._textEditor.document.getWordRangeAtPosition(s1.active);
        } else {
            range = s1;
        }
        if (s2.isEmpty) {
            prevSelection = this._textEditor.document.getWordRangeAtPosition(s2.active);
        } else {
            prevSelection = s2;
        }
        this._textEditorEdit.replace(prevSelection, this._textEditor.document.getText(range))
    }

    // Tranposes the selections
    public transposeSelection(selections: vscode.Selection[]) {
        let firstSelection = selections[0];
        for (let i = 1; i < selections.length; i++) {
            this._replaceSelections(selections[i], selections[i - 1]);
        }
        this._replaceSelections(firstSelection, selections[selections.length - 1]);
    }
}