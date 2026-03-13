import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ApiService } from '../../services/api.service';

// Shared list of clause types; kept simple for now
const CLAUSE_TYPES = [
  'Confidentiality',
  'Indemnification',
  'Limitation of Liability',
  'Termination for Convenience',
  'Non-Compete',
  'Governing Law',
  'Force Majeure',
  'Warranties',
  'Insurance',
  'Other',
];

@Component({
  selector: 'app-upload',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './upload.component.html',
  styleUrl: './upload.component.scss',
})
export class UploadComponent {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);

  uploading = false;
  selectedFile: File | null = null;
  errorMessage = '';

  // Breadcrumb state: track which step is active
  currentStep = signal<1 | 2 | 3>(1); // 1 = Choose, 2 = Upload, 3 = Assign

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    const allowed = ['.txt', '.md', '.markdown'];
    if (!allowed.some(ext => file.name.toLowerCase().endsWith(ext))) {
      this.errorMessage = 'Only .txt or .md files are allowed.';
      input.value = '';
      return;
    }
    this.errorMessage = '';
    this.selectedFile = file;
  }

  upload(): void {
    if (!this.selectedFile) {
      this.errorMessage = 'Please select a file.';
      return;
    }
    this.uploading = true;
    this.errorMessage = '';
    this.currentStep.set(2); // Move to upload step
    console.log('Starting upload for file:', this.selectedFile.name);
    this.api.uploadDocument(this.selectedFile).subscribe({
      next: (doc) => {
        console.log('Upload successful, received document:', doc);
        this.uploading = false;
        // Navigate to document viewer to assign labels
        this.router.navigate(['/contracts', doc.id]);
      },
      error: (err) => {
        console.error('Upload error:', err);
        this.uploading = false;
        this.currentStep.set(1); // Reset to choose step
        this.errorMessage = err.error?.detail || err.message || 'Upload failed.';
      },
      complete: () => {
        console.log('Upload request completed');
      },
    });
  }
}
