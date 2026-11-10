# NOVA Native: expanding beyond 17 task labels

The `17` displayed by NOVA Native describes the **output categories of its trained neural intent classifier**. It is **not a message/request limit**, not the number of possible phrases the model can process, and not a measure of general intelligence.

## Message volume

NOVA Native and NOVA Tiny run locally and are no longer blocked by the app's optional personal daily goal. The UI still tracks requests and lets you adjust your *personal goal* up to 1,000,000/day or 7,000,000/week. Those numbers are **display and usage-goal settings, not verified throughput benchmarks**. Device performance, local storage capacity and browser limits still apply. NOVA Pro and other hosted models retain provider-side quotas and rate limits; changing the UI cannot remove those limits.

## 14 additional working project templates

The original nine templates remain available. A separate modular skill registry in [`nova-skills.js`](nova-skills.js) now supports:

1. Habit tracker
2. Expense and budget planner
3. Kanban project board
4. Study flashcards
5. Touch-friendly drawing pad, PNG export
6. Color palette generator
7. Random-choice picker
8. Dated calendar/agenda
9. Invoice draft
10. Survey/form creator
11. Distance, mass and temperature converter
12. Recipe organizer
13. Bookmark collection, JSON export
14. Typing practice

Each template returns editable `index.html`, `styles.css` and `script.js` files, available for in-app sandbox preview and ZIP export. These are **local deterministic tools**, not proof that the neural model trained on 14 new categories. Some are starting points with in-memory state that resets when the preview is reloaded.

Examples: `Build a Kanban project board`, `Make a drawing pad`, `Create a budget planner`, `Make me some flashcards`, and `Design a survey form`.

The original neural weights still represent **17 intent categories**, but the tool registry can scale independently. This avoids claiming that one billion training prompts were processed or that the local model understands every conceivable request.

## What millions of different instructions would require

- Large, diverse, legally usable datasets and much stronger architecture than a 50k-parameter intent model
- An evaluation dataset representative of natural, messy instructions, including typos and slang
- Data quality and safety audits, context management, and compute capacity
- A robust tool builder capable of planning and verifying new tasks rather than choosing from predefined templates
- Performance testing under realistic device/storage/network conditions

The current project has not completed training on millions of independent instructions. The separate experimental generative language model is [documented here](training/EXPERIMENT_REPORT_2026-11-10.md).

## Testing

`node tests/nova_skills.cjs` verifies that all 14 supported creation prompts return the expected editable files, checks their JavaScript syntax, confirms the skills work even when slang assistance is disabled, and checks the local request-goal policy. GitHub Actions runs this automatically.
