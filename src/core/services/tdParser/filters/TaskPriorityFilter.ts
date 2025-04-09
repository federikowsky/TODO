// TaskPriorityFilter.ts
import { BaseFilterSpecification } from './BaseFilterSpecification';
import { ASTNode } from '../types';

export class TaskPriorityFilter extends BaseFilterSpecification {
  constructor(private priority: 'none' | 'low' | 'medium' | 'high') {
    super();
  }

  public isSatisfiedBy(node: ASTNode): boolean {
    return node.type === 'task' && (node as any).priority === this.priority;
  }
}