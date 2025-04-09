/**
 * Rimuove marker di formattazione dal testo grezzo:
 * - Sezioni: rimuove '#' iniziali.
 * - Task: rimuove "- [ ]" o "- [*]" iniziali.
 * - Note: rimuove '>' iniziali.
 * Inoltre rimuove commenti in linea se presenti.
 */
export function cleanText(rawText: string): string {
    let text = rawText;
    // Rimuove i marker per le sezioni (uno o più # seguiti da uno spazio)
    text = text.replace(/^#+\s*/, '');
    // Rimuove i marker per i task (ad es. "- [ ] " o "- [*] ")
    text = text.replace(/^\s*- \[.*\]\s*/, '');
    // Rimuove i marker per le note ("> " all'inizio)
    text = text.replace(/^\s*>\s*/, '');
    // Elimina eventuali commenti in linea (tutto quello che segue '//')
    text = text.split('//')[0];
    return text.trim();
  }