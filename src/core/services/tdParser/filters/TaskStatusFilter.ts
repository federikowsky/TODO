// TaskStatusFilter.ts
import { BaseFilterSpecification } from './BaseFilterSpecification';
import { ASTNode } from '../types';

export class TaskStatusFilter extends BaseFilterSpecification {
  constructor(private status: 'todo' | 'done') {
    super();
  }

  public isSatisfiedBy(node: ASTNode): boolean {
    return node.type === 'task' && (node as any).status === this.status;
  }
}