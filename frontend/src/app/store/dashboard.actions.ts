import { createActionGroup, props } from '@ngrx/store';
import type { DocumentListItemWithClauses } from '../models/document.model';

export interface DashboardFilters {
  search: string;
  clause: string | null;
  dateFrom: string | null;
  dateTo: string | null;
}

export const DashboardActions = createActionGroup({
  source: 'Dashboard',
  events: {
    'Load Documents': props<{ filters: DashboardFilters }>(),
    'Load Documents Success': props<{
      documents: DocumentListItemWithClauses[];
    }>(),
    'Load Documents Failure': props<{ error: string }>(),
    'Set Filters': props<{ filters: Partial<DashboardFilters> }>(),
    'Set Group By Clauses': props<{ groupByClauses: boolean }>(),
    'Reset Filters': props<{ confirm: boolean }>(),
  },
});
