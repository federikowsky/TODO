// src/core/services/tdParser/parseLine/buildNode.ts

import { v4 as uuidv4 } from 'uuid';
import {
    SectionNode,
    TaskNode,
    MetadataNode,
    NoteNode,
    Diagnostic,
    ASTNode,
    Range
} from '../ast/types';

// Interfaccia di ritorno comune per la creazione di un nodo
export interface BuildNodeResult<T extends ASTNode> {
    node: T;
    diagnostics: Diagnostic[];
}

/**
 * buildSectionNode:
 * - Crea un nodo di tipo 'section' usando i dati grezzi.
 * - Non normalizza il livello: lo determina contando semplicemente i caratteri '#' presenti.
 * - Non "fixa" il titolo: lo lascia così come è (eventuali errori verranno evidenziati in validazione).
 */
export function buildSectionNode(
    rawLine: string,
    lineNumber: number,
    indent: number
): BuildNodeResult<SectionNode> {
    const trimmed = rawLine.trimStart();
    const match = trimmed.match(/^(#+)\s*(.*)/)!; // match garantito da parseLine
    const level = match[1].length;
    const title = match[2];
    const node: SectionNode = {
        id: `section-${lineNumber}`,
        type: 'section',
        range: { startLine: lineNumber, endLine: lineNumber } as Range,
        children: [],
        version: 1,
        text: rawLine,
        level,  // valore grezzo
        title   // valore grezzo
    };
    return { node, diagnostics: [] };
}

/**
 * buildTaskNode:
 * - Crea un nodo di tipo 'task' utilizzando la raw line così com'è.
 * - Estrae la checkbox e il testo seguente, senza correggerli.
 */
export function buildTaskNode(
    rawLine: string,
    lineNumber: number,
    indent: number
): BuildNodeResult<TaskNode> {
    const trimmed = rawLine.trimStart();
    const match = trimmed.match(/^- \[(.*)\]\s*(.*)/)!;
    const checkbox = match[1];
    const node: TaskNode = {
        id: `task-${lineNumber}`,
        type: 'task',
        range: { startLine: lineNumber, endLine: lineNumber } as Range,
        children: [],
        version: 1,
        text: rawLine,
        indent,
        checkbox,
        status: checkbox === 'X' ? 'done' : 'todo', // calcolato direttamente
        priority: 'medium', // valore di default; eventuali errori saranno gestiti in validazione
        meta: {},
        notes: []
    };
    return { node, diagnostics: [] };
}

/**
 * buildMetaNode:
 * - Crea un nodo di tipo 'meta' per le linee che iniziano con "@" (esclusi @defaults).
 * - Non modifica il contenuto: il testo viene conservato così com'è.
 */
export function buildMetaNode(
    rawLine: string,
    lineNumber: number,
    indent: number
): BuildNodeResult<MetadataNode> {
    const node: MetadataNode = {
        id: `meta-${lineNumber}`,
        type: 'meta',
        range: { startLine: lineNumber, endLine: lineNumber } as Range,
        children: [],
        version: 1,
        text: rawLine,
        meta: {} // i dati grezzi verranno processati dai validator
    };
    return { node, diagnostics: [] };
}

/**
 * buildDefaultsNode:
 * - Crea un nodo di tipo 'defaults' per le linee che iniziano con "@defaults:".
 * - Anche qui, i dati vengono lasciati così come sono.
 */
export function buildDefaultsNode(
    rawLine: string,
    lineNumber: number,
    indent: number
): BuildNodeResult<MetadataNode> {
    const node: MetadataNode = {
        id: `defaults-${lineNumber}`,
        type: 'defaults',
        range: { startLine: lineNumber, endLine: lineNumber } as Range,
        children: [],
        version: 1,
        text: rawLine,
        meta: {}
    };
    return { node, diagnostics: [] };
}

/**
 * buildNoteNode:
 * - Crea un nodo di tipo 'note' usando il testo grezzo della nota.
 * - Non esegue stripping del marker '>', lo lascia per la validazione.
 */
export function buildNoteNode(
    rawLine: string,
    lineNumber: number,
    indent: number
): BuildNodeResult<NoteNode> {
    const node: NoteNode = {
        id: `note-${lineNumber}`,
        type: 'note',
        range: { startLine: lineNumber, endLine: lineNumber } as Range,
        children: [],
        version: 1,
        text: rawLine,
        indent
    };
    return { node, diagnostics: [] };
}