# Node Simulator Reference

## Overview

This document describes how each n8n node type is simulated during testing. The simulator does not execute real code or make real API calls — it uses heuristic models and mock data to approximate behavior.

---

## Simulation Strategy by Node Category

### Trigger Nodes
All trigger nodes generate initial data to start the workflow simulation.

| Node Type | Simulation Behavior |
|-----------|-------------------|
| `manualTrigger` | Uses provided input_data or generates `{"triggered": true}` |
| `scheduleTrigger` | Uses provided input_data or generates `{"triggered": true, "timestamp": "simulated"}` |
| `webhook` | Uses provided payload from test setup |
| `emailTrigger` | Uses provided input_data or generates mock email data |
| `formTrigger` | Uses provided form submission data |
| `chatTrigger` | Uses provided chat message data |
| `errorTrigger` | Generates error context data |

### Logic Nodes

| Node Type | Simulation Behavior |
|-----------|-------------------|
| `if` | Passes input through (branch selection handled by DAG traversal) |
| `switch` | Passes input through (route selection handled by DAG traversal) |
| `merge` | Combines all predecessor outputs into a single array |
| `splitInBatches` | Passes input through (batch logic not simulated) |
| `noOp` | Direct passthrough |
| `stopAndError` | Marks as terminal node |

### Transform Nodes

| Node Type | Simulation Behavior |
|-----------|-------------------|
| `set` | Applies field assignments; resolves `{{ }}` expressions |
| `code` | Analyzes code statically (CodeAnalyzer); passes input through |
| `function` | Same as code node |
| `dateTime` | Generates current date/time mock |
| `html`/`xml`/`json`/`csv` | Passthrough with parsing indication |

### Database Nodes

| Node Type | Read Simulation | Write Simulation |
|-----------|----------------|-----------------|
| `postgres` | Returns seed data or mock rows | Updates db_state in simulation |
| `mysql` | Returns seed data or mock rows | Updates db_state in simulation |
| `mongoDb` | Returns seed data or mock documents | Updates db_state in simulation |
| `redis` | Returns seed data or mock values | Updates db_state in simulation |
| `googleSheets` | Returns seed data or mock rows | Updates db_state in simulation |
| `supabase` | Returns seed data or mock rows | Updates db_state in simulation |
| `airtable` | Returns seed data or mock records | Updates db_state in simulation |
| `notion` | Returns seed data or mock pages | Updates db_state in simulation |

### Communication Nodes

| Node Type | Mock Response |
|-----------|--------------|
| `httpRequest` | `{"statusCode": 200, "method": "GET/POST", "url_resolved": true}` |
| `slack` | `{"ok": true, "ts": "MOCK_TIMESTAMP"}` |
| `telegram` | `{"ok": true, "result": {"message_id": 1}}` |
| `emailSend` | `{"success": true}` |
| `discord` | `{"ok": true}` |

### AI / LangChain Nodes

| Node Type | Simulation Behavior |
|-----------|-------------------|
| `agent` | Passthrough with mock AI response indicator |
| `chainLlm` | Passthrough |
| `chatModel` | Passthrough |
| `embeddings` | Generates mock embedding vector |
| `vectorStore` | Returns mock search results |
| `memory` | Passthrough |
| `tool` | Passthrough |

---

## Expression Resolution

The simulator resolves n8n expressions in Set node assignments:

| Expression Pattern | Resolution |
|-------------------|-----------|
| `{{ $json.field }}` | Looks up `field` in current item's JSON data |
| `{{ $node["Name"].json.field }}` | Looks up `field` in named node's output |
| `{{ $now.toISO() }}` | Returns current timestamp placeholder |
| `{{ $env.VAR }}` | Returns environment variable placeholder |
| `{{ $json.field ?? 'default' }}` | Returns field value or 'default' |
| `{{ $json.active ? 'Yes' : 'No' }}` | Returns ternary result |

Unresolvable expressions are kept as-is with the `{{ }}` markers.

---

## Limitations

1. **Code nodes are analyzed, not executed**: The simulator performs static analysis on JavaScript code but does not run it. This means actual runtime behavior may differ from simulation predictions.

2. **External API calls are mocked**: No real HTTP requests, database queries, or API calls are made. Mock responses are returned instead.

3. **Conditional branching is simplified**: IF and Switch nodes don't evaluate actual conditions — all branches are explored during simulation.

4. **Loop/iteration nodes are approximated**: `splitInBatches` and similar looping nodes pass data through without actual batching.

5. **Timing/wait nodes are skipped**: `wait` nodes pass data through immediately.

6. **Sub-workflow calls are not executed**: `executeWorkflow` nodes generate a placeholder output.
