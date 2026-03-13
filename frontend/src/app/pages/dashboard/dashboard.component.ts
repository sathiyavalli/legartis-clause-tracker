import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  signal,
  computed,
} from '@angular/core';
import { AsyncPipe, DatePipe, CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { debounceTime } from 'rxjs/operators';

import type { DocumentListItemWithClauses } from '../../models/document.model';
import { DashboardActions } from '../../store/dashboard.actions';
import {
  selectFilteredDocuments,
  selectGroupedByClause,
  selectAllClauseTypes,
} from '../../store/dashboard.selectors';
import { dashboardFeature } from '../../store/dashboard.reducer';

export interface DashboardFilterForm {
  search: FormControl<string>;
  clause: FormControl<string | null>;
  dateFrom: FormControl<string | null>;
  dateTo: FormControl<string | null>;
  groupByClauses: FormControl<boolean>;
}

type SortField = 'name' | 'date';
type SortDirection = 'asc' | 'desc';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    AsyncPipe,
    DatePipe,
    RouterLink,
    ReactiveFormsModule,
    CommonModule,
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardComponent implements OnInit {
  private readonly store = inject(Store);

  filterForm = new FormGroup<DashboardFilterForm>({
    search: new FormControl('', { nonNullable: true }),
    clause: new FormControl<string | null>(null),
    dateFrom: new FormControl<string | null>(null),
    dateTo: new FormControl<string | null>(null),
    groupByClauses: new FormControl(false, { nonNullable: true }),
  });

  // Sorting state
  sortField = signal<SortField>('date');
  sortDirection = signal<SortDirection>('desc');
  
  // Dropdown toggles
  clauseDropdownOpen = signal(false);

  loading$ = this.store.select(dashboardFeature.selectLoading);
  groupByClauses$ = this.store.select(dashboardFeature.selectGroupByClauses);
  clauseTypes$: Observable<string[]> = this.store.select(
    selectAllClauseTypes
  );
  filteredDocuments$: Observable<DocumentListItemWithClauses[]> =
    this.store.select(selectFilteredDocuments);
  groupedView$: Observable<
    { clauseType: string; contracts: DocumentListItemWithClauses[] }[] | DocumentListItemWithClauses[]
  > = this.store.select(selectGroupedByClause);

  // Signals to track documents and grouped data
  documents = signal<DocumentListItemWithClauses[]>([]);
  groupedData = signal<
    { clauseType: string; contracts: DocumentListItemWithClauses[] }[] | DocumentListItemWithClauses[]
  >([]);

  // Pagination
  displayCount = signal(15);

  // Computed sorted documents
  sortedDocuments = computed(() => {
    return this.sortDocuments(this.documents(), this.sortField(), this.sortDirection());
  });

  // Computed documents with pagination
  paginatedDocuments = computed(() => {
    const sorted = this.sortedDocuments();
    return sorted.slice(0, this.displayCount());
  });

  // Computed sorted grouped data
  sortedGroupedData = computed(() => {
    const data = this.groupedData();
    if (Array.isArray(data) && data.length > 0 && 'clauseType' in data[0]) {
      return (
        data as { clauseType: string; contracts: DocumentListItemWithClauses[] }[]
      ).map((group) => ({
        ...group,
        contracts: this.sortDocuments(group.contracts, this.sortField(), this.sortDirection()),
      }));
    }
    return data as DocumentListItemWithClauses[];
  });

  // Computed grouped data with pagination per group
  paginatedGroupedData = computed(() => {
    const data = this.sortedGroupedData();
    if (Array.isArray(data) && data.length > 0 && 'clauseType' in data[0]) {
      return (
        data as { clauseType: string; contracts: DocumentListItemWithClauses[] }[]
      ).map((group) => ({
        ...group,
        contracts: group.contracts.slice(0, this.displayCount()),
      }));
    }
    return data as DocumentListItemWithClauses[];
  });

  // Check if there are more documents to load
  hasMoreDocuments = computed(() => {
    const sorted = this.sortedDocuments();
    return sorted.length > this.displayCount();
  });

  resetConfirmOpen = signal(false);

  private sortDocuments(
    documents: DocumentListItemWithClauses[],
    sortField: SortField | unknown,
    sortDirection: SortDirection | unknown
  ): DocumentListItemWithClauses[] {
    const field = sortField as SortField;
    const direction = sortDirection as SortDirection;
    
    const sorted = [...documents].sort((a, b) => {
      let compareValue = 0;

      if (field === 'name') {
        compareValue = (a.filename ?? '').localeCompare(b.filename ?? '');
      } else if (field === 'date') {
        const dateA = new Date(a.uploaded_at).getTime();
        const dateB = new Date(b.uploaded_at).getTime();
        compareValue = dateA - dateB;
      }

      return direction === 'asc' ? compareValue : -compareValue;
    });

    return sorted;
  }

  ngOnInit(): void {
    // Subscribe to filtered documents and update signal
    this.filteredDocuments$.subscribe((docs) => {
      this.documents.set(docs);
      this.displayCount.set(15); // Reset display count when filters change
    });

    // Subscribe to grouped view and update signal
    this.groupedView$.subscribe((data) => {
      this.groupedData.set(data);
      this.displayCount.set(15); // Reset display count when filters change
    });

    this.store.dispatch(
      DashboardActions.loadDocuments({
        filters: {
          search: '',
          clause: null,
          dateFrom: null,
          dateTo: null,
        },
      })
    );

    // Debounced search: trigger after 4+ characters or 400ms
    this.filterForm.controls.search.valueChanges
      .pipe(debounceTime(400))
      .subscribe((value) => {
        if (value.length >= 4 || value.length === 0) {
          this.dispatchFilters();
        }
      });

    // Other filter changes trigger immediately
    this.filterForm.controls.clause.valueChanges.subscribe(() => {
      this.dispatchFilters();
    });

    this.filterForm.controls.dateFrom.valueChanges.subscribe(() => {
      this.dispatchFilters();
    });

    this.filterForm.controls.dateTo.valueChanges.subscribe(() => {
      this.dispatchFilters();
    });

    this.filterForm.controls.groupByClauses.valueChanges.subscribe((value) => {
      this.store.dispatch(
        DashboardActions.setGroupByClauses({
          groupByClauses: value ?? false,
        })
      );
    });
  }

  private dispatchFilters(): void {
    const v = this.filterForm.getRawValue();
    this.store.dispatch(
      DashboardActions.setFilters({
        filters: {
          search: v.search ?? '',
          clause: v.clause ?? null,
          dateFrom: v.dateFrom ?? null,
          dateTo: v.dateTo ?? null,
        },
      })
    );
    this.store.dispatch(
      DashboardActions.loadDocuments({
        filters: {
          search: v.search ?? '',
          clause: v.clause ?? null,
          dateFrom: v.dateFrom ?? null,
          dateTo: v.dateTo ?? null,
        },
      })
    );
  }

  toggleViewMode(grouped: boolean): void {
    this.filterForm.controls.groupByClauses.setValue(grouped);
  }

  loadMore(): void {
    this.displayCount.update(count => count + 15);
  }

  toggleClauseDropdown(): void {
    this.clauseDropdownOpen.update(v => !v);
  }

  selectClause(clauseType: string | null): void {
    this.filterForm.controls.clause.setValue(clauseType);
    this.clauseDropdownOpen.set(false);
  }

  toggleSort(field: SortField): void {
    if (this.sortField() === field) {
      this.sortDirection.update(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortField.set(field);
      this.sortDirection.set('asc');
    }
  }

  getSortIcon(field: SortField): string {
    if (this.sortField() !== field) return '⇅';
    return this.sortDirection() === 'asc' ? '↑' : '↓';
  }

  openResetConfirm(): void {
    this.resetConfirmOpen.set(true);
  }

  closeResetConfirm(): void {
    this.resetConfirmOpen.set(false);
  }

  confirmResetFilters(): void {
    this.filterForm.reset({
      search: '',
      clause: null,
      dateFrom: null,
      dateTo: null,
      groupByClauses: false,
    });
    this.sortField.set('date');
    this.sortDirection.set('desc');
    this.store.dispatch(DashboardActions.resetFilters({ confirm: true }));
    this.store.dispatch(
      DashboardActions.loadDocuments({
        filters: {
          search: '',
          clause: null,
          dateFrom: null,
          dateTo: null,
        },
      })
    );
    this.resetConfirmOpen.set(false);
  }

  trackByDocId(_: number, doc: DocumentListItemWithClauses): number {
    return doc.id;
  }

  trackByClauseType(
    _: number,
    item:
      | { clauseType: string; contracts: DocumentListItemWithClauses[] }
      | DocumentListItemWithClauses
  ): string {
    return typeof item === 'object' && item !== null && 'clauseType' in item
      ? item.clauseType
      : String((item as DocumentListItemWithClauses).id);
  }

}
