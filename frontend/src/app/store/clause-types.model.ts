export interface ClauseType {
  id: number;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface ClauseTypesState {
  items: ClauseType[];
  loading: boolean;
  error: string | null;
  success: string | null;
}

export const initialClauseTypesState: ClauseTypesState = {
  items: [],
  loading: false,
  error: null,
  success: null,
};
