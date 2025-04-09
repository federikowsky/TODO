// TaskNotesFilter.ts
import { BaseFilterSpecification } from './BaseFilterSpecification';
import { ASTNode } from '../types';

export class TaskNotesFilter extends BaseFilterSpecification {
  public isSatisfiedBy(node: ASTNode): boolean {
    return node.type === 'task' && Array.isArray((node as any).notes) && (node as any).notes.length > 0;
  }
}