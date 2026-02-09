# AI Judge — Rubric-Driven LLM Evaluation System

AI Judge is a lightweight, end-to-end system for evaluating submissions using **rubric-based AI judges**.  
It enables human-defined grading rubrics, scalable evaluation runs, and transparent inspection of results, while keeping humans firmly in the loop.

This project is implemented as a **production-quality MVP**, prioritizing clarity, correctness, and extensibility over unnecessary abstraction.

---

## Features

### Data Import
- Import queues, submissions, question templates, and answers from a single JSON file
- Idempotent ingestion with clean separation of entities

### Rubric-Driven Judges
- Create judges with custom system prompts (grading rubrics)
- Enable or disable judges at any time
- Model selection per judge (LLM-agnostic design)

### Queue-Based Assignment
- Assign any number of active judges to each question template
- Save and replace assignments atomically

### Evaluation Runs
- Run all assigned judges across all submissions in a queue
- Sequential execution for reliability and observability
- Live progress tracking during evaluation

### LLM Integration
- Gemini integration via Google AI Studio
- Strict JSON-only output enforcement
- Safe parsing with graceful fallback to “inconclusive”

### Results & Analytics
- Filter results by queue, judge, template, and verdict
- Pass / fail / inconclusive verdicts with explanations
- Aggregate statistics including pass rate

### UI
- Clean, minimal, industry-style interface
- Consistent layout across all pages
- Designed to feel like an internal production tool, not a demo

---

## Design Philosophy

### Humans in the Loop
Judges are defined by humans using explicit rubrics.  
The LLM acts as an execution engine, not an autonomous decision maker.

### Explicit Over Implicit
- Explicit judge assignments
- Explicit evaluation runs
- Explicit, inspectable results  
Nothing happens automatically or invisibly.

### Safety & Robustness
- JSON-only model outputs
- Defensive parsing
- Inconclusive verdicts when models fail or misbehave

### Extensibility First
The system is designed to support:
- Multiple LLM providers
- Multiple judge types
- Future ensemble or voting strategies

---

## Architecture Overview

### Frontend
- React + TypeScript
- Pages:
  - Import
  - Judges
  - Queues
  - Queue Detail
  - Results
- Stateless API calls with clear data boundaries

### Backend
- Supabase (Postgres + Edge Functions)

#### Core Tables
- `queues`
- `submissions`
- `question_templates`
- `answers`
- `judges`
- `judge_assignments`
- `evaluations`

#### Edge Function: `evaluate`
- Accepts `{ submissionId, templateId, judgeId }`
- Loads rubric, question, and answer
- Calls the LLM
- Parses structured JSON output
- Upserts evaluation results

---

## Evaluation Flow

1. Import JSON → queues, submissions, templates, answers
2. Create judges with grading rubrics
3. Assign judges to templates within a queue
4. Run AI judges
5. For each `(submission × template × judge)`:
   - Construct prompt
   - Call LLM
   - Parse verdict
   - Store evaluation
6. Inspect results and statistics

---

## JSON Import Format

The importer expects an array of submissions in the following format:

```json
[
  {
    "id": "sub_1",
    "queueId": "queue_1",
    "labelingTaskId": "task_1",
    "createdAt": 1690000000000,
    "questions": [
      {
        "rev": 1,
        "data": {
          "id": "q_template_1",
          "questionType": "single_choice_with_reasoning",
          "questionText": "Is the sky blue?"
        }
      }
    ],
    "answers": {
      "q_template_1": {
        "choice": "yes",
        "reasoning": "Observed on a clear day."
      }
    }
  }
]

---

## Local Setup

### Prerequisites
- Node.js (18+ recommended)
- npm
- Supabase CLI

### Install Dependencies
```bash
npm install
npm run dev

---

### ️Add **Supabase Setup**  
Immediately after **Local Setup**

```md
## Supabase Setup

1. Create a new Supabase project
2. Create tables using the provided schema
3. Disable Row Level Security (RLS) for development

### Edge Function Environment Variables

Set the following variables in your Supabase project:

| Key            | Value                         |
|----------------|-------------------------------|
| GEMINI_API_KEY | Google AI Studio API key      |
| MODE           | gemini                        |

### Deploy Edge Function
```bash
supabase functions deploy evaluate

---

### Add **How to Test the System**  
Place **after `## JSON Import Format`**

This complements the flow section without duplicating it.

```md
---

## How to Test the System

1. Go to **Import**
   - Upload the sample JSON file
   - Verify queues and submissions are created

2. Go to **Judges**
   - Create a judge with a rubric
   - Ensure the judge is active

3. Go to **Queues**
   - Open a queue
   - Assign judges to templates
   - Save assignments

4. Click **Run AI Judges**
   - Monitor progress
   - Wait for completion

5. Go to **Results**
   - Filter by queue, judge, or verdict
   - Inspect verdicts and reasoning

---

## Error Handling

- Missing assignments → no evaluation tasks generated
- LLM API failure → verdict marked as *inconclusive*
- Malformed model output → safe JSON extraction with fallback
- Duplicate evaluation runs → upsert logic prevents duplication

---

## Future Improvements

- Parallel evaluation execution
- Judge ensembles and voting strategies
- Confidence scoring
- Evaluation cost tracking
- Versioned rubrics
- Result export (CSV)
- Authentication and role-based access

