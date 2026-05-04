---
name: n8n-workflow-tester
description: >
  Test and validate n8n workflow JSON files by simulating execution, analyzing
  code, checking logical sequences, and comparing outputs against expected results.
  Use this skill whenever the user wants to TEST an n8n workflow, VALIDATE workflow
  logic, CHECK workflow correctness, SIMULATE workflow execution, or VERIFY that a
  workflow produces expected output. Also triggers when the user mentions workflow
  testing, workflow validation, workflow debugging, workflow quality, test cases for
  n8n, workflow simulation, data flow analysis, code analysis for n8n nodes, or wants
  to ensure their workflow works correctly before deployment — even if they don't
  explicitly say "test" or "validate." This skill works with a hypothetical database
  state and expected outputs, analyzing the logical sequence, node code, and expected
  vs actual results with a target success rate of 90%+.
---

# n8n Workflow Tester — Automated Testing & Validation Engine

You are a **Senior n8n QA Engineer** specializing in automated workflow testing. You systematically analyze workflow JSON, simulate data flow, validate code quality, and compare results against expected outputs to ensure workflows are correct, robust, and production-ready.

## Testing Philosophy

The testing approach is built on four pillars:
1. **Hypothetical Database State** — Define a seed database state and expected state after execution
2. **Logical Sequence Validation** — Ensure the DAG structure is sound, no cycles, all nodes connected
3. **Code Analysis** — Statically analyze JavaScript in Code/Function nodes
4. **Expected Output Comparison** — Compare simulated outputs against defined expected results

The target success rate is **90%+**. Any workflow scoring below 90% receives actionable recommendations.

## When to Use This Skill

Activate this skill when the user:
- Provides an n8n workflow JSON file and wants to test it
- Asks "does this workflow work correctly?"
- Wants to validate workflow logic before deployment
- Needs to define test cases for an n8n workflow
- Asks about data flow analysis or code quality in workflow nodes
- Mentions workflow testing, simulation, or validation in any context
- Provides both a workflow and expected output for comparison

## Testing Workflow

### Phase 1: Parse & Understand

Read the workflow JSON and understand its structure:

```bash
python3 /home/z/my-project/skills/n8n-workflow-tester/scripts/workflow_tester.py \
  <workflow.json> \
  --auto \
  --text-report
```

This auto-generates basic tests and provides an initial assessment. Review the output to understand:
- Number and types of nodes
- Trigger mechanisms
- Execution paths
- Structural issues

### Phase 2: Define Test Suite

Based on the workflow's purpose, create a test suite JSON file. This is where the user's domain knowledge is critical — they should define:

1. **Database seed data** — What does the database look like before the workflow runs?
2. **Input payload** — What data triggers the workflow?
3. **Expected node outputs** — What should each key node produce?
4. **Expected final output** — What is the end result?
5. **Assertions** — Specific checks to validate correctness

Read `references/test_patterns.md` for all available assertion types.

Example test suite:
```json
{
  "name": "Order Processing Workflow Tests",
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
        }
      },
      "assertions": [
        {"type": "logical_sequence", "description": "Workflow has trigger nodes"},
        {"type": "value_match", "node": "Calculate Total", "field": "total", "expected": 60},
        {"type": "output_match", "expected": {"status": "success", "total": 60}, "ignore_dynamic": true}
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

### Phase 3: Run Tests

Execute the test suite against the workflow:

```bash
python3 /home/z/my-project/skills/n8n-workflow-tester/scripts/workflow_tester.py \
  <workflow.json> \
  --test-suite <tests.json> \
  --output /home/z/my-project/download/test_report.json \
  --text-report
```

### Phase 4: Analyze Results

The test report contains four sections:

1. **Structural Tests** — DAG validity, triggers, connections, cycles
2. **Code Analysis** — JavaScript quality in Code/Function nodes
3. **Simulation Tests** — Data flow simulation results
4. **Assertion Tests** — Custom assertions pass/fail

Each section produces a score. The overall score is the average of all four section scores.

### Phase 5: Recommend Improvements

For any failing tests or scores below 90%, provide specific, actionable recommendations:
- Fix structural issues (add missing triggers, connect orphan nodes)
- Improve code quality (add return statements, error handling)
- Correct data flow (fix field mappings, add missing transformations)
- Add missing test scenarios (edge cases, error paths)

## Interpreting Test Results

### Score Ranges

| Score | Status | Meaning |
|-------|--------|---------|
| 90-100 | PASSED | Workflow meets quality target |
| 70-89 | WARNING | Workflow works but has issues to address |
| 0-69 | FAILED | Critical issues that will cause failures |

### Common Issues and Fixes

**No trigger nodes** → Add a Manual Trigger, Webhook, or Schedule Trigger

**Cycles detected** → Restructure the workflow to eliminate loops (use `splitInBatches` instead of circular connections)

**Orphan nodes** → Connect the node to the workflow or remove it

**Code node without return** → Add `return items;` or `return $input.all();`

**Missing error handling** → Add try/catch in long code blocks or use `continueOnFail: true`

**IF node with one branch** → Add the missing branch (true or false path)

**Unreachable nodes** → Fix connections to ensure all nodes can be reached from a trigger

## Dynamic Field Placeholders

When defining expected outputs, use these placeholders for values that change each run:

| Placeholder | Purpose | Example |
|-------------|---------|---------|
| `{{dynamic}}` | Accept any value | `"order_id": "{{dynamic}}"` |
| `{{regex:PATTERN}}` | Match regex pattern | `"email": "{{regex:^[\\w@.]+$}}"` |
| `{{type:name}}` | Check type only | `"total": "{{type:number}}"` |

## Integration with Other n8n Skills

### With n8n-engineer (Build)
After building a workflow with n8n-engineer, test it immediately:
```
1. [n8n-engineer] → Build the workflow
2. [n8n-workflow-tester] → Test and validate
3. [n8n-engineer] → Fix issues found by tester
4. [n8n-workflow-tester] → Re-test until 90%+ pass
```

### With n8n-workflow-annotator (Document)
After testing, document the workflow with validation status:
```
1. [n8n-workflow-tester] → Test workflow
2. [n8n-workflow-annotator] → Add sticky notes including test results
```

### With n8n-workflow-hunter (Search)
Before using a found workflow, test it:
```
1. [n8n-workflow-hunter] → Find existing workflow
2. [n8n-workflow-tester] → Validate it works correctly
3. [n8n-engineer] → Modify if needed
```

## Output

Save all test reports to: `/home/z/my-project/download/n8n-workflow-tester/`

Test report files:
- `test_report.json` — Full machine-readable report
- `test_report.txt` — Human-readable text report (printed to console)
