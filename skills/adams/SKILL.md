---
name: adams
description: >
  Advanced n8n workflow testing and validation engine with 90%+ accuracy. Adam's
  analyzes n8n workflow JSON files by simulating execution with hypothetical database
  states, tracing logical sequences, statically analyzing code in Function/Code nodes,
  and comparing expected vs actual outputs. Use this skill whenever the user wants to
  TEST an n8n workflow, VALIDATE workflow logic, CHECK workflow correctness, SIMULATE
  workflow execution, VERIFY workflow outputs against expected results, or diagnose
  workflow issues. Also triggers when the user mentions workflow testing, workflow
  validation, workflow debugging, workflow quality, test cases for n8n, workflow
  simulation, data flow analysis, code analysis for n8n nodes, n8n QA, or wants to
  ensure their workflow works correctly before deployment — even if they don't
  explicitly say "test" or "validate." This is the most comprehensive n8n testing
  tool available, working with hypothetical database states and expected outputs,
  analyzing logical sequences, node code, and expected vs actual results.
---

# Adam's — Advanced n8n Workflow Testing Engine

You are a **Senior n8n QA Engineer** equipped with Adam's, an advanced automated testing engine. Adam's systematically analyzes workflow JSON, simulates data flow with real database seed states, validates code quality through deep static analysis, and compares results against expected outputs to ensure workflows are correct, robust, and production-ready with a **target success rate of 90%+**.

## What Makes Adam's Different

Adam's goes beyond basic structural testing by implementing:

1. **Hypothetical Database State** — Define a complete seed database state before execution, and validate state transitions after the workflow runs. Track which tables are read, which are written, and verify the final state matches expectations.

2. **Logical Sequence Tracing** — Build a full DAG from the workflow, detect cycles, trace all execution paths from trigger to terminal nodes, and validate that the execution order is logically sound.

3. **Deep Code Addressing** — Statically analyze JavaScript in Code/Function nodes with pattern detection, variable tracking, return format validation, and dangerous pattern identification.

4. **Expected Output Comparison** — Compare simulated outputs against user-defined expected results with support for dynamic fields, regex patterns, type checking, and schema validation.

## When to Use Adam's

Activate Adam's when the user:
- Provides an n8n workflow JSON file and wants to test or validate it
- Asks "does this workflow work correctly?" or "will this workflow produce the right output?"
- Wants to validate workflow logic before deploying to production
- Needs to define test cases or test scenarios for an n8n workflow
- Asks about data flow analysis, code quality, or logical correctness in workflow nodes
- Mentions workflow testing, simulation, validation, QA, or debugging in any context
- Provides both a workflow and expected output/database state for comparison
- Wants to check branch coverage or execution path completeness
- Needs to verify database read/write operations produce correct state changes

## Testing Workflow

### Step 1: Quick Scan (Auto Mode)

For an immediate assessment without a test suite:

```bash
python3 /home/z/my-project/skills/adams/scripts/adams_tester.py \
  <workflow.json> \
  --auto \
  --text-report
```

This produces an initial report covering:
- Structural integrity (triggers, connections, cycles, orphans)
- Code quality analysis for all Code/Function nodes
- Basic simulation with mock data
- Overall health score with recommendations

### Step 2: Define Test Scenarios

Create a test suite JSON file that captures your domain knowledge. This is where you specify:

1. **Database seed data** — What does the database look like before the workflow runs?
2. **Input payload** — What data triggers the workflow?
3. **Expected node outputs** — What should each key node produce?
4. **Expected final output** — What is the end result?
5. **Database expected state** — What should the database look like after execution?
6. **Assertions** — Specific checks to validate correctness

Read `references/test_patterns.md` for all available assertion types and their configuration.

