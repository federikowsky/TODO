// SectionFilter.ts
import { BaseFilterSpecification } from './BaseFilterSpecification';
import { ASTNode } from '../types';

export class SectionFilter extends BaseFilterSpecification {
  constructor(private includeSubsections: boolean = true) {
    super();
  }

  public isSatisfiedBy(node: ASTNode): boolean {
    // Considera come filtrabile le sezioni; eventualmente aggiungi logica per verificare
    // il livello della sezione o altre proprietà se include sottosezioni
    return node.type === 'section';
  }
}