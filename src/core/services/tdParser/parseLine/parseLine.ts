// src/core/services/tdParser/parseLine/parseLine.ts
import { ASTNode, Diagnostic } from '../ast/types';
import { buildSectionNode, buildNoteNode, buildDefaultsNode, buildMetaNode, buildTaskNode } from './buildNode';

export interface ParseLineResult {
  node?: ASTNode;
  diagnostics: Diagnostic[];
}

/**
 * parseLineToNode:
 * - Riceve la rawline e il numero di riga.
 * - Calcola l'indentazione e il testo trimmed.
 * - In base al pattern, richiama il builder corrispondente.
 * - Se nessun pattern corrisponde, ritorna diagnostic UNRECOGNIZED_LINE.
 */
export function parseLineToNode(rawLine: string, lineNumber: number): ParseLineResult {
  const diagnostics: Diagnostic[] = [];
  const indent = rawLine.length - rawLine.trimStart().length;
  const trimmed = rawLine.trimStart();

  // Se la riga è vuota, non crea nodo
  if (!trimmed) {
    return { diagnostics: [] };
  }

  // Pattern matching:
  if (/^#+\s*/.test(trimmed)) {
    return buildSectionNode(rawLine, lineNumber, indent);
  }
  if (/^@defaults:/.test(trimmed)) {
    return buildDefaultsNode(rawLine, lineNumber, indent);
  }
  if (/^@/.test(trimmed)) {
    return buildMetaNode(rawLine, lineNumber, indent);
  }
  if (/^- \[.*\]/.test(trimmed)) {
    return buildTaskNode(rawLine, lineNumber, indent);
  }
  if (/^>\s*/.test(trimmed)) {
    return buildNoteNode(rawLine, lineNumber, indent);
  }

  diagnostics.push({
    line: lineNumber,
    message: 'Contenuto non riconosciuto',
    severity: 'error',
    code: 'UNRECOGNIZED_LINE'
  });
  return { diagnostics };
}