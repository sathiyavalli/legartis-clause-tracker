export interface DocumentListItem {
  id: number;
  filename: string;
  uploaded_at: string;
}

/** List item with clause types (from backend list endpoint). */
export interface DocumentListItemWithClauses extends DocumentListItem {
  clause_types: string[];
}

export interface Document extends DocumentListItem {
  content: string;
}
