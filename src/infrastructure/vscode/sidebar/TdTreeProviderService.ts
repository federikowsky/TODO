import { TdTreeProvider } from './tdTreeProvider';

export class TdTreeProviderService {
    private static instance: TdTreeProviderService;
    private providers: Map<string, TdTreeProvider>;

    private constructor() {
        this.providers = new Map();
    }

    public static getInstance(): TdTreeProviderService {
        if (!TdTreeProviderService.instance) {
            TdTreeProviderService.instance = new TdTreeProviderService();
        }
        return TdTreeProviderService.instance;
    }

    /**
     * Ottiene o crea un `TdTreeProvider` per un dato documento.
     * @param documentUri URI del documento.
     * @returns L'istanza di `TdTreeProvider` associata al documento.
     */
    public get(documentUri: string): TdTreeProvider {
        if (!this.providers.has(documentUri)) {
            const provider = new TdTreeProvider(documentUri);
            this.providers.set(documentUri, provider);
        }
        return this.providers.get(documentUri)!;
    }

    /**
     * Rimuove un `TdTreeProvider` associato a un documento.
     * @param documentUri URI del documento.
     */
    public remove(documentUri: string): void {
        this.providers.delete(documentUri);
    }

    /**
     * Verifica se esiste un `TdTreeProvider` per un dato documento.
     * @param documentUri URI del documento.
     * @returns `true` se esiste, altrimenti `false`.
     */
    public has(documentUri: string): boolean {
        return this.providers.has(documentUri);
    }


    /**
     * Svuota tutti i `TdTreeProvider` registrati.
     */
    public clear(): void {
        this.providers.clear();
    }
}