// src/core/services/tdParser/filters/TextSearchFilter.ts
import { BaseFilterSpecification } from './BaseFilterSpecification';
import { ASTNode, TaskNode, SectionNode } from '../types';
import { cleanText } from '../utils/textUtils';

export class TextSearchFilter extends BaseFilterSpecification {
  private readonly searchText: string;

  constructor(searchText: string) {
    super();
    this.searchText = searchText ? searchText.trim().toLowerCase() : '';
  }

  public isSatisfiedBy(node: ASTNode): boolean {
    if (!this.searchText) return true;
    switch (node.type) {
      case 'section': {
        const section = node as SectionNode;
        const title = section.title ? section.title.toLowerCase() : '';
        const text = cleanText(section.text).toLowerCase();
        return title.includes(this.searchText) || text.includes(this.searchText);
      }
      case 'task': {
        const task = node as TaskNode;
        if (cleanText(task.text).toLowerCase().includes(this.searchText)) return true;
        if (task.status && task.status.toLowerCase().includes(this.searchText)) return true;
        if (task.priority && task.priority.toLowerCase().includes(this.searchText)) return true;
        if (task.meta && Object.entries(task.meta).some(([k, v]) => k.toLowerCase().includes(this.searchText) || String(v).toLowerCase().includes(this.searchText))) return true;
        if (task.notes && task.notes.some(note => cleanText(note.text).toLowerCase().includes(this.searchText))) return true;
        return false;
      }
      case 'note':
        return cleanText(node.text).toLowerCase().includes(this.searchText);
      default:
        return cleanText(node.text).toLowerCase().includes(this.searchText);
    }
  }
}