// src/core/tdParser/utils/parseMetaLine.ts

import { Diagnostic } from '../types';
import { MetaValue } from '../types';

const PRIO_VALUES = ['high', 'medium', 'low'] as const;
type PrioValue = (typeof PRIO_VALUES)[number];

const IDENTIFIER_REGEX = /^[a-zA-Z_][a-zA-Z0-9_]*$/;
const COMMA_VALID_REGEX = /^@[^,\s(]+(?:\([^)]*\))?(?:\s*,\s*@[^,\s(]+(?:\([^)]*\))?)*$/;
const DUE_DATE_REGEX = /^(\d{2}-\d{2}-\d{4})$/;

export function parseMetaLine(
    metaString: string,
    line: number,
    diagnostics: Diagnostic[],
    isDefaults: boolean
): Record<string, MetaValue> {
    const result: Record<string, MetaValue> = {};

    if (!COMMA_VALID_REGEX.test(metaString)) {
        diagnostics.push({
            line,
            message: `Metadato malformato: manca la virgola`,
            severity: 'error',
            code: 'META_MISSING_COMMA',
        });
        return result;
    }

    const segments = metaString
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

    for (const seg of segments) {
        if (!seg.startsWith('@')) {
            diagnostics.push({
                line,
                message: `Metadato malformato: "${seg}" (manca "@")`,
                severity: 'error',
                code: 'META_MISSING_AT',
            });
            continue;
        }

        const inner = seg.slice(1);
        const paramMatch = inner.match(/^(\w+)\(([^()]*)\)$/);

        if (paramMatch) {
            const key = paramMatch[1];
            const rawValue = paramMatch[2];

            // === @prio(...) ===
            if (key === 'prio') {
                if (PRIO_VALUES.includes(rawValue as PrioValue)) {
                    result[key] = rawValue as PrioValue;
                } else {
                    diagnostics.push({
                        line,
                        message: `Valore @prio non valido: "${rawValue}"`,
                        severity: 'error',
                        code: 'META_PRIO_INVALID',
                    });
                    result[key] = null;
                }
                continue;
            }

            // === @file(...) ===
            if (key === 'file') {
                const parts = rawValue.split(':');
                if (parts.length === 2 && parts[1].match(/^\d+$/)) {
                    result[key] = [parts[0], parts[1]];
                } else {
                    diagnostics.push({
                        line,
                        message: `@file deve essere nel formato file:linea`,
                        severity: 'error',
                        code: 'META_FILE_INVALID',
                    });
                    result[key] = null;
                }
                continue;
            }

            // === @due(...) ===
            if (key === 'due') {
                if (DUE_DATE_REGEX.test(rawValue)) {
                    result[key] = rawValue;
                } else {
                    diagnostics.push({
                        line,
                        message: `Data @due non valida: "${rawValue}" (usa formato DD-MM-YYYY o MM-DD-YYYY)`,
                        severity: 'error',
                        code: 'META_DUE_INVALID',
                    });
                    result[key] = null;
                }
                continue;
            }

            // === @customTag(param) ===
            if (!key.match(IDENTIFIER_REGEX)) {
                diagnostics.push({
                    line,
                    message: `Nome metadato non valido: "${key}"`,
                    severity: 'error',
                    code: 'META_NAME_INVALID',
                });
                result[key] = null;
            } else {
                result[key] = rawValue;
            }

        } else {
            // === Flag senza valore ===
            const key = inner.trim();

            if (!key.match(IDENTIFIER_REGEX)) {
                diagnostics.push({
                    line,
                    message: `Nome metadato non valido: "${key}"`,
                    severity: 'error',
                    code: 'META_NAME_INVALID',
                });
                continue;
            }

            // Accetta tutto come custom se non è prio/file/due
            result[key] = true;
        }
    }

    return result;
}