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
          category:
            | "schede"
            | "cabinet"
            | "cambiamonete"
            | "accessori"
            | "monitor";
          nome: string;
          quantita: number;
          prezzo_unitario: number;
          note: string;
          fornitore: string | null;
          sede: "Magazzino Principale" | "Limena" | "Magazzino Angelo";
          tipo: string | null;
          modello: string | null;
          marca: string | null;
          scaffale: number | null;
          ripiano: number | null;
          bancale: string | null;
          grado: string | null;
          bancale_verificato: boolean;
          bancale_verificato_at: string | null;
          bancale_verificato_da:
            | "Giangrossi"
            | "Irene"
            | "Matteo"
            | "Paolo"
            | null;
          bancale_stato_operativo: string | null;
          bancale_stato_operativo_note: string | null;
          bancale_stato_operativo_at: string | null;
          bancale_stato_operativo_da:
            | "Giangrossi"
            | "Irene"
            | "Matteo"
            | "Paolo"
            | null;
          created_at: string;
          updated_at: string;
          last_modified_by: "Giangrossi" | "Irene" | "Matteo" | "Paolo" | null;
          scheda_doc_inviata_at: string | null;
          nullaosta_ricevuto_at: string | null;
          nullaosta_prezzo_incrementato: boolean;
          nullaosta_segretaria_ok: boolean;
        };
        Insert: {
          id: string;
          category:
            | "schede"
            | "cabinet"
            | "cambiamonete"
            | "accessori"
            | "monitor";
          nome: string;
          quantita?: number;
          prezzo_unitario?: number;
          note?: string;
          fornitore?: string | null;
          sede?: "Magazzino Principale" | "Limena" | "Magazzino Angelo";
          tipo?: string | null;
          modello?: string | null;
          marca?: string | null;
          scaffale?: number | null;
          ripiano?: number | null;
          bancale?: string | null;
          grado?: string | null;
          bancale_verificato?: boolean;
          bancale_verificato_at?: string | null;
          bancale_verificato_da?:
            | "Giangrossi"
            | "Irene"
            | "Matteo"
            | "Paolo"
            | null;
          bancale_stato_operativo?: string | null;
          bancale_stato_operativo_note?: string | null;
          bancale_stato_operativo_at?: string | null;
          bancale_stato_operativo_da?:
            | "Giangrossi"
            | "Irene"
            | "Matteo"
            | "Paolo"
            | null;
          created_at?: string;
          updated_at?: string;
          last_modified_by?: "Giangrossi" | "Irene" | "Matteo" | "Paolo" | null;
          scheda_doc_inviata_at?: string | null;
          nullaosta_ricevuto_at?: string | null;
          nullaosta_prezzo_incrementato?: boolean;
          nullaosta_segretaria_ok?: boolean;
        };
        Update: {
          id?: string;
          category?:
            | "schede"
            | "cabinet"
            | "cambiamonete"
            | "accessori"
            | "monitor";
          nome?: string;
          quantita?: number;
          prezzo_unitario?: number;
          note?: string;
          fornitore?: string | null;
          sede?: "Magazzino Principale" | "Limena" | "Magazzino Angelo";
          tipo?: string | null;
          modello?: string | null;
          marca?: string | null;
          scaffale?: number | null;
          ripiano?: number | null;
          bancale?: string | null;
          grado?: string | null;
          bancale_verificato?: boolean;
          bancale_verificato_at?: string | null;
          bancale_verificato_da?:
            | "Giangrossi"
            | "Irene"
            | "Matteo"
            | "Paolo"
            | null;
          bancale_stato_operativo?: string | null;
          bancale_stato_operativo_note?: string | null;
          bancale_stato_operativo_at?: string | null;
          bancale_stato_operativo_da?:
            | "Giangrossi"
            | "Irene"
            | "Matteo"
            | "Paolo"
            | null;
          created_at?: string;
          updated_at?: string;
          last_modified_by?: "Giangrossi" | "Irene" | "Matteo" | "Paolo" | null;
          scheda_doc_inviata_at?: string | null;
          nullaosta_ricevuto_at?: string | null;
          nullaosta_prezzo_incrementato?: boolean;
          nullaosta_segretaria_ok?: boolean;
        };
        Relationships: [];
      };
      inventory_activity: {
        Row: {
          id: string;
          item_id: string;
          operatore: "Giangrossi" | "Irene" | "Matteo" | "Paolo";
          action: string;
          quantity_before: number | null;
          quantity_after: number | null;
          summary: string;
          note: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          item_id: string;
          operatore: "Giangrossi" | "Irene" | "Matteo" | "Paolo";
          action: string;
          quantity_before?: number | null;
          quantity_after?: number | null;
          summary?: string;
          note?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          item_id?: string;
          operatore?: "Giangrossi" | "Irene" | "Matteo" | "Paolo";
          action?: string;
          quantity_before?: number | null;
          quantity_after?: number | null;
          summary?: string;
          note?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      schede_prenotazioni: {
        Row: {
          id: string;
          numero_scheda: string;
          cliente: string;
          operatore: "Giangrossi" | "Irene" | "Matteo" | "Paolo" | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          numero_scheda: string;
          cliente: string;
          operatore?: "Giangrossi" | "Irene" | "Matteo" | "Paolo" | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          numero_scheda?: string;
          cliente?: string;
          operatore?: "Giangrossi" | "Irene" | "Matteo" | "Paolo" | null;
          created_at?: string;
        };
        Relationships: [];
      };
      repairs: {
        Row: Record<string, unknown>;
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      documents: {
        Row: Record<string, unknown>;
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      support_tickets: {
        Row: Record<string, unknown>;
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
};

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];
