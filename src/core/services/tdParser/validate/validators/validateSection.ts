// src/core/services/tdParser/validators/validateSection.ts
import { SectionNode, Diagnostic } from '../../types';
import { stripInlineComment } from '../../utils/stripInlineComment';

export function validateSection(node: SectionNode): Diagnostic[] {
  const diagnostics: Diagnostic[] = [];
  const { text: cleanText } = stripInlineComment(node.text.trim());

  // Fase 1: condizioni d'errore prioritario
  const errorRegexMap: { [code: string]: RegExp } = {
    SECTION_EMPTY: /^(#{1,3})\s*$/,         // Titolo vuoto (solo '#' e spazi)
    SECTION_INVALID_LEVEL: /^(#{4,})\s*.*$/   // Più di 3 '#' all'inizio
  };
  const errorMessages: { [code: string]: string } = {
    SECTION_EMPTY: 'Sezione vuota (titolo mancante)',
    SECTION_INVALID_LEVEL: 'Livello sezione non valido (deve essere tra 1 e 3)'
  };

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
  const baseRegex = /^(#{1,3})\s+\S.*$/;
  if (!baseRegex.test(cleanText)) {
    diagnostics.push({
      line: node.range.startLine,
      message: 'Sezione sintatticamente non valida',
      severity: 'error',
      code: 'SECTION_INVALID_SYNTAX'
    });
    return diagnostics;
  }

  return diagnostics;
}