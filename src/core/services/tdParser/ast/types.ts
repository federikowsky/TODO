export interface Range {
    startLine: number;
    endLine: number;
  }
  
  /**
   * Diagnostic: rappresenta un singolo errore o avviso rilevato
   */
  export interface Diagnostic {
    line: number;
    message: string;
    severity: 'warning' | 'error';
    code?: string;    // es: 'SECTION_EMPTY', 'META_INVALID_SYNTAX'
    nodeId?: string;  // ID del nodo AST (se associato)
  }
  
  /**
   * Metadato su un Task o Defaults
   */
  export type MetaValue =
    | true                      // es: @core
    | string                    // es: @prio(medium)
    | [string, string]          // es: @file(path, lineNumber)
    | null;                     // parsing fallito o incomplete
  
  /**
   * Definiamo il tipo base di tutti i nodi AST
   */
  export interface BaseNode {
    id: string;
    type: ASTNode['type'];
    range: Range;
    parent?: ASTNode;           // link al nodo genitore
    children: ASTNode[];        // nodi figli
    version: number;            // incrementato a ogni modifica
    text: string;               // testo originale di questa riga/blocco
  }
  
  /** RootNode: nodo radice unico del file */
  export interface RootNode extends BaseNode {
    type: 'root';
  }
  
  /** Sezione (#, ##, ###) */
  export interface SectionNode extends BaseNode {
    type: 'section';
    level: number;
    title: string;
  }
  
  /** Task */
  export interface TaskNode extends BaseNode {
    type: 'task';
    checkbox: string; // indica priorità o completato
    status: 'todo' | 'done';
    priority: 'low' | 'medium' | 'high';
    indent: number;
    meta: Record<string, MetaValue>;
    notes: NoteNode[];
  }
  
  /** Nota associata a un Task */
  export interface NoteNode extends BaseNode {
    type: 'note';
    indent: number;
  }
  
  /** Metadati locali o defaults */
  export interface MetadataNode extends BaseNode {
    type: 'meta' | 'defaults';
    meta: Record<string, MetaValue>;
  }
  
  /** Unione di tutti i tipi di nodo possibili */
  export type ASTNode =
    | RootNode
    | SectionNode
    | TaskNode
    | NoteNode
    | MetadataNode;
  
  /**
   * Rappresentazione finale del documento
   */
  export interface ParsedTD {
    /** Radice: con `children[]` che conterrà sezioni, tasks, note, meta, etc. */
    root: RootNode;
    /** Lista di tutti i diagnostic presenti */
    diagnostics: Diagnostic[];
    /** versione del parse (incrementata a ogni update) */
    version: number;
  }