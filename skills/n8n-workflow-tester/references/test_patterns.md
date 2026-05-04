# Test Pattern Reference

## Overview

This document describes the test patterns available for n8n workflow testing. Each pattern targets a specific aspect of workflow correctness.

---

## Pattern 1: Logical Sequence Test

**Purpose**: Validate the structural integrity and logical ordering of workflow nodes.

**What it checks**:
- Workflow has at least one trigger node
- No cycles exist in the execution graph
- All nodes are connected (no orphans)
- All node names are unique
- All connections reference existing nodes
- IF/Switch nodes have multiple branches

**When to use**: Always run this as the first test. It catches fundamental structural problems.

**Example test definition**:
```json
{
  "type": "logical_sequence",
  "description": "Workflow has no cycles",
  "order": ["Webhook", "Validate Input", "Process Data", "Send Response"]
}
```

---

## Pattern 2: Code Analysis Test

**Purpose**: Perform static analysis on JavaScript code inside Code/Function nodes.

**What it checks**:
- Syntax validity (balanced braces, parentheses, brackets)
- Presence of return statements (required for n8n Code nodes)
- Proper n8n data format in return values
- Usage of n8n-specific variables ($json, $input, etc.)
- Dangerous patterns (eval, fetch, require, etc.)
- Error handling (try/catch blocks)
- Potentially undefined variables

**When to use**: For any workflow containing Code, Function, or FunctionItem nodes.

**Quality scoring**:
- 100: Perfect code with error handling
- 80-99: Minor warnings (missing try/catch in short code)
- 50-79: Issues found (missing return, dangerous patterns)
- 0-49: Critical issues (syntax errors, no return statement)

---

## Pattern 3: Database State Test

**Purpose**: Validate that database read/write operations produce the expected state changes.

**What it checks**:
- Read operations return expected data from seed
- Write operations modify the database state correctly
- Field types match expected schema
- CRUD operations are correctly configured

**When to use**: When the workflow interacts with databases (Postgres, MySQL, MongoDB, etc.)

**Example test definition**:
```json
{
  "type": "db_state",
  "table": "users",
  "operation": "read",
  "expected": [{"id": 1, "name": "Ali", "active": true}]
}
```

**Database seed format**:
```json
{
  "database_seed": {
    "users": [
      {"id": 1, "name": "Ali", "active": true},
      {"id": 2, "name": "Sara", "active": false}
    ],
    "orders": [
      {"id": 101, "user_id": 1, "total": 60.00}
    ]
  }
}
```

---

## Pattern 4: End-to-End Output Test

**Purpose**: Compare the final output of the workflow against the expected output.

**What it checks**:
- Final output schema matches expected
- Output values match expected (with dynamic field support)
- Output types are correct
- Multiple terminal nodes all produce expected results

**When to use**: When you have a clear expected output for a given input.

**Dynamic field placeholders**:
- `{{dynamic}}` — Skip this field (accept any value)
- `{{regex:PATTERN}}` — Value must match regex pattern
- `{{type:typename}}` — Value must be of specified type

**Example test definition**:
```json
{
  "type": "output_match",
  "expected": {
    "status": "success",
    "order_id": "{{dynamic}}",
    "total": 60.00,
    "email": "{{regex:^[\\w.]+@[\\w.]+\\.com$}}"
  },
  "ignore_dynamic": true
}
```

---

## Pattern 5: Branch Coverage Test

**Purpose**: Ensure all branches of conditional nodes are reachable.

**What it checks**:
- All IF node branches (true/false) are connected
- All Switch node routes are connected
- All branches are reachable from at least one execution path
- Coverage percentage meets minimum threshold

**When to use**: When the workflow has IF, Switch, or other branching nodes.

**Example test definition**:
```json
{
  "type": "branch_coverage",
  "description": "All branches are reachable",
  "min_coverage": 100
}
```

---

## Pattern 6: Schema Match Test

**Purpose**: Validate that a specific node's output matches an expected schema.

**What it checks**:
- All expected fields are present
- Field types match expected types
- In strict mode: no extra fields allowed

**When to use**: When you need to validate the output of a specific intermediate node.

**Example test definition**:
```json
{
  "type": "schema_match",
  "node": "Transform Data",
  "schema": {
    "user_id": "number",
    "name": "string",
    "total": "number",
    "items": "list"
  },
  "strict": false
}
```

---

## Pattern 7: Value Match Test

**Purpose**: Validate that a specific field in a node's output has the expected value.

**What it checks**:
- Field exists in the output
- Field value matches expected
- Supports dynamic placeholders and regex

**When to use**: When you need to verify specific field values.

**Example test definition**:
```json
{
  "type": "value_match",
  "node": "Calculate Total",
  "field": "status",
  "expected": "completed"
}
```

---

## Pattern 8: Type Match Test

**Purpose**: Validate that a specific field in a node's output has the expected type.

**What it checks**:
- Field exists in the output
- Field type matches expected type

**When to use**: When the data type matters more than the specific value.

**Example test definition**:
```json
{
  "type": "type_match",
  "node": "Calculate Total",
  "field": "total",
  "expected": "number"
}
```

---

## Test Suite JSON Schema

```json
{
  "name": "Test Suite Name",
  "workflow_id": "optional-workflow-id",
  "scenarios": [
    {
      "id": "TC_001",
      "name": "Scenario Name",
      "type": "structural|code|db|e2e",
      "setup": {
        "database_seed": {
          "table_name": [{"field": "value"}]
        },
        "input": {
          "trigger": "webhook",
          "payload": {"field": "value"}
        }
      },
      "expected": {
        "node_outputs": {
          "Node Name": {"field": "expected_value"}
        },
        "final_output": {"field": "expected_value"}
      },
      "assertions": [
        {
          "type": "logical_sequence|schema_match|value_match|type_match|code_quality|db_state|output_match|branch_coverage",
          "description": "What this assertion checks",
          "node": "optional-node-name",
          "field": "optional-field-name",
          "expected": "expected-value-or-placeholder",
          "strict": false,
          "min_coverage": 100
        }
      ]
    }
  ]
}
```
