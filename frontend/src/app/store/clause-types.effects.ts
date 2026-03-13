import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { of } from 'rxjs';
import { catchError, map, switchMap, delay } from 'rxjs/operators';
import { ApiService } from '../services/api.service';
import * as ClauseTypesActions from './clause-types.actions';

@Injectable()
export class ClauseTypesEffects {
  private actions$ = inject(Actions);
  private apiService = inject(ApiService);

  loadClauseTypes$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ClauseTypesActions.loadClauseTypes),
      switchMap(() =>
        this.apiService.getClauseTypes().pipe(
          map((items) => ClauseTypesActions.loadClauseTypesSuccess({ items })),
          catchError((error) =>
            of(
              ClauseTypesActions.loadClauseTypesFailure({
                error: error.error?.detail || 'Failed to load clause types',
              })
            )
          )
        )
      )
    )
  );

  createClauseType$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ClauseTypesActions.createClauseType),
      switchMap(({ name }) =>
        this.apiService.createClauseType({ name }).pipe(
          map((item) => ClauseTypesActions.createClauseTypeSuccess({ item })),
          catchError((error) =>
            of(
              ClauseTypesActions.createClauseTypeFailure({
                error: error.error?.detail || 'Failed to create clause type',
              })
            )
          )
        )
      )
    )
  );

  updateClauseType$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ClauseTypesActions.updateClauseType),
      switchMap(({ id, name }) =>
        this.apiService.updateClauseType(id, { name }).pipe(
          map((item) => ClauseTypesActions.updateClauseTypeSuccess({ item })),
          catchError((error) =>
            of(
              ClauseTypesActions.updateClauseTypeFailure({
                error: error.error?.detail || 'Failed to update clause type',
              })
            )
          )
        )
      )
    )
  );

  deleteClauseType$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ClauseTypesActions.deleteClauseType),
      switchMap(({ id }) =>
        this.apiService.deleteClauseType(id).pipe(
          map(() => ClauseTypesActions.deleteClauseTypeSuccess({ id })),
          catchError((error) =>
            of(
              ClauseTypesActions.deleteClauseTypeFailure({
                error: error.error?.detail || 'Failed to delete clause type',
              })
            )
          )
        )
      )
    )
  );

  clearErrorAfterDelay$ = createEffect(() =>
    this.actions$.pipe(
      ofType(
        ClauseTypesActions.createClauseTypeFailure,
        ClauseTypesActions.updateClauseTypeFailure,
        ClauseTypesActions.deleteClauseTypeFailure,
        ClauseTypesActions.loadClauseTypesFailure
      ),
      switchMap(() =>
        of(ClauseTypesActions.clearError()).pipe(delay(4000))
      )
    )
  );

  clearSuccessAfterDelay$ = createEffect(() =>
    this.actions$.pipe(
      ofType(
        ClauseTypesActions.createClauseTypeSuccess,
        ClauseTypesActions.updateClauseTypeSuccess,
        ClauseTypesActions.deleteClauseTypeSuccess
      ),
      switchMap(() =>
        of(ClauseTypesActions.clearSuccess()).pipe(delay(3000))
      )
    )
  );
}
