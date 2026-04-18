import type { Example } from '../types'

export const EXAMPLES: Example[] = [
  {
    content: `# Git Feature Branch Workflow

A simple guide to working with feature branches.

## The Process

Every change starts with a new branch off \`main\`. Here's the full cycle:

\`\`\`mermaid
flowchart TD
    A([Start]) --> B[Create feature branch]
    B --> C[Write code]
    C --> D{Tests pass?}
    D -- No --> C
    D -- Yes --> E[Open Pull Request]
    E --> F{Code review}
    F -- Changes requested --> C
    F -- Approved --> G[Merge to main]
    G --> H([Deploy])
\`\`\`

## Key Rules

- **Never** commit directly to \`main\`
- Keep branches short-lived — merge within 1–2 days
- Write descriptive commit messages

> A branch is a hypothesis. Merge it when it's proven.
`,
    desc: 'A git feature branch workflow rendered as a Mermaid flowchart.',
    id: 'flowchart-diagram',
    title: 'Flowchart diagram',
  },
  {
    content: `# JWT Authentication Flow

How a client authenticates and accesses a protected resource.

\`\`\`mermaid
sequenceDiagram
    participant C as Client
    participant A as Auth Server
    participant R as Resource API

    C->>A: POST /login {email, password}
    A-->>A: Validate credentials
    A-->>C: 200 OK {access_token, refresh_token}

    C->>R: GET /data (Bearer token)
    R-->>R: Verify JWT signature
    R-->>C: 200 OK {data}

    Note over C,R: Token expires after 15 minutes

    C->>A: POST /refresh {refresh_token}
    A-->>C: 200 OK {new_access_token}
\`\`\`

## Token Lifetimes

| Token | Lifetime | Storage |
|-------|----------|---------|
| Access token | 15 minutes | Memory |
| Refresh token | 7 days | HttpOnly cookie |

Never store tokens in \`localStorage\` — use **HttpOnly cookies** for refresh tokens.
`,
    desc: 'HTTP authentication flow with JWT tokens.',
    id: 'sequence-diagram',
    title: 'Sequence diagram',
  },
  {
    content: `# Blog Platform — Database Schema

The core entities and their relationships.

\`\`\`mermaid
erDiagram
    USER {
        int id PK
        string email
        string name
        datetime created_at
    }
    POST {
        int id PK
        string title
        text body
        bool published
        datetime created_at
        int author_id FK
    }
    COMMENT {
        int id PK
        text body
        datetime created_at
        int post_id FK
        int author_id FK
    }
    TAG {
        int id PK
        string name
        string slug
    }
    POST_TAG {
        int post_id FK
        int tag_id FK
    }

    USER ||--o{ POST : "writes"
    USER ||--o{ COMMENT : "leaves"
    POST ||--o{ COMMENT : "receives"
    POST ||--o{ POST_TAG : "tagged with"
    TAG  ||--o{ POST_TAG : "applied to"
\`\`\`

Posts and comments share the same \`author_id\` FK pointing to \`USER.id\`.
`,
    desc: 'A blog platform database schema as an ER diagram.',
    id: 'entity-relationship-diagram',
    title: 'Entity relationship diagram',
  },
  {
    content: `# Product Launch — Q3 Timeline

Sprint plan from design to release.

\`\`\`mermaid
gantt
    title Product Launch Timeline
    dateFormat  YYYY-MM-DD
    section Design
    UX Research         :done,    d1, 2024-07-01, 7d
    Wireframes          :done,    d2, after d1, 5d
    Visual Design       :active,  d3, after d2, 8d
    section Development
    API Integration     :         dev1, 2024-07-15, 10d
    Frontend            :         dev2, after dev1, 8d
    QA & Testing        :         dev3, after dev2, 5d
    section Launch
    Beta Release        :milestone, m1, after dev3, 0d
    Public Launch       :milestone, m2, 2024-08-30, 0d
\`\`\`

## Milestones

1. **Beta** — Invite-only with 200 testers
2. **Public Launch** — Full rollout with marketing campaign

> All dates subject to review after beta feedback.
`,
    desc: 'A product launch project timeline.',
    id: 'gantt-chart',
    title: 'Gantt chart',
  },
  {
    content: `# Markdown Studio

*A beautiful place to write and diagram.*

## Features

Markdown Studio supports the full CommonMark spec, plus **Mermaid diagrams** rendered inline.

### Diagram Support

\`\`\`mermaid
graph LR
    MD[Markdown] --> Parser
    Mermaid --> Renderer
    Parser --> Preview
    Renderer --> Preview
    Preview --> You((You))
\`\`\`

### Text Formatting

You can write **bold**, *italic*, \`inline code\`, and [links](https://example.com).

> Blockquotes give emphasis to important ideas.

### Lists

**Unordered:**
- Item one
- Item two
  - Nested item
  - Another nested item

**Ordered:**
1. First step
2. Second step
3. Third step

### Tables

| Syntax | Rendered |
|--------|----------|
| \`**bold**\` | **bold** |
| \`*italic*\` | *italic* |
| \`\`code\`\` | \`code\` |

### Code Blocks

\`\`\`javascript
function greet(name) {
  return \`Hello, \${name}!\`;
}

console.log(greet("world")); // Hello, world!
\`\`\`

---

*Happy writing.*
`,
    desc: 'A document exercising all markdown features — headings, code, tables, quotes, and a diagram.',
    id: 'full-kitchen-sink',
    title: 'Full kitchen-sink',
  },
]

export const DEFAULT_EXAMPLE_INDEX = 4
