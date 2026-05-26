# Piano di Sviluppo — Piattaforma Spazio Games

## Obiettivo
Creare una piattaforma web enterprise "wow" per Spazio Games con 4 sezioni principali:
1. **Inventario** — gestione magazzino completa (Schede, Cabinet, Cambiamonete, Accessori, Monitor)
2. **Riparazioni** — tracking riparazioni dispositivi
3. **Modulistica** — gestione documenti e moduli
4. **Supporto Tecnico** — ticket e assistenza

## Architettura
- **Frontend**: React + TypeScript + Tailwind CSS + shadcn/ui
- **Backend/DB**: Supabase (PostgreSQL + Auth + Realtime)
- **Stile**: Dark theme professionale, low-saturation palette, enterprise-grade UI

## Fasi di Sviluppo

### Stage 1 — Setup & Database (vibecoding-webapp-swarm)
- Inizializzare progetto React con template
- Configurare Supabase client
- Creare schema database: tabelle inventory_items, cabinets, changers, accessories, monitors, repairs, documents, support_tickets
- Seed data iniziale dall'Excel fornito

### Stage 2 — Inventario Module
- Dashboard inventario con KPI (valore totale, quantità per categoria)
- Tabella Schede di gioco: CRUD completo, filtri per nome/quantità/prezzo/note
- Tabella Cabinet: CRUD completo, filtri
- Tabella Cambiamonete: CRUD completo, filtri
- Tabella Accessori: CRUD completo, filtri
- Tabella Monitor: CRUD con scaffalatura, ripiano, bancale, grado — filtri avanzati
- Ricerca globale e filtri combinati
- Esportazione dati

### Stage 3 — Riparazioni Module
- Lista riparazioni con stato (In attesa, In corso, Completata, Archiviata)
- CRUD riparazioni (dispositivo, problema, stato, tecnico assegnato, date, note)
- Filtri per stato, tecnico, data, dispositivo
- Timeline/visualizzazione progresso

### Stage 4 — Modulistica Module
- Gestione documenti/moduli
- CRUD documenti (titolo, categoria, file, data, note)
- Filtri per categoria, data
- Upload/download documenti

### Stage 5 — Supporto Tecnico Module
- Ticket system (apertura, assegnazione, chiusura)
- CRUD ticket (titolo, descrizione, priorità, stato, assegnatario, date)
- Filtri per stato, priorità, assegnatario
- Commenti su ticket

### Stage 6 — Polish & Deploy
- Final UI/UX touches
- Responsive check
- Deploy

## Skill
- `vibecoding-webapp-swarm` — per tutto lo sviluppo webapp
