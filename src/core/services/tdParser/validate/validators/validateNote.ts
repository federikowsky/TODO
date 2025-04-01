// src/core/services/tdParser/validators/validateNote.ts
import { NoteNode, Diagnostic } from '../../ast/types';
import { stripInlineComment } from '../../utils/stripInlineComment';

const errorMessages: { [code: string]: string } = {
  NOTE_EMPTY: 'Nota vuota'
};

const errorRegexMap: { [code: string]: RegExp } = {
  // Se la nota inizia con ">" e non ha contenuto dopo eventuali spazi
  NOTE_EMPTY: /^>\s*$/
};

export function validateNote(node: NoteNode): Diagnostic[] {
  const diagnostics: Diagnostic[] = [];
  const { text: cleanText } = stripInlineComment(node.text.trim());

  for (const errorCode in errorRegexMap) {
    const regex = errorRegexMap[errorCode];
    if (regex.test(cleanText)) {
      diagnostics.push({
        line: node.range.startLine,
        message: errorMessages[errorCode],
        // Per le note si usa tipicamente una warning, ma puoi cambiare se necessario
        severity: 'warning',
        code: errorCode,
      });
    }
  }
  return diagnostics;
}