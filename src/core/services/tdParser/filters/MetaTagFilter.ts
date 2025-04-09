// MetaTagFilter.ts
import { BaseFilterSpecification } from './BaseFilterSpecification';
import { ASTNode } from '../types';

export class MetaTagFilter extends BaseFilterSpecification {
  constructor(private metaKey: string, private metaValue?: string | boolean) {
    super();
  }

  // da modificare con extractmeta utility
  
  public isSatisfiedBy(node: ASTNode): boolean {
    // Applica il filtro ai task, eventualmente anche ad altri nodi che possiedono meta
    if (node.type !== 'task') 
        return false;

    const meta = (node as any).meta;
    if (!meta || !(this.metaKey in meta)) 
        return false;
    if (this.metaValue !== undefined) {
      return meta[this.metaKey] === this.metaValue;
    }
    return true;
  }
}