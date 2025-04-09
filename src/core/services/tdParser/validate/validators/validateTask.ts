// src/core/services/tdParser/validators/validateTask.ts
import { TaskNode, Diagnostic } from '../../types';
import { stripInlineComment } from '../../utils/stripInlineComment';

export function validateTask(node: TaskNode): Diagnostic[] {
  const diagnostics: Diagnostic[] = [];
  const { text: cleanText } = stripInlineComment(node.text.trim());

  // Fase 1: condizioni d'errore prioritario
  // Le regex qui definite devono intercettare, se matchano, i casi di errore
  const errorRegexMap: { [code: string]: RegExp } = {
    // TASK_NO_TEXT: non c'è testo dopo la checkbox
    TASK_NO_TEXT: /^- \[(?: |~|!|X)\]\s*$/,
    // TASK_INVALID_PRIO: se il contenuto dentro le parentesi non è esattamente uno dei valori validi.
    // Usa una negative lookahead: dopo "- [" se il primo carattere non è uno tra " ", "~", "!" o "X",
    // allora matcha.
    TASK_INVALID_PRIO: /^- \[(?![ ~!X\]])(.+)\]/,
    // TASK_CHECKBOX_MISSING_SPACE: assenza di spazio nella checkbox,
    // ad esempio "- []" (il contenuto inizia senza spazi)
    TASK_CHECKBOX_MISSING_SPACE: /^- \[\]\s*/,
    // TASK_MALFORMED: assenza di spazi tra trattino e la checkbox, 
    // ad esempio "-[ ]" 
    TASK_MALFORMED: /^-\[.*\].*$/,
    // TASK_CHECKBOX_MALFORMED: presenza di spazi extra all'interno delle parentesi,
    // ad esempio "- [ X]" o "- [  X]" (il contenuto inizia con almeno uno spazio)
    TASK_CHECKBOX_MALFORMED: /^- \[\s+\S+\]/,
  };

  const errorMessages: { [code: string]: string } = {
    TASK_NO_TEXT: 'Task senza testo',
    TASK_CHECKBOX_MALFORMED: 'Formato checkbox task malformato',
    TASK_CHECKBOX_MISSING_SPACE: 'Checkbox task senza spazio',
    TASK_MALFORMED: 'Task malformato',
    TASK_INVALID_PRIO: 'Priorità task non valida'
  };

  // Itera sulle condizioni d'errore prioritario
  for (const errorCode in errorRegexMap) {
    if (errorRegexMap[errorCode].test(cleanText)) {
      diagnostics.push({
        line: node.range.startLine,
        message: errorMessages[errorCode],
        severity: 'error',
        code: errorCode
      });
    }
  }
  if (diagnostics.length > 0) return diagnostics;

  // Fase 2: controllo del pattern base
  // Il pattern base atteso per un task valido:
  // - Inizia con "- [", seguito da esattamente uno dei caratteri validi (senza spazi extra)
  // - Poi deve esserci uno spazio (opzionale) seguito da del testo non vuoto
  const baseRegex = /^- \[(?: |~|!|X)\]\s*\S.*$/;
  if (!baseRegex.test(cleanText)) {
    diagnostics.push({
      line: node.range.startLine,
      message: 'Task sintatticamente non valido',
      severity: 'error',
      code: 'TASK_INVALID_SYNTAX'
    });
    return diagnostics;
  }

  return diagnostics;
}