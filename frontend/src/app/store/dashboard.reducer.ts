import { createFeature, createReducer, on } from '@ngrx/store';
import type { DocumentListItemWithClauses } from '../models/document.model';
import type { DashboardFilters } from './dashboard.actions';
import { DashboardActions } from './dashboard.actions';

export interface DashboardState {
  documents: DocumentListItemWithClauses[];
  loading: boolean;
  error: string | null;
  filters: DashboardFilters;
  groupByClauses: boolean;
}

const initialFilters: DashboardFilters = {
  search: '',
  clause: null,
  dateFrom: null,
  dateTo: null,
};

const initialState: DashboardState = {
  documents: [],
  loading: false,
  error: null,
  filters: initialFilters,
  groupByClauses: false,
};

export const dashboardFeature = createFeature({
  name: 'dashboard',
  reducer: createReducer(
    initialState,
    on(DashboardActions.loadDocuments, (state, { filters }) => ({
      ...state,
      loading: true,
      error: null,
      filters: { ...state.filters, ...filters },
    })),
    on(DashboardActions.loadDocumentsSuccess, (state, { documents }) => ({
      ...state,
      documents,
      loading: false,
      error: null,
    })),
    on(DashboardActions.loadDocumentsFailure, (state, { error }) => ({
      ...state,
      loading: false,
      error,
    })),
    on(DashboardActions.setFilters, (state, { filters }) => ({
      ...state,
      filters: { ...state.filters, ...filters },
    })),
    on(DashboardActions.setGroupByClauses, (state, { groupByClauses }) => ({
      ...state,
      groupByClauses,
    })),
    on(DashboardActions.resetFilters, (state, { confirm }) =>
      confirm
        ? {
            ...state,
            filters: initialFilters,
            groupByClauses: false,
          }
        : state
    )
  ),
});

export const {
  selectDashboardState,
  selectDocuments,
  selectLoading,
  selectError,
  selectFilters,
  selectGroupByClauses,
} = dashboardFeature;
