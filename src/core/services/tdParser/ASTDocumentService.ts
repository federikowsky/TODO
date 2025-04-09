// src/core/services/tdParser/repository/ASTDocumentService.ts
import { ASTDocument } from './index';

/**
 * ASTDocumentService:
 * - Gestisce il ciclo di vita degli ASTDocument
 * - Applica il pattern singleton per garantire una singola istanza del servizio
 * - Mantiene una cache di documenti parsati
 */
export class ASTDocumentService {
  private static instance: ASTDocumentService;
  private documents: Map<string, ASTDocument>;

  private constructor() {
    this.documents = new Map();
  }

  public static getInstance(): ASTDocumentService {
    if (!ASTDocumentService.instance) {
      ASTDocumentService.instance = new ASTDocumentService();
    }
    return ASTDocumentService.instance;
  }

  /**
   * Ottiene o crea un ASTDocument per il testo specificato
   */
  public get(documentUri: string, text: string): ASTDocument {
    if (!this.documents.has(documentUri)) {
      const astDoc = new ASTDocument(text);
      this.documents.set(documentUri, astDoc);
    }
    return this.documents.get(documentUri)!;
  }

  /**
   * Elimina un documento dalla cache
   */
  public remove(documentUri: string): void {
    this.documents.delete(documentUri);
  }

  /**
   * Verifica se un documento è presente nella cache
   */
  public has(documentUri: string): boolean {
    return this.documents.has(documentUri);
  }

  /**
   * Svuota l'intera cache di documenti
   */
  public clear(): void {
    this.documents.clear();
  }
}