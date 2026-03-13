import { createFeatureSelector, createSelector } from '@ngrx/store';
import { ClauseTypesState } from './clause-types.model';

export const selectClauseTypesFeature = createFeatureSelector<ClauseTypesState>('clauseTypes');

export const selectClauseTypesItems = createSelector(
  selectClauseTypesFeature,
  (state) => state.items
);

export const selectClauseTypesLoading = createSelector(
  selectClauseTypesFeature,
  (state) => state.loading
);

export const selectClauseTypesError = createSelector(
  selectClauseTypesFeature,
  (state) => state.error
);

export const selectClauseTypesSuccess = createSelector(
  selectClauseTypesFeature,
  (state) => state.success
);

export const selectClauseTypeById = (id: number) =>
  createSelector(selectClauseTypesItems, (items) =>
    items.find((ct) => ct.id === id)
  );

export const selectClauseTypeNames = createSelector(
  selectClauseTypesItems,
  (items) => items.map((ct) => ct.name)
);
