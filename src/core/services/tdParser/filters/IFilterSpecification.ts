// IFilterSpecification.ts
import { ASTNode } from '../types';

export interface IFilterSpecification {
  isSatisfiedBy(node: ASTNode): boolean;
  and(spec: IFilterSpecification): IFilterSpecification;
  or(spec: IFilterSpecification): IFilterSpecification;
}