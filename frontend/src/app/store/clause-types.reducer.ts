import { createReducer, on } from '@ngrx/store';
import { ClauseTypesState, initialClauseTypesState } from './clause-types.model';
import * as ClauseTypesActions from './clause-types.actions';

export const clauseTypesReducer = createReducer(
  initialClauseTypesState,

  // Load clause types
  on(ClauseTypesActions.loadClauseTypes, (state) => ({
    ...state,
    loading: true,
    error: null,
  })),

  on(ClauseTypesActions.loadClauseTypesSuccess, (state, { items }) => ({
    ...state,
    items,
    loading: false,
    error: null,
  })),

  on(ClauseTypesActions.loadClauseTypesFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  })),

  // Create clause type
  on(ClauseTypesActions.createClauseType, (state) => ({
    ...state,
    loading: true,
    error: null,
  })),

  on(ClauseTypesActions.createClauseTypeSuccess, (state, { item }) => ({
    ...state,
    items: [...state.items, item],
    loading: false,
    error: null,
    success: `Clause type '${item.name}' created successfully`,
  })),

  on(ClauseTypesActions.createClauseTypeFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  })),

  // Update clause type
  on(ClauseTypesActions.updateClauseType, (state) => ({
    ...state,
    loading: true,
    error: null,
  })),

  on(ClauseTypesActions.updateClauseTypeSuccess, (state, { item }) => ({
    ...state,
    items: state.items.map((ct) => (ct.id === item.id ? item : ct)),
    loading: false,
    error: null,
    success: `Clause type '${item.name}' updated successfully`,
  })),

  on(ClauseTypesActions.updateClauseTypeFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  })),

  // Delete clause type
  on(ClauseTypesActions.deleteClauseType, (state) => ({
    ...state,
    loading: true,
    error: null,
  })),

  on(ClauseTypesActions.deleteClauseTypeSuccess, (state, { id }) => ({
    ...state,
    items: state.items.filter((ct) => ct.id !== id),
    loading: false,
    error: null,
    success: 'Clause type deleted successfully',
  })),

  on(ClauseTypesActions.deleteClauseTypeFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  })),

  // Clear messages
  on(ClauseTypesActions.clearError, (state) => ({
    ...state,
    error: null,
  })),

  on(ClauseTypesActions.clearSuccess, (state) => ({
    ...state,
    success: null,
  }))
);
