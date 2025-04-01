export function extractDefaultsMeta(rawText: string): Record<string, any> {
    // Rimuove il prefisso "@defaults:" e parsifica coppie chiave=valore separate da virgola
    const content = rawText.replace('@defaults:', '').trim();
    return extractMeta(content);
}

export function extractMeta(rawText: string): Record<string, any> {
    // check per verificare che i metadati siano validi
    const metaRegex = /^@[^,\s(]+(?:\([^)]*\))?(?:\s*,\s*@[^,\s(]+(?:\([^)]*\))?)*$/;
    if (!metaRegex.test(rawText)) { return {}; }
    
    // Divide il testo in token separati da virgola
    const tokens = rawText.split(',').map(token => token.trim());
    const meta: Record<string, any> = {};
    
    tokens.forEach(token => {
        // Regex per catturare il tag e l'eventuale parametro:
        // Il tag è costituito da lettere e/o numeri, mentre il parametro è il contenuto all'interno delle parentesi (se presente)
        const match = token.match(/^@(\w+)(?:\(([^)]*)\))?$/);
        if (match) {
            const key = match[1];
            // Se è presente il parametro lo usa, altrimenti assegna blank
            const value = match[2] !== undefined ? match[2].trim() : '';
            meta[key] = value;
        }
    });
    
    return meta;
}

export function mergeMeta(metaA: Record<string, any> = {}, metaB: Record<string, any> = {}): Record<string, any> {
    // Unisce due oggetti meta, con metaB che sovrascrive metaA in caso di conflitto
    return { ...metaA, ...metaB };
}