// src/core/services/tdParser/validators/validateDefaults.ts
import { MetadataNode, Diagnostic } from '../../types';
import { stripInlineComment } from '../../utils/stripInlineComment';
import { validateMeta } from './validateMeta';

export function validateDefaults(node: MetadataNode): Diagnostic[] {
  const diagnostics: Diagnostic[] = [];
  const { text: rawText } = stripInlineComment(node.text.trim());
  const cleanText = rawText.trim();

  // Fase 1 – Errori prioritari
  const errorRegexMap: { [code: string]: RegExp } = {
    // Se il testo è solo "@defaults:" (eventuali spazi)
    DEFAULTS_EMPTY: /^@defaults:\s*$/,
    // Se compare più di una istanza di "@defaults:" (conflitto)
    DEFAULTS_CONFLICT: /@defaults:.*@defaults:/,
  };
  const errorMessages: { [code: string]: string } = {
    DEFAULTS_EMPTY: 'Defaults vuoti',
    DEFAULTS_CONFLICT: 'Defaults in conflitto',
  };

  for (const errorCode in errorRegexMap) {
    if (errorRegexMap[errorCode].test(cleanText)) {
      diagnostics.push({
        line: node.range.startLine,
        message: errorMessages[errorCode],
        severity: 'error',
        code: errorCode,
      });
    }
  }
  if (diagnostics.length > 0) return diagnostics;

  // Fase 1 – Validazione del valore: estrai il contenuto dopo "@defaults:" e valida usando validateMeta.
  const content = cleanText.substring('@defaults:'.length);
  // Creiamo un nodo fittizio per validare il contenuto (lo trattiamo come meta)
  const dummyMetaNode = {
    id: node.id,
    type: 'meta',
    range: node.range,
    children: [],
    text: content,
    meta: {}
  } as MetadataNode;
  const metaDiagnostics = validateMeta(dummyMetaNode);
  if (metaDiagnostics.length > 0) {
    diagnostics.push({
      line: node.range.startLine,
      message: 'Defaults invalido: ' + metaDiagnostics.map(d => d.message).join(', '),
      severity: 'error',
      code: 'DEFAULTS_INVALID_VALUE',
    });
  }
  if (diagnostics.length > 0) return diagnostics;

  // Fase 2 – Controllo del pattern base:
  // Il pattern base atteso: "@defaults:" seguito da almeno uno spazio e un carattere non vuoto
  const baseRegex = /^@defaults:\s+\S.*$/;
  if (!baseRegex.test(cleanText)) {
    diagnostics.push({
      line: node.range.startLine,
      message: 'Defaults sintatticamente non validi',
      severity: 'error',
      code: 'DEFAULTS_INVALID_SYNTAX',
    });
    return diagnostics;
  }

  return diagnostics;
}