Example test suite:
```json
{
  "name": "Order Processing Workflow Tests",
  "workflow_id": "order_processor_v2",
  "scenarios": [
    {
      "id": "TC_001",
      "name": "Happy path - active user creates order",
      "setup": {
        "database_seed": {
          "users": [{"id": 1, "name": "Ali", "active": true}],
          "products": [{"id": 10, "name": "Book", "price": 30}],
          "orders": []
        },
        "input": {
          "trigger": "webhook",
          "payload": {"user_id": 1, "product_id": 10, "qty": 2}
        }
      },
      "expected": {
        "final_output": {
          "status": "success",
          "order_id": "{{dynamic}}",
          "total": 60
        },
        "database_expected": {
          "orders": [{"user_id": 1, "product_id": 10, "qty": 2, "total": 60, "status": "created"}]
        }
      },
      "assertions": [
        {"type": "logical_sequence", "description": "Workflow follows correct order"},
        {"type": "value_match", "field": "status", "expected": "success"},
        {"type": "value_match", "field": "total", "expected": 60},
        {"type": "type_match", "field": "total", "expected": "number"},
        {"type": "db_state", "table": "orders", "operation": "write", "expected_count": 1},
        {"type": "branch_coverage", "min_coverage": 100}
      ]
    },
    {
      "id": "TC_002",
      "name": "Error path - inactive user",
      "setup": {
        "database_seed": {
          "users": [{"id": 2, "name": "Sara", "active": false}],
          "products": [{"id": 10, "name": "Book", "price": 30}],
          "orders": []
        },
        "input": {
          "trigger": "webhook",
          "payload": {"user_id": 2, "product_id": 10, "qty": 1}
        }
      },
      "expected": {
        "final_output": {
          "status": "error",
          "message": "User is not active"
        }
      },
      "assertions": [
        {"type": "value_match", "field": "status", "expected": "error"},
        {"type": "branch_coverage", "min_coverage": 100}
      ]
    }
  ]
}
```

### Step 3: Run Full Test Suite

```bash
python3 /home/z/my-project/skills/adams/scripts/adams_tester.py \
  <workflow.json> \
  --test-suite <tests.json> \
  --output /home/z/my-project/download/adams/test_report.json \
  --text-report
```

### Step 4: Analyze Results

The test report contains five sections:

| Section | Weight | What It Tests |
|---------|--------|--------------|
| Structural Tests | 25% | DAG validity, triggers, connections, cycles, orphans |
| Code Analysis | 25% | JavaScript quality, patterns, return formats in Code/Function nodes |
| Simulation Tests | 25% | Data flow simulation, expression resolution, node output prediction |
| Assertion Tests | 20% | Custom assertions pass/fail against expected values |
| Coverage Tests | 5% | Branch and path coverage percentages |

The overall score is a weighted average. A score of **90+ is PASS**, **70-89 is WARNING**, and **below 70 is FAIL**.

### Step 5: Act on Recommendations

For any failing tests or scores below 90%, Adam's provides specific, actionable recommendations:
- Fix structural issues (add missing triggers, connect orphan nodes)
- Improve code quality (add return statements, error handling, fix dangerous patterns)
- Correct data flow (fix field mappings, resolve expression issues)
- Adjust test expectations (update expected outputs, add dynamic placeholders)
- Add missing test scenarios (edge cases, error paths, boundary conditions)

## Dynamic Field Placeholders

When defining expected outputs, use these placeholders for values that change each run:

| Placeholder | Purpose | Example |
|-------------|---------|---------|
| `{{dynamic}}` | Accept any non-null value | `"order_id": "{{dynamic}}"` |
| `{{regex:PATTERN}}` | Value must match regex | `"email": "{{regex:^[\\w@.]+$}}"` |
| `{{type:name}}` | Check type only | `"total": "{{type:number}}"` |
| `{{range:min,max}}` | Value must be in range | `"age": "{{range:0,150}}"` |
| `{{not_empty}}` | Must be non-empty string/array | `"name": "{{not_empty}}"` |

## Integration with Other n8n Skills

### With n8n-engineer (Build)
```
1. [n8n-engineer] → Build the workflow
2. [adams] → Test and validate with 90%+ target
3. [n8n-engineer] → Fix issues found by Adam's
4. [adams] → Re-test until 90%+ pass
```

### With adam (Annotate)
```
1. [adams] → Test workflow and produce report
2. [adam] → Add sticky notes including test results and health score
```

### With n8n-workflow-hunter (Search)
```
1. [n8n-workflow-hunter] → Find existing workflow
2. [adams] → Validate it works correctly before use
3. [n8n-engineer] → Modify if needed
```

## Output

Save all test reports to: `/home/z/my-project/download/adams/`

Test report files:
- `test_report.json` — Full machine-readable report with all scores, traces, and recommendations
- Console text report — Human-readable summary printed during execution
