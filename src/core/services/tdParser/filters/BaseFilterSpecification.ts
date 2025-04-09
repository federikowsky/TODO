// BaseFilterSpecification.ts
import { IFilterSpecification } from './IFilterSpecification';
import { ASTNode } from '../types';

export abstract class BaseFilterSpecification implements IFilterSpecification {
  abstract isSatisfiedBy(node: ASTNode): boolean;

  public and(spec: IFilterSpecification): IFilterSpecification {
    return new AndSpecification(this, spec);
  }

  public or(spec: IFilterSpecification): IFilterSpecification {
    return new OrSpecification(this, spec);
  }
}

// Implementazioni delle combinazioni
export class AndSpecification implements IFilterSpecification {
  constructor(private left: IFilterSpecification, private right: IFilterSpecification) {}

  public isSatisfiedBy(node: ASTNode): boolean {
    return this.left.isSatisfiedBy(node) && this.right.isSatisfiedBy(node);
  }

  public and(spec: IFilterSpecification): IFilterSpecification {
    return new AndSpecification(this, spec);
  }

  public or(spec: IFilterSpecification): IFilterSpecification {
    return new OrSpecification(this, spec);
  }
}

export class OrSpecification implements IFilterSpecification {
  constructor(private left: IFilterSpecification, private right: IFilterSpecification) {}

  public isSatisfiedBy(node: ASTNode): boolean {
    return this.left.isSatisfiedBy(node) || this.right.isSatisfiedBy(node);
  }

  public and(spec: IFilterSpecification): IFilterSpecification {
    return new AndSpecification(this, spec);
  }

  public or(spec: IFilterSpecification): IFilterSpecification {
    return new OrSpecification(this, spec);
  }
}