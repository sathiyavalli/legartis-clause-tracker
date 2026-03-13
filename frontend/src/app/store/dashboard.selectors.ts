import { createSelector } from '@ngrx/store';
import type { DocumentListItemWithClauses } from '../models/document.model';
import { dashboardFeature } from './dashboard.reducer';

const { selectDocuments, selectFilters, selectGroupByClauses } =
  dashboardFeature;

/** Filters documents by clause only (search/date applied via API). */
export const selectFilteredDocuments = createSelector(
  selectDocuments,
  selectFilters,
  (
    documents: DocumentListItemWithClauses[],
    filters: { clause: string | null }
  ) => {
    const clause = filters.clause;
    if (!clause) return documents;
    return documents.filter(
      (d) => (d.clause_types ?? []).indexOf(clause) !== -1
    );
  }
);

export const selectGroupedByClause = createSelector(
  selectFilteredDocuments,
  selectGroupByClauses,
  (
    documents: DocumentListItemWithClauses[],
    groupBy: boolean
  ): { clauseType: string; contracts: DocumentListItemWithClauses[] }[] | DocumentListItemWithClauses[] => {
    if (!groupBy) return documents;
    const map = new Map<string, DocumentListItemWithClauses[]>();
    for (const doc of documents) {
      const types = doc.clause_types ?? [];
      if (types.length === 0) {
        const key = '(No clause)';
        if (!map.has(key)) map.set(key, []);
        map.get(key)!.push(doc);
      } else {
        for (const t of types) {
          if (!map.has(t)) map.set(t, []);
          const arr = map.get(t)!;
          if (!arr.includes(doc)) arr.push(doc);
        }
      }
    }
    return Array.from(map.entries()).map(([clauseType, contracts]) => ({
      clauseType,
      contracts,
    }));
  }
);

export const selectAllClauseTypes = createSelector(
  selectDocuments,
  (documents: DocumentListItemWithClauses[]) => {
    const set = new Set<string>();
    documents.forEach((d) => (d.clause_types ?? []).forEach((c) => set.add(c)));
    return Array.from(set).sort();
  }
);
