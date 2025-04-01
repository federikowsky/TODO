// src/core/services/tdParser/validators/validateMeta.ts
import { MetadataNode, Diagnostic } from '../../ast/types';
import { stripInlineComment } from '../../utils/stripInlineComment';

export function validateMeta(node: MetadataNode): Diagnostic[] {
  const diagnostics: Diagnostic[] = [];
  const { text: rawText } = stripInlineComment(node.text.trim());
  const cleanText = rawText.trim();

  // Fase 1: Errori prioritari
  // Mappa che associa ogni codice d’errore a una regex che, se matcha il testo, indica l’errore.
  const errorRegexMap: { [code: string]: RegExp } = {
    // Se il testo è solo "@" (eventuali spazi)
    META_EMPTY: /^@\s*$/,
    // Se mancano le virgole fra parametri:
    // Se nelle parentesi ci sono almeno due token (separati da spazi) ma NON contiene una virgola.
    META_MISSING_COMMA: /^(?!@[^,\s(]+(?:\([^)]*\))?(?:\s*,\s*@[^,\s(]+(?:\([^)]*\))?)*$).+$/,
    // Se il tag è @prio(...) ma l'argomento non è "low", "medium" o "high" (case-insensitive)
    META_PRIO_INVALID_ARGUMENT: /^@prio\(\s*(?!low\b|medium\b|high\b)[^)]+\)$/i,
    // Se il tag è @file(...) e l'argomento è vuoto o finisce con ":" oppure è solo ":".
    META_FILE_INVALID_ARGUMENT: /^(?:@file\(\s*\)|@file\(\s*[A-Za-z]+\s*:\s*\)|@file\(\s*:\s*\))$/i,
    // Se il tag è @due(...) e l'argomento non rispetta il formato DD-MM-YYYY o MM-DD-YYYY.
    // Validiamo due formati: DD-MM-YYYY e MM-DD-YYYY (semplicemente confrontando la struttura)
    META_DUE_INVALID_ARGUMENT: /^@due\(\s*(?!((0[1-9]|[12]\d|3[01])-(0[1-9]|1[0-2])-\d{4}|(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])-\d{4}))[^)]+\)$/i,
  };

  // Mappa dei messaggi d'errore
  const errorMessages: { [code: string]: string } = {
    META_EMPTY: 'Meta mancante testo',
    META_MISSING_COMMA: 'Manca virgola fra parametri',
    META_PRIO_INVALID_ARGUMENT: 'Argomento di prio non valido (valido: low, medium, high)',
    META_FILE_INVALID_ARGUMENT: 'Argomento di file non valido (valido: @file(X) o @file(X:number))',
    META_DUE_INVALID_ARGUMENT: 'Argomento di due non valido (valido: DD-MM-YYYY o MM-DD-YYYY)',
  };

  // Itera le condizioni d'errore prioritario
  for (const errorCode in errorRegexMap) {
    const regex = errorRegexMap[errorCode];
    if (regex.test(cleanText)) {
      diagnostics.push({
        line: node.range.startLine,
        message: errorMessages[errorCode],
        severity: 'error',
        code: errorCode,
      });
    }
  }
  if (diagnostics.length > 0) return diagnostics;

  // Fase 2: Controllo del pattern base
  // Il pattern base atteso:
  // - Deve iniziare con "@" seguito da un nome di tag (solo lettere),
  // - Poi, se presenti, le parentesi contenenti parametri validi (almeno un carattere non spaziale, oppure una lista separata da virgole).
  const baseRegex = /^@[^,\s(]+(?:\([^)]*\))?(?:\s*,\s*@[^,\s(]+(?:\([^)]*\))?)*$/;
  if (!baseRegex.test(cleanText)) {
    diagnostics.push({
      line: node.range.startLine,
      message: 'Meta sintatticamente non valido',
      severity: 'error',
      code: 'META_INVALID_SYNTAX',
    });
    return diagnostics;
  }

  return diagnostics;
}