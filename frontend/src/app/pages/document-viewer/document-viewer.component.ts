import { Component, inject, signal, computed, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink, Router } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ApiService } from '../../services/api.service';
import type { Document } from '../../models/document.model';
import type { Sentence } from '../../models/sentence.model';

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
  ],
  templateUrl: './document-viewer.component.html',
  styleUrl: './document-viewer.component.scss',
})
export class DocumentViewerComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly api = inject(ApiService);
  private readonly sanitizer = inject(DomSanitizer);

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

  docId = computed(() => Number(this.route.snapshot.paramMap.get('id')));

  ngOnInit(): void {
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
      const color = CLAUSE_COLORS[highlight.clauseType];
      
      // Find the sentence ID for this highlighted text
      const matchingSentence = sentences.find(s => 
        this.normalizeText(s.text) === this.normalizeText(highlight.text)
      );
      const sentenceId = matchingSentence?.id || 0;
      
      // Create mark with data attributes for inline remove button
      const replacement = `<mark class="highlight" data-sentence-id="${sentenceId}" data-clause-type="${highlight.clauseType}" style="background-color: ${color.bg}; border-left: 3px solid ${color.border}; padding: 2px 4px; display: inline; position: relative;">${searchText}<button class="inline-remove-btn" data-sentence-id="${sentenceId}" data-clause-type="${highlight.clauseType}" title="Remove clause">✕</button></mark>`;
      
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
    this.clauseTypes.forEach(ct => counts[ct] = 0);
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
    return CLAUSE_COLORS[clauseType] || { bg: '#E8E8E8', border: '#757575', text: '#4A4A4A' };
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
}
