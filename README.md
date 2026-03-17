# 🧠 AI-Powered Product Feedback Tracker

Aplikasi **Product Feedback Tracker** berbasis CRUD dengan lapisan AI Enrichment yang secara otomatis mengklasifikasikan sentimen, kategori, dan menghasilkan ringkasan tindakan dari setiap feedback pengguna.

## Tech Stack

| Layer     | Technology                        |
| --------- | --------------------------------- |
| Framework | Next.js 16 (App Router)           |
| Language  | TypeScript                        |
| AI / LLM  | Google Gemini API (`gemini-2.5-flash`) |
| Storage   | In-memory array (no database)     |
| Styling   | Vanilla CSS (8pt grid, Inter font)|

## Data Model

```typescript
interface FeedbackItem {
  id: string;             // UUID
  text: string;           // Raw feedback (user input)
  status: string;         // 'open' | 'in-progress' | 'resolved'
  sentiment: string;      // AI: 'positive' | 'negative' | 'neutral'
  category: string;       // AI: 'Bug' | 'Feature' | 'UX' | 'Performance' | 'Other'
  action_summary: string; // AI: one-sentence recommended action
}
```

## API Endpoints

| Endpoint              | Method   | Description                              |
| --------------------- | -------- | ---------------------------------------- |
| `/api/feedback`       | `POST`   | Submit feedback → AI enrichment → store  |
| `/api/feedback`       | `GET`    | Retrieve all feedback items              |
| `/api/feedback/[id]`  | `PATCH`  | Update status (`open`/`in-progress`/`resolved`) |
| `/api/feedback/[id]`  | `DELETE` | Delete a feedback item                   |

## Getting Started

### 1. Clone & Install

```bash
git clone https://github.com/mahfudzihanif3001/AI-Powered-Product-Feedback-Tracker.git
cd AI-Powered-Product-Feedback-Tracker
npm install
```

### 2. Setup Environment

Buat file `.env.local` di root project:

```env
GEMINI_API_KEY=your_gemini_api_key_here
```

> Dapatkan API key gratis di [Google AI Studio](https://aistudio.google.com/app/apikey).

### 3. Run

```bash
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000).

## Project Structure

```
src/
├── app/
│   ├── api/feedback/
│   │   ├── route.ts          # GET & POST handlers
│   │   └── [id]/route.ts     # PATCH & DELETE handlers
│   ├── globals.css           # Design system & styles
│   ├── layout.tsx            # Root layout (Inter font, metadata)
│   └── page.tsx              # Main UI (client component)
└── lib/
    ├── types.ts              # FeedbackItem & AIEnrichment types
    ├── store.ts              # In-memory CRUD storage
    └── ai.ts                 # Gemini API integration & prompt
```

## AI Enrichment Flow

1. User mengirim feedback via form → `POST /api/feedback`
2. Server mengirim teks ke **Gemini API** dengan system prompt ketat
3. Gemini mengembalikan JSON: `{ sentiment, category, action_summary }`
4. Server memvalidasi output, menyimpan ke in-memory array, dan mengembalikan objek lengkap
5. Frontend menampilkan badge sentiment, kategori, dan action summary

## Catatan

- **In-memory storage** — data akan hilang saat server restart (sesuai ketentuan project).
- **No external database** — tidak memerlukan setup database apapun.
- **LLM Agnostic** — dapat diganti ke provider lain (OpenAI, Groq, Ollama) dengan modifikasi minimal pada `src/lib/ai.ts`.
