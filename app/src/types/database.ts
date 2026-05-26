export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      inventory_items: {
        Row: {
          id: string;
          category: 'schede' | 'cabinet' | 'cambiamonete' | 'accessori' | 'monitor';
          nome: string;
          quantita: number;
          prezzo_unitario: number;
          note: string;
          sede: 'Magazzino Principale' | 'Limena' | 'Magazzino Angelo';
          tipo: string | null;
          modello: string | null;
          marca: string | null;
          scaffale: number | null;
          ripiano: number | null;
          bancale: string | null;
          grado: 'A' | 'B' | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          category: 'schede' | 'cabinet' | 'cambiamonete' | 'accessori' | 'monitor';
          nome: string;
          quantita?: number;
          prezzo_unitario?: number;
          note?: string;
          sede?: 'Magazzino Principale' | 'Limena' | 'Magazzino Angelo';
          tipo?: string | null;
          modello?: string | null;
          marca?: string | null;
          scaffale?: number | null;
          ripiano?: number | null;
          bancale?: string | null;
          grado?: 'A' | 'B' | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          category?: 'schede' | 'cabinet' | 'cambiamonete' | 'accessori' | 'monitor';
          nome?: string;
          quantita?: number;
          prezzo_unitario?: number;
          note?: string;
          sede?: 'Magazzino Principale' | 'Limena' | 'Magazzino Angelo';
          tipo?: string | null;
          modello?: string | null;
          marca?: string | null;
          scaffale?: number | null;
          ripiano?: number | null;
          bancale?: string | null;
          grado?: 'A' | 'B' | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      repairs: { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown>; Relationships: [] };
      documents: { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown>; Relationships: [] };
      support_tickets: { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown>; Relationships: [] };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
};

export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row'];
