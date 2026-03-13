import { Component, inject, signal, computed, OnInit, HostListener, OnDestroy } from '@angular/core';
import { CommonModule, NgFor, NgIf } from '@angular/common';
import { ActivatedRoute, RouterLink, Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { Store } from '@ngrx/store';
import { ApiService } from '../../services/api.service';
import type { Document } from '../../models/document.model';
import type { Sentence } from '../../models/sentence.model';
import type { ClauseType } from '../../store/clause-types.model';
import * as ClauseTypesActions from '../../store/clause-types.actions';
import * as ClauseTypesSelectors from '../../store/clause-types.selectors';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

const CLAUSE_TYPES = [
  'Limitation of Liability',
  'Termination for Convenience',
  'Non-Compete',
  'Confidentiality',
  'Indemnification',
  'Governing Law',
  'Force Majeure',
  'Warranties',
  'Insurance',
  'Other',
];

// Color mapping for each clause type
const CLAUSE_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  'Limitation of Liability': { bg: '#FFF3CD', border: '#FFC107', text: '#856404' },
  'Termination for Convenience': { bg: '#F8D7DA', border: '#DC3545', text: '#721C24' },
  'Non-Compete': { bg: '#D1ECF1', border: '#17A2B8', text: '#0C5460' },
  'Confidentiality': { bg: '#D4EDDA', border: '#28A745', text: '#155724' },
  'Indemnification': { bg: '#E2E3E5', border: '#6C757D', text: '#383D41' },
  'Governing Law': { bg: '#CCE5FF', border: '#0056B3', text: '#084298' },
  'Force Majeure': { bg: '#F8B4D9', border: '#C2185B', text: '#6F1D77' },
  'Warranties': { bg: '#CFFBF8', border: '#00897B', text: '#055160' },
  'Insurance': { bg: '#FFCCDA', border: '#D81B60', text: '#9D1A36' },
  'Other': { bg: '#E8E8E8', border: '#757575', text: '#4A4A4A' },
};

interface HighlightedSegment {
  text: string;
  clauseType: string;
}

