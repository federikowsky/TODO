import { ASTNode, SectionNode, TaskNode, MetadataNode } from '../ast/types';
import { ASTRepository } from '../repository/ASTRepository';
import { extractDefaultsMeta, extractMeta, mergeMeta } from '../utils/metaUtils';
import { stripInlineComment } from '../utils/stripInlineComment';

/**
 * ContextManager compatto:
 * - Determina il parent dei nodi in base a indentazione (task) o a regole (section, defaults, meta).
 * - Fonde i meta (defaults + meta).
 * - Tiene traccia di stack di sezioni, tasks, e del "defaults corrente".
 */
export class ContextManager {
	private sectionStack: SectionNode[] = [];
	private taskStack: TaskNode[] = [];
	private currentDefaults?: MetadataNode;
	private lastMeta?: MetadataNode;
	private lastProcessedLine = -1;

	private indentUnit = 4;
	private useSpaces = true;

	constructor(
		private repo: ASTRepository,
		private lines: string[]
	) { }

	public setIndentSettings(u: number, s: boolean) {
		this.indentUnit = u;
		this.useSpaces = s;
	}
	public resetAll() {
		this.sectionStack = [];
		this.taskStack = [];
		this.currentDefaults = undefined;
		this.lastMeta = undefined;
		this.lastProcessedLine = -1;
	}

	/**
	 * resolveParent:
	 * - Garantisce che tutte le righe prima di 'node.range.startLine' siano state già elaborate.
	 * - Chiama getParent per trovare il parent corretto e applica la fusione dei meta.
	 */
	public resolveParent(node: ASTNode): ASTNode {
		const ln = node.range.startLine;
		if (ln <= this.lastProcessedLine) {
			// Se stiamo "tornando indietro", resettiamo e rianalizziamo
			this.resetAll();
		}
		this.buildParentContext(ln - 1);
		return this.getParent(node);
	}

	/**
	 * buildParentContext:
	 * - Elabora i nodi riga per riga fino a 'targetLine', così da mantenere i riferimenti "currentDefaults", "lastMeta", stack, ecc.
	 */
	private buildParentContext(targetLine: number) {
		if (targetLine >= this.lines.length) targetLine = this.lines.length - 1;
		for (let i = this.lastProcessedLine + 1; i <= targetLine; i++) {
			const txt = this.lines[i];
			const { text: stripped } = stripInlineComment(txt);
			if (!stripped.trim()) { // riga vuota => reset meta
				this.currentDefaults = undefined;
				this.lastMeta = undefined;
				continue;
			}
			const nd = this.repo.getNodeAtLine(i);
			if (nd) this.getParent(nd);
		}
		this.lastProcessedLine = Math.max(this.lastProcessedLine, targetLine);
	}

	/**
	 * getParent:
	 * - Determina il parent di n, aggiorna stack e unisce meta per i task.
	 */
	private getParent(n: ASTNode): ASTNode {
		const currentSection = this.sectionStack[this.sectionStack.length - 1] || this.repo.root;

		switch (n.type) {
			case 'defaults': {
				const def = n as MetadataNode;
				def.meta = extractDefaultsMeta(def.text);
				this.currentDefaults = def;
				this.lastMeta = undefined;
				return currentSection;
			}
			case 'meta': {
				const mm = n as MetadataNode;
				mm.meta = extractMeta(mm.text);
				this.lastMeta = mm;
				return currentSection;
			}
			case 'section': {
				const sec = n as SectionNode;
				// togli dallo stack le sezioni di livello >= sec.level
				while (this.sectionStack.length && this.sectionStack.at(-1)!.level >= sec.level) {
					this.sectionStack.pop();
				}
				// reset dei tasks e defaults
				this.taskStack = [];
				this.currentDefaults = undefined;
				this.lastMeta = undefined;

				const parent = this.sectionStack.at(-1) ?? this.repo.root;
				this.sectionStack.push(sec);
				return parent;
			}
			case 'note': {
				// la nota si aggancia all'ultimo task
				return this.taskStack.at(-1) ?? currentSection;
			}
			case 'task': {
				const t = n as TaskNode;
				// unisco i meta
				t.meta = mergeMeta(this.currentDefaults?.meta, t.meta);
				if (this.lastMeta) {
					t.meta = mergeMeta(t.meta, this.lastMeta.meta);
					this.lastMeta = undefined;
				}
				// indent => poppo i task di indent >=
				const lvl = Math.floor(t.indent / this.indentUnit);
				while (this.taskStack.length && Math.floor(this.taskStack.at(-1)!.indent / this.indentUnit) >= lvl) {
					this.taskStack.pop();
				}
				if (this.currentDefaults) {
					this.taskStack.push(t);
					return this.currentDefaults;
				}
				const parent = this.taskStack.at(-1) || currentSection;
				this.taskStack.push(t);
				return parent;
			}
			default:
				return currentSection;
		}
	}

	/**
	 * reassignSubtree: per tutti i child di 'node', calcola se
	 * il parent è ancora corretto; in caso contrario sposta il child.
	 * Ricorsione per sistemare l'intero sotto-albero.
	 */
	public reassignSubtree(node: ASTNode): void {
		const childrenSnapshot = [...node.children];
		for (const child of childrenSnapshot) {
			const correctParent = this.resolveParent(child);
			if (correctParent !== child.parent) {
				this.repo.removeNode(child);
				this.repo.insertNode(child, correctParent, child.range.startLine);
			}
			if (child.children.length > 0) {
				this.reassignSubtree(child);
			}
		}
	}
}