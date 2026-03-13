import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, tap, timeout } from 'rxjs';
import { environment } from '../../environments/environment';
import type {
  Document,
  DocumentListItem,
  DocumentListItemWithClauses,
} from '../models/document.model';
import type { Sentence } from '../models/sentence.model';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiUrl;

  uploadDocument(file: File): Observable<Document> {
    const form = new FormData();
    form.append('file', file);
    const url = `${this.base}/documents/upload`;
    console.log('Uploading to:', url, 'File:', file.name, file.size);
    return this.http.post<Document>(url, form).pipe(
      timeout(30000), // 30 second timeout
      tap({
        next: (response) => console.log('API response:', response),
        error: (err) => console.error('API error:', err),
      })
    );
  }

  getDocuments(search?: string): Observable<DocumentListItem[]> {
    let params = new HttpParams();
    if (search?.trim()) params = params.set('search', search.trim());
    return this.http.get<DocumentListItem[]>(`${this.base}/documents`, {
      params,
    });
  }

  getDocumentsWithClauses(filters: {
    search?: string;
    date_from?: string | null;
    date_to?: string | null;
  }): Observable<DocumentListItemWithClauses[]> {
    let params = new HttpParams();
    if (filters.search?.trim())
      params = params.set('search', filters.search.trim());
    if (filters.date_from)
      params = params.set('date_from', filters.date_from);
    if (filters.date_to) params = params.set('date_to', filters.date_to);
    return this.http.get<DocumentListItemWithClauses[]>(
      `${this.base}/documents`,
      { params }
    );
  }

  getDocument(id: number): Observable<Document> {
    return this.http.get<Document>(`${this.base}/documents/${id}`);
  }

  getSentences(documentId: number): Observable<Sentence[]> {
    return this.http.get<Sentence[]>(`${this.base}/documents/${documentId}/sentences`);
  }

  labelSentence(
    documentId: number,
    sentenceId: number,
    clauseType: string | null
  ): Observable<Sentence> {
    return this.http.post<Sentence>(
      `${this.base}/documents/${documentId}/sentences/${sentenceId}/label`,
      { clause_type: clauseType }
    );
  }

  // Clause Types API
  getClauseTypes(): Observable<any[]> {
    return this.http.get<any[]>(`${this.base}/clause-types`);
  }

  createClauseType(data: { name: string }): Observable<any> {
    return this.http.post<any>(`${this.base}/clause-types`, data);
  }

  updateClauseType(id: number, data: { name: string }): Observable<any> {
    return this.http.put<any>(`${this.base}/clause-types/${id}`, data);
  }

  deleteClauseType(id: number): Observable<any> {
    return this.http.delete<any>(`${this.base}/clause-types/${id}`);
  }
}