@Component({
  selector: 'app-document-viewer',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    ReactiveFormsModule,
    NgFor,
    NgIf,
  ],
  templateUrl: './document-viewer.component.html',
  styleUrl: './document-viewer.component.scss',
})
export class DocumentViewerComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly api = inject(ApiService);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly store = inject(Store);
  private readonly fb = inject(FormBuilder);
  private readonly destroy$ = new Subject<void>();

  document = signal<Document | null>(null);
  sentences = signal<Sentence[]>([]);
  loading = signal(true);
  clauseTypes = CLAUSE_TYPES;
  clauseColors = CLAUSE_COLORS;
  
  // Modal for assigning clause types
  showModal = signal(false);
  selectedText = signal('');
  
  // Sidebar toggle
  sidebarOpen = signal(true);
  
  // Clause counts
  clauseCounts = signal<Record<string, number>>({});

  // Breadcrumb: document viewer is always step 3
  currentStep = signal<1 | 2 | 3>(3);

  // Highlighted text segments
  highlightedSegments = signal<HighlightedSegment[]>([]);
  highlightedContent = signal<SafeHtml>('');

  // Notification system
  showNotification = signal(false);
  notificationMessage = signal('');
  notificationType = signal<'success' | 'error'>('success');

  // Confirmation dialog for navigation
  showConfirmNavigationDialog = signal(false);

  // Clause Type CRUD
  clauseTypesList = signal<ClauseType[]>([]);
  showAddClauseInput = signal(false);
  addClauseForm: FormGroup;
  editingClauseId = signal<number | null>(null);
  editingClauseName = signal('');
  showDeleteConfirmation = signal(false);
  deleteConfirmationClause = signal<ClauseType | null>(null);
  clauseTypesLoading = signal(false);
  clauseTypesError = signal<string | null>(null);

  docId = computed(() => Number(this.route.snapshot.paramMap.get('id')));

  constructor() {
    this.addClauseForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
    });
  }

  ngOnInit(): void {
    // Load clause types from store
    this.store.dispatch(ClauseTypesActions.loadClauseTypes());
    
    // Subscribe to clause types
    this.store
      .select(ClauseTypesSelectors.selectClauseTypesItems)
      .pipe(takeUntil(this.destroy$))
      .subscribe((items) => {
        this.clauseTypesList.set(items);
      });

    this.store
      .select(ClauseTypesSelectors.selectClauseTypesLoading)
      .pipe(takeUntil(this.destroy$))
      .subscribe((loading) => {
        this.clauseTypesLoading.set(loading);
      });

    this.store
      .select(ClauseTypesSelectors.selectClauseTypesError)
      .pipe(takeUntil(this.destroy$))
      .subscribe((error) => {
        if (error) {
          this.clauseTypesError.set(error);
          this.showErrorNotification(error);
        }
      });

    this.store
      .select(ClauseTypesSelectors.selectClauseTypesSuccess)
      .pipe(takeUntil(this.destroy$))
      .subscribe((message) => {
        if (message) {
          this.showSuccessNotification(message);
        }
      });

    const id = this.docId();
    if (!id) return;
    this.loading.set(true);
    this.api.getDocument(id).subscribe({
      next: (doc) => {
        this.document.set(doc);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
    this.api.getSentences(id).subscribe({
      next: (list) => {
        this.sentences.set(list);
        this.updateCounts(list);
        this.buildHighlights(list);
      },
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  buildHighlights(sentenceList: Sentence[]): void {
    const highlights: HighlightedSegment[] = [];
    sentenceList.forEach(s => {
      if (s.clause_type) {
        highlights.push({ text: s.text, clauseType: s.clause_type });
      }
    });
    this.highlightedSegments.set(highlights);
    this.generateHighlightedHTML();
  }

  generateHighlightedHTML(): void {
    const doc = this.document();
    if (!doc) {
      this.highlightedContent.set('');
      return;
    }

    let content = doc.content;
    const highlights = this.highlightedSegments();
    const sentences = this.sentences();

    // Escape HTML special characters first
    content = this.escapeHtml(content);

    // Sort by length descending to highlight longer matches first
    const sortedHighlights = [...highlights].sort((a, b) => b.text.length - a.text.length);

    sortedHighlights.forEach(highlight => {
      const searchText = this.escapeHtml(highlight.text);
      const labelText = this.escapeHtml(highlight.clauseType);
      const color = this.getClauseColor(highlight.clauseType);
      
      // Find the sentence ID for this highlighted text
      const matchingSentence = sentences.find(s => 
        this.normalizeText(s.text) === this.normalizeText(highlight.text)
      );
      const sentenceId = matchingSentence?.id || 0;
      
      // Create mark with clause label + inline remove button
      const replacement = `<mark class="highlight" data-sentence-id="${sentenceId}" data-clause-type="${highlight.clauseType}" style="background-color: ${color.bg}; border-left: 3px solid ${color.border};">` +
        `<span class="highlight-label" style="color: ${color.text};">${labelText}</span> ` +
        `${searchText}` +
        `<button class="inline-remove-btn" style="background-color: #d5365e;border-color:transparent;color: #ffffff;border-radius:20px;cursor:pointer;" data-sentence-id="${sentenceId}" data-clause-type="${highlight.clauseType}" title="Remove clause">x</button>` +
        `</mark>`;
      
      // Use case-insensitive (i) but NOT global (g) - only replace FIRST occurrence
      const regex = new RegExp(searchText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      content = content.replace(regex, replacement);
    });

    // Sanitize and mark as safe HTML
    const safeHtml = this.sanitizer.bypassSecurityTrustHtml(content);
    this.highlightedContent.set(safeHtml);
  }

  private normalizeText(text: string): string {
    return text.toLowerCase().trim().replace(/\s+/g, ' ');
  }

  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  onTextSelection(event?: MouseEvent): void {
    try {
      if (!event) return;

      // Check if clicked element is a remove button (or inside it)
      let target = event.target as HTMLElement;
      let btn: HTMLElement | null = null;
      
      // Check if the target itself is a button or find parent button
      if (target.classList.contains('inline-remove-btn')) {
        btn = target;
      } else if (target.closest('.inline-remove-btn')) {
        btn = target.closest('.inline-remove-btn') as HTMLElement;
      }
      
      if (btn) {
        const sentenceId = parseInt(btn.getAttribute('data-sentence-id') || '0', 10);
        const clauseType = btn.getAttribute('data-clause-type') || '';
        if (sentenceId > 0 && clauseType) {
          this.removeClause(sentenceId, clauseType);
        }
        return;
      }

      // Check for text selection (but not if middle of clicking)
      const selection = window.getSelection();
      const selectedText = selection?.toString().trim() || '';
      
      if (selectedText.length > 0) {
        this.selectedText.set(selectedText);
        this.showModal.set(true);
      }
    } catch (error) {
      console.error('Error in text selection:', error);
    }
  }

  updateCounts(sentenceList: Sentence[]): void {
    const counts: Record<string, number> = {};
    // Initialize counts for clause types currently available in the store
    this.clauseTypesList().forEach(ct => (counts[ct.name] = 0));

    sentenceList.forEach(s => {
      if (s.clause_type) {
        counts[s.clause_type] = (counts[s.clause_type] || 0) + 1;
      }
    });

    this.clauseCounts.set(counts);
  }

  assignClauseToSelection(clauseType: string): void {
    const selection = this.selectedText();
    const sentences = this.sentences();
    
    if (!selection) {
      this.showErrorNotification('No text selected');
      this.closeModal();
      return;
    }

    // Normalize text: handle multi-line selections and extra whitespace
    const normalizeText = (text: string): string => {
      return text.toLowerCase().trim().replace(/\s+/g, ' ');
    };

    const selectedNormalized = normalizeText(selection);
    console.log('Selected normalized:', selectedNormalized.substring(0, 100));
    
    // First, try to find sentences that directly contain the selected text
    let sentencesToLabel = sentences.filter(s => {
      const sentenceNormalized = normalizeText(s.text);
      return sentenceNormalized.includes(selectedNormalized);
    });
    
    // If no direct matches, try to find consecutive sentences whose combined text contains the selection
    if (sentencesToLabel.length === 0) {
      console.log('No direct match found, checking consecutive sentence combinations...');
      
      for (let i = 0; i < sentences.length; i++) {
        // Only try combining 2-3 sentences MAX (not 2-5)
        for (let len = 2; len <= 3 && i + len <= sentences.length; len++) {
          const combined = sentences
            .slice(i, i + len)
            .map(s => s.text)
            .join(' ');
          const combinedNormalized = normalizeText(combined);
          
          if (combinedNormalized.includes(selectedNormalized)) {
            console.log(`Found match with ${len} consecutive sentences starting at index ${i}`);
            // Label these sentences
            sentencesToLabel = sentences.slice(i, i + len);
            break;
          }
        }
        
        if (sentencesToLabel.length > 0) break;
      }
    }
    
    console.log('Found sentences to label:', sentencesToLabel.length);

    if (sentencesToLabel.length === 0) {
      this.showErrorNotification('Selected text not found in document. Make sure you selected complete text that matches the document.');
      this.closeModal();
      return;
    }

    let successCount = 0;
    sentencesToLabel.forEach(s => {
      this.api.labelSentence(this.docId(), s.id, clauseType).subscribe({
        next: (updated) => {
          this.sentences.update(list =>
            list.map(sent => sent.id === updated.id ? updated : sent)
          );
          successCount++;
          if (successCount === sentencesToLabel.length) {
            this.updateCounts(this.sentences());
            this.buildHighlights(this.sentences());
            this.showSuccessNotification(`✓ "${clauseType}" label added`);
            this.closeModal();
          }
        },
        error: (err) => {
          console.error('Failed to label sentence:', err);
          this.showErrorNotification('Failed to add label');
        },
      });
    });
  }

  private showSuccessNotification(message: string): void {
    this.notificationMessage.set(message);
    this.notificationType.set('success');
    this.showNotification.set(true);
    setTimeout(() => this.showNotification.set(false), 3000);
  }

  private showErrorNotification(message: string): void {
    this.notificationMessage.set(message);
    this.notificationType.set('error');
    this.showNotification.set(true);
    setTimeout(() => this.showNotification.set(false), 3000);
  }

  closeModal(): void {
    this.showModal.set(false);
    this.selectedText.set('');
    // Clear selection
    if (window.getSelection) {
      window.getSelection()?.removeAllRanges();
    }
  }

  removeClause(sentenceId: number, clauseType: string): void {
    // Remove clause by setting clause_type to null
    this.api.labelSentence(this.docId(), sentenceId, null as any).subscribe({
      next: (updated) => {
        this.sentences.update(list =>
          list.map(sent => sent.id === updated.id ? updated : sent)
        );
        this.updateCounts(this.sentences());
        this.buildHighlights(this.sentences());
        this.showSuccessNotification(`✓ "${clauseType}" label removed`);
      },
      error: (err) => {
        console.error('Failed to remove clause:', err);
        this.showErrorNotification('Failed to remove label');
      },
    });
  }

  toggleSidebar(): void {
    this.sidebarOpen.update(v => !v);
  }

  getClauseColor(clauseType: string): { bg: string; border: string; text: string } {
    const base = CLAUSE_COLORS[clauseType];
    if (base) return base;

    // Generate stable, deterministic colors for new/edited clause types.
    // This keeps colors consistent across renders for the same clause label.
    const palette = [
      { bg: '#FFF3CD', border: '#FFC107', text: '#856404' },
      { bg: '#F8D7DA', border: '#DC3545', text: '#721C24' },
      { bg: '#D1ECF1', border: '#17A2B8', text: '#0C5460' },
      { bg: '#D4EDDA', border: '#28A745', text: '#155724' },
      { bg: '#E2E3E5', border: '#6C757D', text: '#383D41' },
      { bg: '#CCE5FF', border: '#0056B3', text: '#ffffff' },
      { bg: '#F8B4D9', border: '#C2185B', text: '#6F1D77' },
      { bg: '#CFFBF8', border: '#00897B', text: '#055160' },
      { bg: '#FFCCDA', border: '#D81B60', text: '#ffffff' },
      { bg: '#E8E8E8', border: '#757575', text: '#4A4A4A' },
    ];

    const index = Math.abs(this.hashString(clauseType)) % palette.length;
    return palette[index];
  }

  private hashString(value: string): number {
    let hash = 0;
    for (let i = 0; i < value.length; i++) {
      hash = (hash << 5) - hash + value.charCodeAt(i);
      hash |= 0; // Convert to 32bit int
    }
    return hash;
  }

  trackBySentence(_: number, s: Sentence): number {
    return s.id;
  }

  trackByClause(_: number, t: string): string {
    return t;
  }

  onNewContractClick(): void {
    // Check if any clauses have been labeled
    const hasLabeledClauses = this.highlightedSegments().length > 0;
    
    if (!hasLabeledClauses) {
      // Show confirmation dialog
      this.showConfirmNavigationDialog.set(true);
    } else {
      // If clauses exist, navigate directly
      this.router.navigate(['/upload']);
    }
  }

  confirmNewContract(): void {
    this.showConfirmNavigationDialog.set(false);
    this.router.navigate(['/upload']);
  }

  cancelNewContract(): void {
    this.showConfirmNavigationDialog.set(false);
  }

  // ===== CLAUSE TYPE CRUD METHODS =====

  // Show input for adding new clause type
  openAddClauseInput(): void {
    this.showAddClauseInput.set(true);
    this.addClauseForm.reset();
    // Focus on input after rendering
    setTimeout(() => {
      const input = document.querySelector('.add-clause-input') as HTMLInputElement;
      input?.focus();
    }, 0);
  }

  // Cancel adding new clause
  cancelAddClause(): void {
    this.showAddClauseInput.set(false);
    this.addClauseForm.reset();
  }

  // Add new clause type
  addClauseType(): void {
    if (this.addClauseForm.invalid) {
      this.showErrorNotification('Clause name must be at least 3 characters');
      return;
    }

    const clauseName = this.addClauseForm.get('name')?.value?.trim();
    if (!clauseName) return;

    // Check for duplicates
    if (this.clauseTypesList().some(ct => ct.name.toLowerCase() === clauseName.toLowerCase())) {
      this.showErrorNotification('This clause type already exists');
      return;
    }

    this.store.dispatch(ClauseTypesActions.createClauseType({ name: clauseName }));
    this.showAddClauseInput.set(false);
    this.addClauseForm.reset();
  }

  // Start editing a clause type
  startEditClause(clause: ClauseType): void {
    this.editingClauseId.set(clause.id);
    this.editingClauseName.set(clause.name);
    // Focus on input
    setTimeout(() => {
      const input = document.querySelector(`[data-edit-id="${clause.id}"]`) as HTMLInputElement;
      input?.focus();
      input?.select();
    }, 0);
  }

  // Cancel editing
  cancelEditClause(): void {
    this.editingClauseId.set(null);
    this.editingClauseName.set('');
  }

  // Save edited clause name
  saveEditClause(clause: ClauseType): void {
    const newName = this.editingClauseName().trim();
    if (!newName || newName.length < 3) {
      this.showErrorNotification('Clause name must be at least 3 characters');
      return;
    }

    if (newName === clause.name) {
      this.cancelEditClause();
      return;
    }

    // Check for duplicates
    if (this.clauseTypesList().some(ct => ct.id !== clause.id && ct.name.toLowerCase() === newName.toLowerCase())) {
      this.showErrorNotification('This clause type already exists');
      return;
    }

    this.store.dispatch(ClauseTypesActions.updateClauseType({ id: clause.id, name: newName }));
    this.cancelEditClause();
  }

  // Show delete confirmation
  showDeleteConfirmationDialog(clause: ClauseType): void {
    this.deleteConfirmationClause.set(clause);
    this.showDeleteConfirmation.set(true);
  }

  // Cancel delete
  cancelDelete(): void {
    this.showDeleteConfirmation.set(false);
    this.deleteConfirmationClause.set(null);
  }

  // Confirm delete clause type
  confirmDelete(): void {
    const clause = this.deleteConfirmationClause();
    if (!clause) return;

    this.store.dispatch(ClauseTypesActions.deleteClauseType({ id: clause.id }));
    this.showDeleteConfirmation.set(false);
    this.deleteConfirmationClause.set(null);
  }

  // Handle Enter key in form
  onAddClauseKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      this.addClauseType();
    } else if (event.key === 'Escape') {
      this.cancelAddClause();
    }
  }

  // Handle Enter key in edit
  onEditClauseKeydown(event: KeyboardEvent, clause: ClauseType): void {
    if (event.key === 'Enter') {
      this.saveEditClause(clause);
    } else if (event.key === 'Escape') {
      this.cancelEditClause();
    }
  }

  // TrackBy function for clause types in ngFor
  trackByClauseId(index: number, item: ClauseType): number | string {
    return item.id;
  }
}
