import { inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, map, mergeMap, of } from 'rxjs';
import { ApiService } from '../services/api.service';
import { DashboardActions } from './dashboard.actions';

export const loadDocumentsEffect = createEffect(
  (actions$ = inject(Actions), api = inject(ApiService)) =>
    actions$.pipe(
      ofType(DashboardActions.loadDocuments),
      mergeMap(({ filters }) =>
        api
          .getDocumentsWithClauses({
            search: filters.search || undefined,
            date_from: filters.dateFrom,
            date_to: filters.dateTo,
          })
          .pipe(
            map((documents) =>
              DashboardActions.loadDocumentsSuccess({ documents })
            ),
            catchError((err: Error) =>
              of(
                DashboardActions.loadDocumentsFailure({
                  error: err?.message ?? 'Failed to load documents',
                })
              )
            )
          )
      )
    ),
  { functional: true }
);
