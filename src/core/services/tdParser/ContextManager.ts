import { ASTNode, SectionNode, TaskNode, MetadataNode, NoteNode } from './types';
import { ASTRepository } from './ASTRepository';
import { extractDefaultsMeta, extractMeta, mergeMeta } from './utils/metaUtils';
import { stripInlineComment } from './utils/stripInlineComment';

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
	) {}

	public setIndentSettings(unit: number, useSpaces: boolean): void {
		this.indentUnit = unit;
		this.useSpaces = useSpaces;
	}

	public resetAll(): void {
		this.sectionStack.length = 0; // Svuota gli array senza ricrearne di nuovi
		this.taskStack.length = 0;
		this.currentDefaults = undefined;
		this.lastMeta = undefined;
		this.lastProcessedLine = -1;
	}

	/**
	 * Metodo ad alto livello che risolve il parent di un nodo.
	 * 1) Se necessario, ricostruisce il contesto fino a (ln - 1)
	 * 2) Determina il parent in base alle regole di indent/stack (senza fondere meta)
	 * 3) Applica i meta/aggiorna contesto sul nodo
	 * 4) Restituisce il parent calcolato
	 */
	public resolveParent(node: ASTNode): ASTNode {
		const startLine = node.range.startLine;

		// Se stiamo tornando indietro, resettiamo
		if (startLine <= this.lastProcessedLine) {
			this.resetAll();
		}

		// Portiamo il contesto fino alla linea precedente
		this.ensureContextUpToLine(startLine - 1);

		// Determiniamo solo il parent
		const parent = this.determineNodeParent(node);

		// Applichiamo i meta e aggiorniamo stack e contesto
		this.applyContextToNode(node, parent);

		return parent;
	}

	/**
	 * Scorre le linee fino a targetLine e costruisce il contesto
	 * (stack, default, meta) mano a mano che incontra nodi.
	 */
	private ensureContextUpToLine(targetLine: number): void {
		// Evita di andare oltre l'ultima riga
		const lineCount = this.lines.length;
		if (targetLine >= lineCount) {
			targetLine = lineCount - 1;
		}

		for (let i = this.lastProcessedLine + 1; i <= targetLine; i++) {
			const rawLine = this.lines[i];

			// Prima di qualunque parsing, salviamoci la linea "strippata"
			const { text: stripped } = stripInlineComment(rawLine);

			// Righe vuote => reset defaults/meta
			if (!stripped.trim()) {
				this.currentDefaults = undefined;
				this.lastMeta = undefined;
				continue;
			}

			// Se abbiamo un nodo in quella riga, elaboriamolo
			const nd = this.repo.getNodeAtLine(i);
			if (nd) {
				const parent = this.determineNodeParent(nd);
				this.applyContextToNode(nd, parent);
			}
		}

		// Aggiorniamo la linea processata
		this.lastProcessedLine = Math.max(this.lastProcessedLine, targetLine);
	}

	/**
	 * Calcola il parent di un nodo (solo gerarchia, niente meta).
	 */
	private determineNodeParent(n: ASTNode): ASTNode {
		const secStackLen = this.sectionStack.length;
		const topSection = secStackLen > 0
			? this.sectionStack[secStackLen - 1]
			: this.repo.root;

		switch (n.type) {
			case 'section': {
				const sec = n as SectionNode;
				const level = sec.level;

				// Chiudi le sezioni di livello >=
				while (this.sectionStack.length > 0
					&& this.sectionStack[this.sectionStack.length - 1].level >= level) {
					this.sectionStack.pop();
				}

				// Il parent è l'ultima sezione nello stack o root
				const newTopSection = this.sectionStack.length > 0
					? this.sectionStack[this.sectionStack.length - 1]
					: this.repo.root;

				return newTopSection;
			}
			case 'task': {
				const t = n as TaskNode;
				const indent = t.indent;
				const level = Math.floor(indent / this.indentUnit);

				// Poppo i task di indent >= level
				while (this.taskStack.length > 0) {
					const lastTask = this.taskStack[this.taskStack.length - 1];
					const lastTaskLevel = Math.floor(lastTask.indent / this.indentUnit);
					if (lastTaskLevel >= level) {
						this.taskStack.pop();
					} else {
						break;
					}
				}

				// Se ho ancora un task nello stack, il parent è quello. Altrimenti la sezione
				if (this.taskStack.length > 0) {
					return this.taskStack[this.taskStack.length - 1];
				}
				return topSection;
			}
			case 'note': {
				// La nota si aggancia di default all'ultimo task
				const taskLen = this.taskStack.length;
				if (taskLen > 0) {
					return this.taskStack[taskLen - 1];
				}
				return topSection;
			}
			case 'defaults':
			case 'meta':
				// Normalmente i meta/defaults stanno sulla sezione corrente
				return topSection;

			default:
				return topSection;
		}
	}

	/**
	 * Applica i meta e aggiorna gli stack (sectionStack, taskStack ecc.).
	 * Viene chiamato appena dopo `determineNodeParent`.
	 */
	private applyContextToNode(n: ASTNode, parent: ASTNode): void {
		switch (n.type) {
			case 'section': {
				// Spingiamo la sezione sullo stack
				this.sectionStack.push(n as SectionNode);
				// Reset dei task e dei defaults/meta all’ingresso in una nuova sezione
				this.taskStack.length = 0;
				this.currentDefaults = undefined;
				this.lastMeta = undefined;
				break;
			}
			case 'defaults': {
				const def = n as MetadataNode;
				def.meta = extractDefaultsMeta(def.text);
				this.currentDefaults = def;
				this.lastMeta = undefined;
				break;
			}
			case 'meta': {
				const m = n as MetadataNode;
				m.meta = extractMeta(m.text);
				this.lastMeta = m;
				break;
			}
			case 'task': {
				const t = n as TaskNode;

				// Merge con i defaults correnti
				if (this.currentDefaults?.meta) {
					t.meta = mergeMeta(this.currentDefaults.meta, t.meta);
				}
				// Merge con l'ultimo meta, se presente
				if (this.lastMeta?.meta) {
					t.meta = mergeMeta(t.meta, this.lastMeta.meta);
					this.lastMeta = undefined; // Consumiamo questo meta
				}

				// Aggiungiamo il task nello stack
				this.taskStack.push(t);
				break;
			}
			case 'note': {
				const note = n as NoteNode;
				if (this.taskStack.length > 0) {
					const lastTask = this.taskStack[this.taskStack.length - 1];
					if (!lastTask.notes.includes(note)) {
						lastTask.notes.push(note);
					}
				}
				break;
			}
		}
	}

	/**
	 * Riassegna ricorsivamente il parent dei sotto-nodi di "node".
	 * Se il parent non coincide col calcolo attuale, sposta il sotto-nodo.
	 */
	public reassignSubtree(node: ASTNode): void {
		const snapshot = node.children.slice();
		for (let i = 0; i < snapshot.length; i++) {
			const child = snapshot[i];

			const correctParent = this.resolveParent(child);
			if (correctParent !== child.parent) {
				this.repo.moveNode(child, correctParent);
			}
			if (child.children.length > 0) {
				this.reassignSubtree(child);
			}
		}
	}
}