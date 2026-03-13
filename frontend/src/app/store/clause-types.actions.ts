import { createAction, props } from '@ngrx/store';
import { ClauseType } from './clause-types.model';

// Load all clause types
export const loadClauseTypes = createAction('[Clause Types] Load Clause Types');

export const loadClauseTypesSuccess = createAction(
  '[Clause Types] Load Clause Types Success',
  props<{ items: ClauseType[] }>()
);

export const loadClauseTypesFailure = createAction(
  '[Clause Types] Load Clause Types Failure',
  props<{ error: string }>()
);

// Create clause type
export const createClauseType = createAction(
  '[Clause Types] Create Clause Type',
  props<{ name: string }>()
);

export const createClauseTypeSuccess = createAction(
  '[Clause Types] Create Clause Type Success',
  props<{ item: ClauseType }>()
);

export const createClauseTypeFailure = createAction(
  '[Clause Types] Create Clause Type Failure',
  props<{ error: string }>()
);

// Update clause type
export const updateClauseType = createAction(
  '[Clause Types] Update Clause Type',
  props<{ id: number; name: string }>()
);

export const updateClauseTypeSuccess = createAction(
  '[Clause Types] Update Clause Type Success',
  props<{ item: ClauseType }>()
);

export const updateClauseTypeFailure = createAction(
  '[Clause Types] Update Clause Type Failure',
  props<{ error: string }>()
);

// Delete clause type
export const deleteClauseType = createAction(
  '[Clause Types] Delete Clause Type',
  props<{ id: number }>()
);

export const deleteClauseTypeSuccess = createAction(
  '[Clause Types] Delete Clause Type Success',
  props<{ id: number }>()
);

export const deleteClauseTypeFailure = createAction(
  '[Clause Types] Delete Clause Type Failure',
  props<{ error: string }>()
);

// Clear error message
export const clearError = createAction('[Clause Types] Clear Error');

// Clear success message
export const clearSuccess = createAction('[Clause Types] Clear Success');
