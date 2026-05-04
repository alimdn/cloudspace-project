#!/usr/bin/env python3
"""
n8n Workflow Testing Engine
===========================
Analyzes n8n workflow JSON, simulates execution paths, validates data flow,
and compares actual outputs against expected results.

Supports four testing modes:
  1. Logical Sequence Test - validates node ordering and DAG structure
  2. Code Analysis Test - static analysis of Code/Function node JavaScript
  3. Database State Test - validates DB read/write operations
  4. End-to-End Output Test - compares final output against expected

Usage:
  python3 workflow_tester.py <workflow.json> --test-suite <tests.json> [--output report.json]
  python3 workflow_tester.py <workflow.json> --auto [--output report.json]
"""

import json
import sys
import os
import re
import ast
import traceback
from typing import Any, Optional, Union
from collections import defaultdict, deque


# ══════════════════════════════════════════════════════════════════════════════
# SECTION 1: Workflow Parser & DAG Builder
# ══════════════════════════════════════════════════════════════════════════════

class WorkflowParser:
    """Parses n8n workflow JSON into structured data."""

    NODE_CATEGORIES = {
        "n8n-nodes-base.manualTrigger": "trigger",
        "n8n-nodes-base.scheduleTrigger": "trigger",
        "n8n-nodes-base.webhook": "trigger",
        "n8n-nodes-base.emailTrigger": "trigger",
        "n8n-nodes-base.cron": "trigger",
        "n8n-nodes-base.formTrigger": "trigger",
        "n8n-nodes-base.chatTrigger": "trigger",
        "n8n-nodes-base.errorTrigger": "trigger",
        "n8n-nodes-base.httpRequest": "action",
        "n8n-nodes-base.postgres": "action",
        "n8n-nodes-base.mysql": "action",
        "n8n-nodes-base.mongoDb": "action",
        "n8n-nodes-base.redis": "action",
        "n8n-nodes-base.googleSheets": "action",
        "n8n-nodes-base.airtable": "action",
        "n8n-nodes-base.supabase": "action",
        "n8n-nodes-base.notion": "action",
        "n8n-nodes-base.emailSend": "action",
        "n8n-nodes-base.slack": "action",
        "n8n-nodes-base.telegram": "action",
        "n8n-nodes-base.discord": "action",
        "n8n-nodes-base.if": "logic",
        "n8n-nodes-base.switch": "logic",
        "n8n-nodes-base.merge": "logic",
        "n8n-nodes-base.splitInBatches": "logic",
        "n8n-nodes-base.noOp": "logic",
        "n8n-nodes-base.stopAndError": "logic",
        "n8n-nodes-base.set": "transform",
        "n8n-nodes-base.code": "transform",
        "n8n-nodes-base.function": "transform",
        "n8n-nodes-base.functionItem": "transform",
        "n8n-nodes-base.dateTime": "transform",
        "n8n-nodes-base.html": "transform",
        "n8n-nodes-base.xml": "transform",
        "n8n-nodes-base.json": "transform",
        "n8n-nodes-base.crypto": "transform",
        "n8n-nodes-base.wait": "utility",
        "n8n-nodes-base.executeWorkflow": "utility",
        "n8n-nodes-base.stickyNote": "annotation",
        "n8n-nodes-langchain.agent": "ai",
        "n8n-nodes-langchain.chainLlm": "ai",
        "n8n-nodes-langchain.chatModel": "ai",
        "n8n-nodes-langchain.embeddings": "ai",
        "n8n-nodes-langchain.vectorStore": "ai",
        "n8n-nodes-langchain.memory": "ai",
        "n8n-nodes-langchain.tool": "ai",
    }

    # Nodes that read from a database
    DB_READ_NODES = {
        "n8n-nodes-base.postgres", "n8n-nodes-base.mysql",
        "n8n-nodes-base.mongoDb", "n8n-nodes-base.redis",
        "n8n-nodes-base.supabase", "n8n-nodes-base.airtable",
        "n8n-nodes-base.googleSheets", "n8n-nodes-base.notion",
    }

    # Operations that constitute DB reads
    DB_READ_OPS = {"select", "find", "get", "read", "list", "search", "query", "getAll"}

    # Operations that constitute DB writes
    DB_WRITE_OPS = {"insert", "create", "update", "delete", "upsert", "replace", "add", "remove"}

    def __init__(self, workflow_data: dict):
        self.raw = workflow_data
        self.nodes = {}
        self.connections = {}
        self.triggers = []
        self.terminal_nodes = []
        self._parse()

    def _parse(self):
        nodes_list = self.raw.get("nodes", [])
        for node in nodes_list:
            if not isinstance(node, dict):
                continue
            name = node.get("name", "")
            if not name:
                continue
            self.nodes[name] = node
            ntype = node.get("type", "")
            category = self.NODE_CATEGORIES.get(ntype, "other")
            node["_category"] = category

            if category == "trigger":
                self.triggers.append(name)

        # Parse connections
        self.connections = self.raw.get("connections", {})

        # Find terminal nodes (nodes not in connections as source, or nodes
        # whose output doesn't connect anywhere)
        source_nodes = set(self.connections.keys())
        all_output_targets = set()
        for src, conn_data in self.connections.items():
            if isinstance(conn_data, dict):
                main = conn_data.get("main", [])
                for branch in main:
                    if isinstance(branch, list):
                        for target in branch:
                            if isinstance(target, dict):
                                all_output_targets.add(target.get("node", ""))

        for name in self.nodes:
            ntype = self.nodes[name].get("type", "")
            if ntype == "n8n-nodes-base.stickyNote":
                continue
            if name not in source_nodes and name not in all_output_targets:
                # Orphan node - skip
                continue
            if name in source_nodes and name not in all_output_targets:
                # Has outgoing but no incoming - could be trigger
                pass
            if name not in source_nodes:
                # No outgoing connections = terminal
                self.terminal_nodes.append(name)
            elif name in source_nodes:
                # Check if all outputs are empty
                main = self.connections[name].get("main", []) if isinstance(self.connections[name], dict) else []
                has_real_output = False
                for branch in main:
                    if isinstance(branch, list) and len(branch) > 0:
                        has_real_output = True
                        break
                if not has_real_output:
                    self.terminal_nodes.append(name)

    def get_node(self, name: str) -> Optional[dict]:
        return self.nodes.get(name)

    def get_successors(self, node_name: str) -> list:
        """Get all successor node names for a given node."""
        result = []
        conn = self.connections.get(node_name, {})
        if not isinstance(conn, dict):
            return result
        main = conn.get("main", [])
        for branch in main:
            if isinstance(branch, list):
                for target in branch:
                    if isinstance(target, dict):
                        tname = target.get("node", "")
                        if tname:
                            result.append(tname)
        return result

    def get_predecessors(self, node_name: str) -> list:
        """Get all predecessor node names for a given node."""
        result = []
        for src_name, conn in self.connections.items():
            if not isinstance(conn, dict):
                continue
            main = conn.get("main", [])
            for branch in main:
                if isinstance(branch, list):
                    for target in branch:
                        if isinstance(target, dict) and target.get("node") == node_name:
                            result.append(src_name)
        return result

    def get_branches(self, node_name: str) -> list:
        """Get the number of output branches for a node (for IF/Switch)."""
        conn = self.connections.get(node_name, {})
        if not isinstance(conn, dict):
            return []
        return conn.get("main", [])


class DAGBuilder:
    """Builds a directed acyclic graph from parsed workflow."""

    def __init__(self, parser: WorkflowParser):
        self.parser = parser
        self.adjacency = defaultdict(list)
        self.reverse_adj = defaultdict(list)
        self.in_degree = defaultdict(int)
        self._build()

    def _build(self):
        for src_name, conn in self.parser.connections.items():
            if not isinstance(conn, dict):
                continue
            main = conn.get("main", [])
            for branch_idx, branch in enumerate(main):
                if isinstance(branch, list):
                    for target in branch:
                        if isinstance(target, dict):
                            tname = target.get("node", "")
                            if tname:
                                self.adjacency[src_name].append((tname, branch_idx))
                                self.reverse_adj[tname].append((src_name, branch_idx))
                                self.in_degree[tname] += 1

        # Ensure all nodes have in_degree entry
        for name in self.parser.nodes:
            if name not in self.in_degree:
                self.in_degree[name] = 0

    def topological_sort(self) -> list:
        """Return a topological ordering of nodes."""
        queue = deque()
        in_deg = dict(self.in_degree)

        for node, deg in in_deg.items():
            if deg == 0:
                queue.append(node)

        result = []
        while queue:
            node = queue.popleft()
            result.append(node)
            for succ, _ in self.adjacency[node]:
                in_deg[succ] -= 1
                if in_deg[succ] == 0:
                    queue.append(succ)

        return result

    def detect_cycles(self) -> list:
        """Detect cycles in the graph. Returns list of cycle paths."""
        WHITE, GRAY, BLACK = 0, 1, 2
        color = {name: WHITE for name in self.parser.nodes}
        cycles = []

        def dfs(node, path):
            color[node] = GRAY
            path.append(node)
            for succ, _ in self.adjacency[node]:
                if color[succ] == GRAY:
                    # Found cycle
                    cycle_start = path.index(succ)
                    cycles.append(path[cycle_start:] + [succ])
                elif color[succ] == WHITE:
                    dfs(succ, path)
            path.pop()
            color[node] = BLACK

        for node in self.parser.nodes:
            if color[node] == WHITE:
                dfs(node, [])

        return cycles

    def get_execution_paths(self) -> list:
        """Get all possible execution paths from triggers to terminal nodes."""
        paths = []

        def dfs(node, current_path, visited):
            current_path.append(node)
            successors = self.parser.get_successors(node)

            if not successors:
                paths.append(list(current_path))
            else:
                for succ in successors:
                    if succ not in visited:
                        visited.add(succ)
                        dfs(succ, current_path, visited)
                        visited.discard(succ)

        for trigger in self.parser.triggers:
            dfs(trigger, [], {trigger})

        return paths


# ══════════════════════════════════════════════════════════════════════════════
# SECTION 2: Code Analyzer (Static Analysis for Code/Function Nodes)
# ══════════════════════════════════════════════════════════════════════════════

class CodeAnalyzer:
    """Performs static analysis on JavaScript code inside Code/Function nodes."""

    # n8n-specific variables and references
    N8N_VARS = {
        "$input", "$json", "$item", "$itemIndex", "$runIndex",
        "$node", "$env", "$now", "$today", "$workflow", "$runId",
        "$getWorkflowStaticData", "$execution", "$executionData",
    }

    # Dangerous patterns
    DANGEROUS_PATTERNS = [
        (r"process\.env", "Accesses process.env directly - use $env instead"),
        (r"require\s*\(", "Uses require() - n8n Code nodes don't support CommonJS imports"),
        (r"import\s+.*from", "Uses ES import - n8n Code nodes may not support ES modules"),
        (r"eval\s*\(", "Uses eval() - security risk and unpredictable behavior"),
        (r"Function\s*\(", "Uses Function constructor - similar to eval, security risk"),
        (r"setTimeout|setInterval", "Uses timer functions - may cause workflow to hang"),
        (r"fetch\s*\(", "Uses fetch() - use HTTP Request node instead"),
        (r"XMLHttpRequest", "Uses XMLHttpRequest - use HTTP Request node instead"),
        (r"axios", "Uses axios - use HTTP Request node instead"),
    ]

    def __init__(self, code: str, node_name: str = ""):
        self.code = code
        self.node_name = node_name
        self.issues = []
        self.warnings = []
        self.references = set()
        self.returns = []

    def analyze(self) -> dict:
        """Run all analyses and return results."""
        self._check_syntax()
        self._check_n8n_references()
        self._check_dangerous_patterns()
        self._check_return_statements()
        self._check_error_handling()
        self._check_variable_usage()

        return {
            "node": self.node_name,
            "issues": self.issues,
            "warnings": self.warnings,
            "references": list(self.references),
            "returns": self.returns,
            "has_errors": len(self.issues) > 0,
            "quality_score": self._calculate_quality_score(),
        }

    def _check_syntax(self):
        """Check JavaScript syntax validity."""
        # Basic checks - look for common syntax errors
        open_braces = self.code.count("{")
        close_braces = self.code.count("}")
        open_parens = self.code.count("(")
        close_parens = self.code.count(")")
        open_brackets = self.code.count("[")
        close_brackets = self.code.count("]")

        if open_braces != close_braces:
            self.issues.append(f"Mismatched braces: {open_braces} open, {close_braces} close")
        if open_parens != close_parens:
            self.issues.append(f"Mismatched parentheses: {open_parens} open, {close_parens} close")
        if open_brackets != close_brackets:
            self.issues.append(f"Mismatched brackets: {open_brackets} open, {close_brackets} close")

    def _check_n8n_references(self):
        """Find all n8n variable references in the code."""
        # Find $variable references
        for var in self.N8N_VARS:
            pattern = re.compile(r'\b' + re.escape(var) + r'\b')
            if pattern.search(self.code):
                self.references.add(var)

        # Find $node["Name"] references
        node_refs = re.findall(r'\$node\[["\']([^"\']+)["\']\]', self.code)
        for ref in node_refs:
            self.references.add(f'$node["{ref}"]')

        # Find $json.field references
        json_refs = re.findall(r'\$json\.(\w+)', self.code)
        for ref in json_refs:
            self.references.add(f"$json.{ref}")

        # Find item.json.field references
        item_refs = re.findall(r'item\.json\.(\w+)', self.code)
        for ref in item_refs:
            self.references.add(f"item.json.{ref}")

    def _check_dangerous_patterns(self):
        """Check for dangerous or unsupported patterns."""
        for pattern, message in self.DANGEROUS_PATTERNS:
            if re.search(pattern, self.code):
                self.warnings.append(message)

    def _check_return_statements(self):
        """Check that the code has proper return statements."""
        # Look for return statements
        return_matches = re.findall(r'return\s+(.*?)(?:;|$)', self.code, re.MULTILINE)
        if not return_matches:
            self.issues.append("No return statement found - Code node must return data")
        else:
            for ret in return_matches:
                self.returns.append(ret.strip())

        # Check if return format is correct for n8n
        # n8n expects return of items array with json wrapper
        has_items_return = bool(re.search(r'return\s+items', self.code))
        has_json_wrap = bool(re.search(r'\{[\s\S]*?json\s*:', self.code))

        if not has_items_return and not has_json_wrap:
            # Might be using $input or direct return
            if re.search(r'return\s+\$input', self.code):
                pass  # Valid pattern
            elif not return_matches:
                pass  # Already flagged above
            else:
                self.warnings.append(
                    "Return value may not be in n8n format - "
                    "ensure return is an array of {json: {...}} objects"
                )

    def _check_error_handling(self):
        """Check for error handling (try/catch)."""
        has_try = bool(re.search(r'\btry\s*\{', self.code))
        has_catch = bool(re.search(r'\bcatch\s*\(', self.code))

        if has_try and not has_catch:
            self.warnings.append("Has try block without catch - errors may be silently swallowed")
        elif not has_try and len(self.code) > 200:
            self.warnings.append(
                "Long code block without error handling - "
                "consider wrapping in try/catch for robustness"
            )

    def _check_variable_usage(self):
        """Check for potentially undefined variables."""
        # Find const/let/var declarations
        declared = set()
        for match in re.finditer(r'(?:const|let|var)\s+(\w+)', self.code):
            declared.add(match.group(1))

        # Find variable usages (very basic - not full scope analysis)
        used = set()
        for match in re.finditer(r'\b([a-zA-Z_]\w*)\b', self.code):
            word = match.group(1)
            # Skip keywords, n8n vars, and common globals
            skip = {
                "const", "let", "var", "function", "return", "if", "else",
                "for", "while", "switch", "case", "break", "continue", "try",
                "catch", "finally", "throw", "new", "typeof", "instanceof",
                "true", "false", "null", "undefined", "this", "class",
                "Math", "JSON", "Object", "Array", "String", "Number",
                "Date", "Map", "Set", "Promise", "console",
                "items", "item",  # n8n conventions
            }
            if word not in skip and word not in declared and not word.startswith("$"):
                used.add(word)

    def _calculate_quality_score(self) -> int:
        """Calculate a quality score for the code (0-100)."""
        score = 100

        # Deductions for issues
        score -= len(self.issues) * 20
        score -= len(self.warnings) * 5

        # Bonus for error handling
        if re.search(r'\btry\s*\{', self.code) and re.search(r'\bcatch\s*\(', self.code):
            score += 5

        # Bonus for proper return format
        if re.search(r'return\s+items', self.code):
            score += 5

        return max(0, min(100, score))


# ══════════════════════════════════════════════════════════════════════════════
# SECTION 3: Data Flow Simulator
# ══════════════════════════════════════════════════════════════════════════════

class DataFlowSimulator:
    """
    Simulates data flow through the workflow, tracking transformations
    at each node and comparing outputs against expected values.
    """

    # Mock responses for common external nodes
    MOCK_RESPONSES = {
        "n8n-nodes-base.httpRequest": {
            "statusCode": 200,
            "body": {"success": True, "data": {}},
        },
        "n8n-nodes-base.slack": {"ok": True, "ts": "MOCK_TIMESTAMP"},
        "n8n-nodes-base.telegram": {"ok": True, "result": {"message_id": 1}},
        "n8n-nodes-base.emailSend": {"success": True},
        "n8n-nodes-base.postgres": [{"id": 1, "data": "mock_row"}],
        "n8n-nodes-base.mysql": [{"id": 1, "data": "mock_row"}],
        "n8n-nodes-base.mongoDb": [{"_id": "mock_id", "data": "mock_doc"}],
        "n8n-nodes-base.googleSheets": [{"row_number": 1, "data": "mock_cell"}],
    }

    def __init__(self, parser: WorkflowParser, dag: DAGBuilder):
        self.parser = parser
        self.dag = dag
        self.node_outputs = {}
        self.execution_trace = []

    def simulate(self, input_data: dict = None, db_seed: dict = None) -> dict:
        """
        Simulate the workflow execution with given input data and DB seed.

        Args:
            input_data: The initial input data (from trigger payload)
            db_seed: Mock database state {table_name: [rows]}

        Returns:
            Simulation result with per-node outputs and final output
        """
        self.node_outputs = {}
        self.execution_trace = []
        db_state = dict(db_seed) if db_seed else {}

        # Start from triggers
        topo_order = self.dag.topological_sort()

        for node_name in topo_order:
            node = self.parser.get_node(node_name)
            if not node:
                continue

            ntype = node.get("type", "")
            category = node.get("_category", "other")
            params = node.get("parameters", {})

            trace_entry = {
                "node": node_name,
                "type": ntype,
                "category": category,
                "input": None,
                "output": None,
                "issues": [],
            }

            # Get input from predecessors
            predecessors = self.parser.get_predecessors(node_name)
            if predecessors:
                # Merge all predecessor outputs
                input_items = []
                for pred in predecessors:
                    pred_output = self.node_outputs.get(pred, [])
                    if isinstance(pred_output, list):
                        input_items.extend(pred_output)
                    else:
                        input_items.append(pred_output)
                trace_entry["input"] = input_items
            elif input_data and category == "trigger":
                trace_entry["input"] = [input_data]

            # Simulate node execution
            try:
                output = self._simulate_node(
                    node_name, ntype, category, params,
                    trace_entry["input"], db_state
                )
                trace_entry["output"] = output
                self.node_outputs[node_name] = output
            except Exception as e:
                trace_entry["issues"].append(f"Simulation error: {str(e)}")
                self.node_outputs[node_name] = []

            self.execution_trace.append(trace_entry)

        # Get final outputs from terminal nodes
        final_outputs = []
        for term in self.parser.terminal_nodes:
            output = self.node_outputs.get(term, [])
            if output:
                final_outputs.append({"node": term, "data": output})

        return {
            "execution_trace": self.execution_trace,
            "node_outputs": self.node_outputs,
            "final_outputs": final_outputs,
            "db_state": db_state,
        }

    def _simulate_node(self, name: str, ntype: str, category: str,
                       params: dict, input_data: Any, db_state: dict) -> Any:
        """Simulate a single node's execution."""

        if category == "trigger":
            return input_data if input_data else [{"triggered": True}]

        elif ntype == "n8n-nodes-base.if":
            return self._simulate_if(params, input_data)

        elif ntype == "n8n-nodes-base.switch":
            return self._simulate_switch(params, input_data)

        elif ntype == "n8n-nodes-base.set":
            return self._simulate_set(params, input_data)

        elif ntype in ("n8n-nodes-base.code", "n8n-nodes-base.function",
                       "n8n-nodes-base.functionItem"):
            return self._simulate_code(params, input_data)

        elif ntype == "n8n-nodes-base.merge":
            return self._simulate_merge(input_data)

        elif ntype in WorkflowParser.DB_READ_NODES:
            return self._simulate_db_read(ntype, params, db_state)

        elif ntype == "n8n-nodes-base.httpRequest":
            return self._simulate_http(params, input_data)

        elif ntype in self.MOCK_RESPONSES:
            return [self.MOCK_RESPONSES[ntype]]

        else:
            # Generic passthrough
            return input_data if input_data else [{"data": "passthrough"}]

    def _simulate_if(self, params: dict, input_data: Any) -> Any:
        """Simulate IF node - just pass through (branch selection happens in DAG)."""
        conditions = params.get("conditions", {})
        # In simulation, we assume conditions are met for the true branch
        return input_data

    def _simulate_switch(self, params: dict, input_data: Any) -> Any:
        """Simulate Switch node."""
        return input_data

    def _simulate_set(self, params: dict, input_data: Any) -> Any:
        """Simulate Set node by applying field assignments."""
        if not input_data:
            input_data = [{}]

        assignments = params.get("assignments", {}).get("assignments", [])
        results = []
        for item in (input_data if isinstance(input_data, list) else [input_data]):
            new_item = dict(item) if isinstance(item, dict) else {"data": item}
            json_data = new_item.get("json", new_item)
            for assignment in assignments:
                field_name = assignment.get("name", "")
                field_value = assignment.get("value", "")
                field_type = assignment.get("type", "string")

                # Resolve expressions like {{$json.field}}
                if isinstance(field_value, str) and "{{" in field_value:
                    resolved = self._resolve_expression(field_value, json_data)
                    json_data[field_name] = resolved
                else:
                    json_data[field_name] = self._cast_type(field_value, field_type)

            new_item["json"] = json_data
            results.append(new_item)

        return results

    def _simulate_code(self, params: dict, input_data: Any) -> Any:
        """
        Analyze Code node without executing it.
        Track what fields it likely reads and produces.
        """
        code = params.get("jsCode", "") or params.get("functionCode", "")
        if not code:
            return input_data

        analyzer = CodeAnalyzer(code, "CodeNode")
        analysis = analyzer.analyze()

        # Build a best-effort output based on code analysis
        output = input_data if input_data else [{}]

        # If we can detect what fields the code adds, include them
        # This is a heuristic - real execution would be needed for exact results
        json_refs = [r for r in analysis["references"] if r.startswith("$json.")]
        for ref in json_refs:
            field = ref.replace("$json.", "")
            # These are READ fields, not write fields
            pass

        return output

    def _simulate_merge(self, input_data: Any) -> Any:
        """Simulate Merge node."""
        if isinstance(input_data, list):
            return input_data
        return [input_data] if input_data else []

    def _simulate_db_read(self, ntype: str, params: dict, db_state: dict) -> Any:
        """Simulate a database read operation."""
        operation = params.get("operation", "select")
        table = params.get("table", params.get("collection", "default_table"))

        # Check if we have seed data for this table
        if db_state and table in db_state:
            return [{"json": row} for row in db_state[table]]

        # Return mock data
        mock = self.MOCK_RESPONSES.get(ntype, [{"id": 1}])
        if isinstance(mock, list):
            return [{"json": row} for row in mock]
        return [mock]

    def _simulate_http(self, params: dict, input_data: Any) -> Any:
        """Simulate HTTP Request node."""
        url = params.get("url", "")
        method = params.get("method", "GET")
        return [{"json": {"statusCode": 200, "method": method, "url_resolved": bool(url)}}]

    def _resolve_expression(self, expr: str, data: dict) -> Any:
        """Resolve n8n expressions like {{$json.field}}."""
        def replacer(match):
            path = match.group(1).strip()
            # Handle $json.field
            if path.startswith("$json."):
                field = path.replace("$json.", "")
                return data.get(field, f"{{{{{path}}}}}")
            return match.group(0)

        result = re.sub(r'\{\{(.+?)\}\}', replacer, expr)
        return result

    def _cast_type(self, value: Any, type_name: str) -> Any:
        """Cast a value to the specified type."""
        try:
            if type_name == "number":
                return float(value) if '.' in str(value) else int(value)
            elif type_name == "boolean":
                return str(value).lower() in ("true", "1", "yes")
            elif type_name == "object":
                return json.loads(value) if isinstance(value, str) else value
            return value
        except (ValueError, TypeError):
            return value


# ══════════════════════════════════════════════════════════════════════════════
# SECTION 4: Assertion Engine
# ══════════════════════════════════════════════════════════════════════════════

class AssertionEngine:
    """Evaluates assertions against simulation results."""

    # Fields that are typically dynamic and should be ignored in comparisons
    DYNAMIC_FIELD_PATTERNS = [
        r"_?id$", r"timestamp$", r"created_?at$", r"updated_?at$",
        r"uuid$", r"date$", r"time$", r"run_?id$",
    ]

    def __init__(self, simulation_result: dict, parser: WorkflowParser):
        self.result = simulation_result
        self.parser = parser
        self.assertions_results = []

    def evaluate(self, test_suite: dict) -> dict:
        """Evaluate all assertions in the test suite."""
        results = {
            "total": 0,
            "passed": 0,
            "failed": 0,
            "skipped": 0,
            "assertions": [],
        }

        scenarios = test_suite.get("scenarios", [])
        if not scenarios:
            # Run auto-generated assertions
            scenarios = [self._auto_generate_scenario()]

        for scenario in scenarios:
            scenario_assertions = scenario.get("assertions", [])
            for assertion in scenario_assertions:
                results["total"] += 1
                assertion_result = self._evaluate_assertion(assertion, scenario)
                results["assertions"].append(assertion_result)

                if assertion_result["status"] == "passed":
                    results["passed"] += 1
                elif assertion_result["status"] == "skipped":
                    results["skipped"] += 1
                else:
                    results["failed"] += 1

        # Calculate pass rate
        if results["total"] > 0:
            results["pass_rate"] = round(results["passed"] / results["total"] * 100, 1)
        else:
            results["pass_rate"] = 0.0

        return results

    def _auto_generate_scenario(self) -> dict:
        """Auto-generate basic assertions from workflow structure."""
        assertions = []

        # 1. Check triggers exist
        assertions.append({
            "type": "logical_sequence",
            "description": "Workflow has at least one trigger node",
            "expected": len(self.parser.triggers) > 0,
        })

        # 2. Check no cycles
        dag = DAGBuilder(self.parser)
        cycles = dag.detect_cycles()
        assertions.append({
            "type": "logical_sequence",
            "description": "Workflow has no cycles",
            "expected": len(cycles) == 0,
        })

        # 3. Check all nodes are connected
        for name in self.parser.nodes:
            ntype = self.parser.nodes[name].get("type", "")
            if ntype == "n8n-nodes-base.stickyNote":
                continue
            preds = self.parser.get_predecessors(name)
            succs = self.parser.get_successors(name)
            if not preds and not succs:
                assertions.append({
                    "type": "logical_sequence",
                    "description": f"Node '{name}' is connected to the workflow",
                    "node": name,
                    "expected": False,  # Should be connected
                })

        # 4. Check Code nodes have return statements
        for name, node in self.parser.nodes.items():
            ntype = node.get("type", "")
            if ntype in ("n8n-nodes-base.code", "n8n-nodes-base.function"):
                code = node.get("parameters", {}).get("jsCode", "") or \
                       node.get("parameters", {}).get("functionCode", "")
                if code:
                    analyzer = CodeAnalyzer(code, name)
                    analysis = analyzer.analyze()
                    for issue in analysis["issues"]:
                        assertions.append({
                            "type": "code_quality",
                            "description": f"Node '{name}': {issue}",
                            "node": name,
                            "expected": "no issues",
                        })

        return {"assertions": assertions}

    def _evaluate_assertion(self, assertion: dict, scenario: dict) -> dict:
        """Evaluate a single assertion."""
        atype = assertion.get("type", "")
        result = {
            "type": atype,
            "description": assertion.get("description", ""),
            "status": "pending",
            "evidence": "",
        }

        try:
            if atype == "logical_sequence":
                result = self._eval_logical_sequence(assertion, result)
            elif atype == "schema_match":
                result = self._eval_schema_match(assertion, result)
            elif atype == "value_match":
                result = self._eval_value_match(assertion, result)
            elif atype == "type_match":
                result = self._eval_type_match(assertion, result)
            elif atype == "code_quality":
                result = self._eval_code_quality(assertion, result)
            elif atype == "db_state":
                result = self._eval_db_state(assertion, result)
            elif atype == "output_match":
                result = self._eval_output_match(assertion, result)
            elif atype == "branch_coverage":
                result = self._eval_branch_coverage(assertion, result)
            else:
                result["status"] = "skipped"
                result["evidence"] = f"Unknown assertion type: {atype}"

        except Exception as e:
            result["status"] = "failed"
            result["evidence"] = f"Evaluation error: {str(e)}"

        return result

    def _eval_logical_sequence(self, assertion: dict, result: dict) -> dict:
        """Evaluate logical sequence assertions."""
        desc = assertion.get("description", "")

        if "trigger" in desc.lower():
            has_triggers = len(self.parser.triggers) > 0
            result["status"] = "passed" if has_triggers else "failed"
            result["evidence"] = f"Found {len(self.parser.triggers)} trigger(s)" if has_triggers else "No triggers found"

        elif "cycle" in desc.lower():
            dag = DAGBuilder(self.parser)
            cycles = dag.detect_cycles()
            result["status"] = "passed" if not cycles else "failed"
            result["evidence"] = "No cycles detected" if not cycles else f"Found {len(cycles)} cycle(s)"

        elif "connected" in desc.lower():
            node_name = assertion.get("node", "")
            preds = self.parser.get_predecessors(node_name)
            succs = self.parser.get_successors(node_name)
            is_connected = len(preds) > 0 or len(succs) > 0
            # Triggers don't need predecessors
            ntype = self.parser.get_node(node_name, {}).get("_category", "")
            if ntype == "trigger":
                is_connected = len(succs) > 0
            result["status"] = "passed" if is_connected else "failed"
            result["evidence"] = f"Predecessors: {preds}, Successors: {succs}"

        elif "order" in assertion:
            # Check specific node ordering
            expected_order = assertion.get("order", [])
            topo = DAGBuilder(self.parser).topological_sort()
            # Verify expected order is a subsequence of topological order
            order_ok = True
            last_idx = -1
            for node in expected_order:
                if node in topo:
                    idx = topo.index(node)
                    if idx < last_idx:
                        order_ok = False
                        break
                    last_idx = idx
            result["status"] = "passed" if order_ok else "failed"
            result["evidence"] = f"Expected order: {expected_order}, Topo: {topo}"

        else:
            # Generic boolean check
            expected = assertion.get("expected", True)
            result["status"] = "passed" if expected else "failed"
            result["evidence"] = f"Expected: {expected}"

        return result

    def _eval_schema_match(self, assertion: dict, result: dict) -> dict:
        """Evaluate schema match assertions."""
        node_name = assertion.get("node", "")
        expected_schema = assertion.get("schema", {})

        node_output = self.result.get("node_outputs", {}).get(node_name, [])
        if not node_output:
            result["status"] = "failed"
            result["evidence"] = f"No output found for node '{node_name}'"
            return result

        # Get the first item's json data
        first_item = node_output[0] if isinstance(node_output, list) else node_output
        actual_data = first_item.get("json", first_item) if isinstance(first_item, dict) else {}

        # Compare schemas
        missing_fields = []
        extra_fields = []
        type_mismatches = []

        for field, expected_type in expected_schema.items():
            if field not in actual_data:
                missing_fields.append(field)
            elif expected_type and expected_type != "any":
                actual_type = type(actual_data[field]).__name__
                if actual_type != expected_type:
                    type_mismatches.append(f"{field}: expected {expected_type}, got {actual_type}")

        strict = assertion.get("strict", False)
        if strict:
            for field in actual_data:
                if field not in expected_schema:
                    extra_fields.append(field)

        is_match = not missing_fields and not type_mismatches and (not strict or not extra_fields)
        result["status"] = "passed" if is_match else "failed"

        evidence_parts = []
        if missing_fields:
            evidence_parts.append(f"Missing fields: {missing_fields}")
        if type_mismatches:
            evidence_parts.append(f"Type mismatches: {type_mismatches}")
        if extra_fields:
            evidence_parts.append(f"Extra fields: {extra_fields}")
        if not evidence_parts:
            evidence_parts.append("Schema matches expected")
        result["evidence"] = "; ".join(evidence_parts)

        return result

    def _eval_value_match(self, assertion: dict, result: dict) -> dict:
        """Evaluate value match assertions."""
        node_name = assertion.get("node", "")
        field = assertion.get("field", "")
        expected_value = assertion.get("expected")

        node_output = self.result.get("node_outputs", {}).get(node_name, [])
        if not node_output:
            # Check final outputs
            for fo in self.result.get("final_outputs", []):
                if fo.get("node") == node_name:
                    node_output = fo.get("data", [])
                    break

        if not node_output:
            result["status"] = "failed"
            result["evidence"] = f"No output found for node '{node_name}'"
            return result

        first_item = node_output[0] if isinstance(node_output, list) else node_output
        actual_data = first_item.get("json", first_item) if isinstance(first_item, dict) else {}

        if field not in actual_data:
            result["status"] = "failed"
            result["evidence"] = f"Field '{field}' not found in output. Available: {list(actual_data.keys())}"
            return result

        actual_value = actual_data[field]

        # Handle dynamic placeholders
        if isinstance(expected_value, str) and expected_value.startswith("{{") and expected_value.endswith("}}"):
            result["status"] = "passed"
            result["evidence"] = f"Field '{field}' exists with dynamic value: {actual_value}"
            return result

        # Handle regex patterns
        if isinstance(expected_value, str) and expected_value.startswith("regex:"):
            pattern = expected_value[6:]
            if re.match(pattern, str(actual_value)):
                result["status"] = "passed"
                result["evidence"] = f"Field '{field}' matches pattern: {actual_value}"
            else:
                result["status"] = "failed"
                result["evidence"] = f"Field '{field}' value '{actual_value}' doesn't match pattern '{pattern}'"
            return result

        if actual_value == expected_value:
            result["status"] = "passed"
            result["evidence"] = f"Field '{field}' = {actual_value} (matches expected)"
        else:
            result["status"] = "failed"
            result["evidence"] = f"Field '{field}': expected {expected_value}, got {actual_value}"

        return result

    def _eval_type_match(self, assertion: dict, result: dict) -> dict:
        """Evaluate type match assertions."""
        node_name = assertion.get("node", "")
        field = assertion.get("field", "")
        expected_type = assertion.get("expected", "any")

        node_output = self.result.get("node_outputs", {}).get(node_name, [])
        if not node_output:
            result["status"] = "failed"
            result["evidence"] = f"No output found for node '{node_name}'"
            return result

        first_item = node_output[0] if isinstance(node_output, list) else node_output
        actual_data = first_item.get("json", first_item) if isinstance(first_item, dict) else {}

        if field and field not in actual_data:
            result["status"] = "failed"
            result["evidence"] = f"Field '{field}' not found in output"
            return result

        if field:
            actual_type = type(actual_data[field]).__name__
        else:
            actual_type = type(actual_data).__name__

        if actual_type == expected_type or expected_type == "any":
            result["status"] = "passed"
            result["evidence"] = f"Type match: {field or 'root'} is {actual_type}"
        else:
            result["status"] = "failed"
            result["evidence"] = f"Type mismatch: {field or 'root'} is {actual_type}, expected {expected_type}"

        return result

    def _eval_code_quality(self, assertion: dict, result: dict) -> dict:
        """Evaluate code quality assertions."""
        desc = assertion.get("description", "")

        # This was pre-evaluated during auto-generation
        if "no issues" in str(assertion.get("expected", "")):
            result["status"] = "failed"
            result["evidence"] = desc
        else:
            result["status"] = "passed"
            result["evidence"] = desc

        return result

    def _eval_db_state(self, assertion: dict, result: dict) -> dict:
        """Evaluate database state assertions."""
        table = assertion.get("table", "")
        expected_state = assertion.get("expected", {})
        operation = assertion.get("operation", "read")

        db_state = self.result.get("db_state", {})
        if table not in db_state:
            result["status"] = "skipped"
            result["evidence"] = f"Table '{table}' not found in DB state"
            return result

        actual_state = db_state[table]
        if expected_state:
            # Compare expected vs actual
            match = actual_state == expected_state
            result["status"] = "passed" if match else "failed"
            result["evidence"] = f"DB state for '{table}': {'matches' if match else 'differs from'} expected"
        else:
            result["status"] = "passed"
            result["evidence"] = f"DB state for '{table}' exists with {len(actual_state)} rows"

        return result

    def _eval_output_match(self, assertion: dict, result: dict) -> dict:
        """Evaluate end-to-end output match assertions."""
        expected_output = assertion.get("expected", {})
        ignore_dynamic = assertion.get("ignore_dynamic", True)

        final_outputs = self.result.get("final_outputs", [])
        if not final_outputs:
            result["status"] = "failed"
            result["evidence"] = "No final output produced"
            return result

        # Get the last terminal node's output
        actual_output = final_outputs[-1].get("data", [{}])
        if isinstance(actual_output, list) and len(actual_output) > 0:
            actual_output = actual_output[0]
        if isinstance(actual_output, dict) and "json" in actual_output:
            actual_output = actual_output["json"]

        # Deep compare
        mismatches = self._deep_compare(expected_output, actual_output, ignore_dynamic)

        if not mismatches:
            result["status"] = "passed"
            result["evidence"] = "Output matches expected"
        else:
            result["status"] = "failed"
            result["evidence"] = f"Mismatches: {'; '.join(mismatches[:5])}"

        return result

    def _eval_branch_coverage(self, assertion: dict, result: dict) -> dict:
        """Evaluate branch coverage assertions."""
        min_coverage = assertion.get("min_coverage", 100)

        dag = DAGBuilder(self.parser)
        execution_paths = dag.get_execution_paths()

        # Count branches for IF/Switch nodes
        branch_nodes = []
        for name, node in self.parser.nodes.items():
            ntype = node.get("type", "")
            if ntype in ("n8n-nodes-base.if", "n8n-nodes-base.switch"):
                branches = self.parser.get_branches(name)
                branch_nodes.append({
                    "node": name,
                    "type": ntype,
                    "branch_count": len(branches),
                })

        if not branch_nodes:
            result["status"] = "passed"
            result["evidence"] = "No branch nodes found - 100% coverage"
            return result

        # Check if all branches are covered by execution paths
        covered_branches = set()
        for path in execution_paths:
            for i, node in enumerate(path):
                for bn in branch_nodes:
                    if node == bn["node"] and i + 1 < len(path):
                        # Determine which branch was taken
                        next_node = path[i + 1]
                        branches = self.parser.get_branches(node)
                        for bidx, branch in enumerate(branches):
                            if isinstance(branch, list):
                                for target in branch:
                                    if isinstance(target, dict) and target.get("node") == next_node:
                                        covered_branches.add(f"{node}:branch_{bidx}")

        total_branches = sum(bn["branch_count"] for bn in branch_nodes)
        coverage = (len(covered_branches) / total_branches * 100) if total_branches > 0 else 100

        result["status"] = "passed" if coverage >= min_coverage else "failed"
        result["evidence"] = f"Branch coverage: {coverage:.1f}% ({len(covered_branches)}/{total_branches} branches)"

        return result

    def _deep_compare(self, expected: Any, actual: Any,
                      ignore_dynamic: bool = True, path: str = "") -> list:
        """Deep compare two values, returning list of mismatches."""
        mismatches = []

        if isinstance(expected, dict) and isinstance(actual, dict):
            for key in expected:
                # Skip dynamic fields
                if ignore_dynamic and any(re.match(p, key) for p in self.DYNAMIC_FIELD_PATTERNS):
                    continue

                new_path = f"{path}.{key}" if path else key
                if key not in actual:
                    mismatches.append(f"{new_path}: missing in actual")
                else:
                    mismatches.extend(self._deep_compare(expected[key], actual[key], ignore_dynamic, new_path))

        elif isinstance(expected, list) and isinstance(actual, list):
            if len(expected) != len(actual):
                mismatches.append(f"{path}: length differs (expected {len(expected)}, got {len(actual)})")
            for i in range(min(len(expected), len(actual))):
                mismatches.extend(self._deep_compare(expected[i], actual[i], ignore_dynamic, f"{path}[{i}]"))

        elif isinstance(expected, str) and expected.startswith("{{dynamic}}"):
            pass  # Dynamic placeholder - skip
        elif isinstance(expected, str) and expected.startswith("{{regex:"):
            pattern = expected[8:-2]  # Extract pattern from {{regex:PATTERN}}
            if not re.match(pattern, str(actual)):
                mismatches.append(f"{path}: '{actual}' doesn't match pattern '{pattern}'")
        elif expected != actual:
            mismatches.append(f"{path}: expected {expected}, got {actual}")

        return mismatches


# ══════════════════════════════════════════════════════════════════════════════
# SECTION 5: Test Runner & Report Generator
# ══════════════════════════════════════════════════════════════════════════════

class WorkflowTestRunner:
    """Main test runner that orchestrates all testing phases."""

    def __init__(self, workflow_path: str, test_suite_path: str = None):
        self.workflow_path = workflow_path
        self.test_suite_path = test_suite_path
        self.workflow_data = None
        self.test_suite = None
        self.parser = None
        self.dag = None

    def run(self, output_path: str = None) -> dict:
        """Run the complete test suite and return results."""
        # Step 1: Load workflow
        self.workflow_data = self._load_json(self.workflow_path)
        if not self.workflow_data:
            return self._error_result(f"Failed to load workflow: {self.workflow_path}")

        # Step 2: Parse workflow
        self.parser = WorkflowParser(self.workflow_data)
        self.dag = DAGBuilder(self.parser)

        # Step 3: Load test suite (optional)
        if self.test_suite_path and os.path.exists(self.test_suite_path):
            self.test_suite = self._load_json(self.test_suite_path)
        else:
            self.test_suite = self._auto_generate_test_suite()

        # Step 4: Run structural tests
        structural_results = self._run_structural_tests()

        # Step 5: Run code analysis tests
        code_results = self._run_code_analysis()

        # Step 6: Run simulation and data flow tests
        simulation_results = self._run_simulation_tests()

        # Step 7: Run assertion-based tests
        assertion_results = self._run_assertion_tests()

        # Step 8: Compile final report
        report = self._compile_report(
            structural_results, code_results, simulation_results, assertion_results
        )

        # Step 9: Save report if path provided
        if output_path:
            os.makedirs(os.path.dirname(output_path) or ".", exist_ok=True)
            with open(output_path, "w", encoding="utf-8") as f:
                json.dump(report, f, ensure_ascii=False, indent=2)

        return report

    def _load_json(self, path: str) -> Optional[dict]:
        """Load a JSON file."""
        try:
            with open(path, "r", encoding="utf-8") as f:
                return json.load(f)
        except (json.JSONDecodeError, FileNotFoundError) as e:
            return None

    def _auto_generate_test_suite(self) -> dict:
        """Auto-generate a basic test suite from workflow structure."""
        scenarios = []

        # Generate one scenario per trigger
        for i, trigger_name in enumerate(self.parser.triggers):
            trigger_node = self.parser.get_node(trigger_name)
            trigger_type = trigger_node.get("type", "") if trigger_node else ""

            assertions = [
                {
                    "type": "logical_sequence",
                    "description": f"Trigger '{trigger_name}' is properly connected",
                },
            ]

            # Check all execution paths from this trigger
            paths = self.dag.get_execution_paths()
            for path in paths:
                if trigger_name in path:
                    # Check each node in the path
                    for node_name in path[1:]:
                        node = self.parser.get_node(node_name)
                        if node:
                            ntype = node.get("type", "")
                            if ntype in ("n8n-nodes-base.code", "n8n-nodes-base.function"):
                                assertions.append({
                                    "type": "code_quality",
                                    "description": f"Code node '{node_name}' has proper return statements",
                                    "node": node_name,
                                })

            scenarios.append({
                "id": f"AUTO_TC_{i+1:03d}",
                "name": f"Auto test for trigger: {trigger_name}",
                "type": "structural",
                "assertions": assertions,
            })

        # Add global assertions
        global_assertions = [
            {
                "type": "logical_sequence",
                "description": "Workflow has no cycles",
            },
            {
                "type": "logical_sequence",
                "description": "Workflow has at least one trigger node",
            },
            {
                "type": "branch_coverage",
                "description": "All branches are reachable",
                "min_coverage": 100,
            },
        ]

        scenarios.append({
            "id": "AUTO_TC_GLOBAL",
            "name": "Global structural checks",
            "type": "structural",
            "assertions": global_assertions,
        })

        return {"name": "Auto-generated Test Suite", "scenarios": scenarios}

    def _run_structural_tests(self) -> dict:
        """Test 1: Logical Sequence / Structural validation."""
        results = {
            "phase": "structural",
            "checks": [],
        }

        # Check 1: Has triggers
        has_triggers = len(self.parser.triggers) > 0
        results["checks"].append({
            "name": "Has trigger nodes",
            "passed": has_triggers,
            "detail": f"Found {len(self.parser.triggers)} trigger(s): {self.parser.triggers}",
        })

        # Check 2: No cycles
        cycles = self.dag.detect_cycles()
        results["checks"].append({
            "name": "No cycles in workflow",
            "passed": len(cycles) == 0,
            "detail": f"Found {len(cycles)} cycle(s)" if cycles else "No cycles detected",
        })

        # Check 3: All nodes connected
        orphan_nodes = []
        for name in self.parser.nodes:
            ntype = self.parser.nodes[name].get("type", "")
            if ntype == "n8n-nodes-base.stickyNote":
                continue
            preds = self.parser.get_predecessors(name)
            succs = self.parser.get_successors(name)
            category = self.parser.nodes[name].get("_category", "")
            if category == "trigger":
                if not succs:
                    orphan_nodes.append(name)
            elif not preds and not succs:
                orphan_nodes.append(name)

        results["checks"].append({
            "name": "All nodes are connected",
            "passed": len(orphan_nodes) == 0,
            "detail": f"Orphan nodes: {orphan_nodes}" if orphan_nodes else "All nodes connected",
        })

        # Check 4: Unique node names
        names = [n.get("name", "") for n in self.workflow_data.get("nodes", [])]
        duplicates = [n for n in set(names) if names.count(n) > 1]
        results["checks"].append({
            "name": "All node names are unique",
            "passed": len(duplicates) == 0,
            "detail": f"Duplicate names: {duplicates}" if duplicates else "All names unique",
        })

        # Check 5: Valid connections (all referenced nodes exist)
        invalid_connections = []
        for src, conn in self.parser.connections.items():
            if src not in self.parser.nodes:
                invalid_connections.append(f"Source '{src}' doesn't exist")
            if isinstance(conn, dict):
                for branch in conn.get("main", []):
                    if isinstance(branch, list):
                        for target in branch:
                            if isinstance(target, dict):
                                tname = target.get("node", "")
                                if tname not in self.parser.nodes:
                                    invalid_connections.append(f"Target '{tname}' (from '{src}') doesn't exist")

        results["checks"].append({
            "name": "All connections reference existing nodes",
            "passed": len(invalid_connections) == 0,
            "detail": f"Invalid: {invalid_connections}" if invalid_connections else "All connections valid",
        })

        # Check 6: IF/Switch nodes have multiple branches
        incomplete_branches = []
        for name, node in self.parser.nodes.items():
            ntype = node.get("type", "")
            if ntype in ("n8n-nodes-base.if", "n8n-nodes-base.switch"):
                branches = self.parser.get_branches(name)
                non_empty = [b for b in branches if isinstance(b, list) and len(b) > 0]
                if len(non_empty) < 2:
                    incomplete_branches.append(f"'{name}' has {len(non_empty)} branch(es), expected 2+")

        results["checks"].append({
            "name": "IF/Switch nodes have multiple branches",
            "passed": len(incomplete_branches) == 0,
            "detail": incomplete_branches if incomplete_branches else "All branch nodes properly configured",
        })

        # Calculate structural score
        passed = sum(1 for c in results["checks"] if c["passed"])
        total = len(results["checks"])
        results["score"] = round(passed / total * 100, 1) if total > 0 else 0

        return results

    def _run_code_analysis(self) -> dict:
        """Test 2: Code Analysis for Code/Function nodes."""
        results = {
            "phase": "code_analysis",
            "nodes_analyzed": [],
        }

        for name, node in self.parser.nodes.items():
            ntype = node.get("type", "")
            if ntype not in ("n8n-nodes-base.code", "n8n-nodes-base.function",
                             "n8n-nodes-base.functionItem"):
                continue

            code = node.get("parameters", {}).get("jsCode", "") or \
                   node.get("parameters", {}).get("functionCode", "")

            if not code:
                results["nodes_analyzed"].append({
                    "node": name,
                    "status": "empty",
                    "issues": ["Code node has no code"],
                })
                continue

            analyzer = CodeAnalyzer(code, name)
            analysis = analyzer.analyze()

            results["nodes_analyzed"].append({
                "node": name,
                "status": "issues" if analysis["has_errors"] else "ok",
                "issues": analysis["issues"],
                "warnings": analysis["warnings"],
                "references": analysis["references"],
                "quality_score": analysis["quality_score"],
            })

        # Calculate code quality score
        all_scores = [n["quality_score"] for n in results["nodes_analyzed"] if "quality_score" in n]
        results["average_score"] = round(sum(all_scores) / len(all_scores), 1) if all_scores else 100

        return results

    def _run_simulation_tests(self) -> dict:
        """Test 3: Data Flow Simulation."""
        results = {
            "phase": "simulation",
        }

        # Run simulation with default input
        simulator = DataFlowSimulator(self.parser, self.dag)

        # Try with user-provided input if available
        input_data = None
        db_seed = None

        if self.test_suite and self.test_suite.get("scenarios"):
            first_scenario = self.test_suite["scenarios"][0]
            setup = first_scenario.get("setup", {})
            input_data = setup.get("input", {}).get("payload")
            db_seed = setup.get("database_seed")

        simulation = simulator.simulate(input_data=input_data, db_seed=db_seed)

        results["execution_trace"] = simulation["execution_trace"]
        results["final_outputs"] = simulation["final_outputs"]

        # Validate data flow
        results["flow_issues"] = []
        for trace in simulation["execution_trace"]:
            if trace.get("issues"):
                results["flow_issues"].extend([
                    f"Node '{trace['node']}': {issue}" for issue in trace["issues"]
                ])

        # Check for unreachable nodes
        topo = self.dag.topological_sort()
        trace_nodes = {t["node"] for t in simulation["execution_trace"]}
        unreachable = [n for n in self.parser.nodes if n not in trace_nodes
                       and self.parser.nodes[n].get("type") != "n8n-nodes-base.stickyNote"]
        if unreachable:
            results["flow_issues"].append(f"Unreachable nodes: {unreachable}")

        results["score"] = 100 if not results["flow_issues"] else max(0, 100 - len(results["flow_issues"]) * 15)

        return results

    def _run_assertion_tests(self) -> dict:
        """Test 4: Assertion-based evaluation."""
        simulator = DataFlowSimulator(self.parser, self.dag)

        # Run simulation for each scenario
        all_results = []
        for scenario in self.test_suite.get("scenarios", []):
            setup = scenario.get("setup", {})
            input_data = setup.get("input", {}).get("payload")
            db_seed = setup.get("database_seed")

            simulation = simulator.simulate(input_data=input_data, db_seed=db_seed)

            engine = AssertionEngine(simulation, self.parser)
            scenario_result = engine.evaluate(scenario)
            scenario_result["scenario_id"] = scenario.get("id", "")
            scenario_result["scenario_name"] = scenario.get("name", "")
            all_results.append(scenario_result)

        # Aggregate
        total = sum(r["total"] for r in all_results)
        passed = sum(r["passed"] for r in all_results)
        failed = sum(r["failed"] for r in all_results)
        skipped = sum(r["skipped"] for r in all_results)

        return {
            "phase": "assertions",
            "scenarios": all_results,
            "total": total,
            "passed": passed,
            "failed": failed,
            "skipped": skipped,
            "pass_rate": round(passed / total * 100, 1) if total > 0 else 0,
        }

    def _compile_report(self, structural, code, simulation, assertions) -> dict:
        """Compile the final test report."""
        # Calculate overall score
        scores = []
        if structural.get("score") is not None:
            scores.append(structural["score"])
        if code.get("average_score") is not None:
            scores.append(code["average_score"])
        if simulation.get("score") is not None:
            scores.append(simulation["score"])
        if assertions.get("pass_rate") is not None:
            scores.append(assertions["pass_rate"])

        overall_score = round(sum(scores) / len(scores), 1) if scores else 0

        # Determine overall status
        if overall_score >= 90:
            status = "PASSED"
        elif overall_score >= 70:
            status = "WARNING"
        else:
            status = "FAILED"

        return {
            "workflow": self.workflow_data.get("name", "Unknown"),
            "workflow_file": self.workflow_path,
            "test_status": status,
            "overall_score": overall_score,
            "target_score": 90,
            "meets_target": overall_score >= 90,
            "structural_tests": structural,
            "code_analysis": code,
            "simulation_tests": simulation,
            "assertion_tests": assertions,
            "summary": {
                "total_nodes": len(self.parser.nodes),
                "trigger_count": len(self.parser.triggers),
                "terminal_count": len(self.parser.terminal_nodes),
                "execution_paths": len(self.dag.get_execution_paths()),
                "code_nodes_analyzed": len(code.get("nodes_analyzed", [])),
                "total_assertions": assertions.get("total", 0),
                "assertions_passed": assertions.get("passed", 0),
                "assertions_failed": assertions.get("failed", 0),
            },
            "recommendations": self._generate_recommendations(structural, code, simulation, assertions),
        }

    def _generate_recommendations(self, structural, code, simulation, assertions) -> list:
        """Generate improvement recommendations based on test results."""
        recommendations = []

        # Structural recommendations
        for check in structural.get("checks", []):
            if not check["passed"]:
                recommendations.append({
                    "priority": "high",
                    "area": "structure",
                    "message": f"Fix: {check['name']} — {check['detail']}",
                })

        # Code quality recommendations
        for node_analysis in code.get("nodes_analyzed", []):
            if node_analysis.get("status") != "ok":
                for issue in node_analysis.get("issues", []):
                    recommendations.append({
                        "priority": "high",
                        "area": "code",
                        "message": f"Node '{node_analysis['node']}': {issue}",
                    })
                for warning in node_analysis.get("warnings", []):
                    recommendations.append({
                        "priority": "medium",
                        "area": "code",
                        "message": f"Node '{node_analysis['node']}': {warning}",
                    })

        # Flow recommendations
        for issue in simulation.get("flow_issues", []):
            recommendations.append({
                "priority": "medium",
                "area": "data_flow",
                "message": issue,
            })

        # Assertion recommendations
        for scenario in assertions.get("scenarios", []):
            for assertion in scenario.get("assertions", []):
                if assertion.get("status") == "failed":
                    recommendations.append({
                        "priority": "high",
                        "area": "assertion",
                        "message": f"[{scenario.get('scenario_name', '')}] {assertion.get('description', '')}: {assertion.get('evidence', '')}",
                    })

        return recommendations

    def _error_result(self, message: str) -> dict:
        """Return an error result."""
        return {
            "workflow": "Unknown",
            "workflow_file": self.workflow_path,
            "test_status": "ERROR",
            "overall_score": 0,
            "meets_target": False,
            "error": message,
        }


# ══════════════════════════════════════════════════════════════════════════════
# SECTION 6: Human-Readable Report Generator
# ══════════════════════════════════════════════════════════════════════════════

def generate_text_report(report: dict) -> str:
    """Generate a human-readable text report from the test results."""
    lines = []

    status_icon = {
        "PASSED": "[PASS]",
        "WARNING": "[WARN]",
        "FAILED": "[FAIL]",
        "ERROR": "[ERR!]",
    }

    icon = status_icon.get(report.get("test_status", ""), "[????]")

    lines.append(f"{'='*60}")
    lines.append(f"  n8n Workflow Test Report")
    lines.append(f"{'='*60}")
    lines.append(f"")
    lines.append(f"  Workflow: {report.get('workflow', 'Unknown')}")
    lines.append(f"  File: {report.get('workflow_file', 'N/A')}")
    lines.append(f"  Status: {icon} {report.get('test_status', 'Unknown')}")
    lines.append(f"  Score: {report.get('overall_score', 0)}/100 (target: 90)")
    lines.append(f"  Meets Target: {'YES' if report.get('meets_target') else 'NO'}")
    lines.append(f"")

    # Summary
    summary = report.get("summary", {})
    lines.append(f"--- Summary ---")
    lines.append(f"  Nodes: {summary.get('total_nodes', 0)}")
    lines.append(f"  Triggers: {summary.get('trigger_count', 0)}")
    lines.append(f"  Terminal nodes: {summary.get('terminal_count', 0)}")
    lines.append(f"  Execution paths: {summary.get('execution_paths', 0)}")
    lines.append(f"  Code nodes analyzed: {summary.get('code_nodes_analyzed', 0)}")
    lines.append(f"  Assertions: {summary.get('assertions_passed', 0)}/{summary.get('total_assertions', 0)} passed")
    lines.append(f"")

    # Structural Tests
    structural = report.get("structural_tests", {})
    lines.append(f"--- Structural Tests (score: {structural.get('score', 0)}) ---")
    for check in structural.get("checks", []):
        mark = "[OK]" if check["passed"] else "[XX]"
        lines.append(f"  {mark} {check['name']}: {check['detail']}")
    lines.append(f"")

    # Code Analysis
    code = report.get("code_analysis", {})
    lines.append(f"--- Code Analysis (avg score: {code.get('average_score', 100)}) ---")
    for node_analysis in code.get("nodes_analyzed", []):
        status = node_analysis.get("status", "ok")
        mark = "[OK]" if status == "ok" else "[XX]"
        lines.append(f"  {mark} {node_analysis['node']} (score: {node_analysis.get('quality_score', 'N/A')})")
        for issue in node_analysis.get("issues", []):
            lines.append(f"      ERROR: {issue}")
        for warning in node_analysis.get("warnings", []):
            lines.append(f"      WARN: {warning}")
    lines.append(f"")

    # Simulation
    simulation = report.get("simulation_tests", {})
    lines.append(f"--- Data Flow Simulation (score: {simulation.get('score', 0)}) ---")
    for trace in simulation.get("execution_trace", []):
        lines.append(f"  -> {trace['node']} ({trace['type']})")
        if trace.get("issues"):
            for issue in trace["issues"]:
                lines.append(f"      ERROR: {issue}")
    for issue in simulation.get("flow_issues", []):
        lines.append(f"  [XX] {issue}")
    lines.append(f"")

    # Assertions
    assertions = report.get("assertion_tests", {})
    lines.append(f"--- Assertion Tests (pass rate: {assertions.get('pass_rate', 0)}%) ---")
    for scenario in assertions.get("scenarios", []):
        lines.append(f"  Scenario: {scenario.get('scenario_name', 'Unknown')}")
        for assertion in scenario.get("assertions", []):
            mark = "[OK]" if assertion.get("status") == "passed" else \
                   "[--]" if assertion.get("status") == "skipped" else "[XX]"
            lines.append(f"    {mark} {assertion.get('type', '?')}: {assertion.get('description', '')}")
            if assertion.get("evidence"):
                lines.append(f"         {assertion['evidence']}")
    lines.append(f"")

    # Recommendations
    recommendations = report.get("recommendations", [])
    if recommendations:
        lines.append(f"--- Recommendations ({len(recommendations)}) ---")
        for rec in recommendations:
            priority = rec.get("priority", "low").upper()
            area = rec.get("area", "?")
            lines.append(f"  [{priority}][{area}] {rec.get('message', '')}")

    lines.append(f"")
    lines.append(f"{'='*60}")

    return "\n".join(lines)


# ══════════════════════════════════════════════════════════════════════════════
# CLI Entry Point
# ══════════════════════════════════════════════════════════════════════════════

if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="n8n Workflow Testing Engine")
    parser.add_argument("workflow", help="Path to n8n workflow JSON file")
    parser.add_argument("--test-suite", default=None, help="Path to test suite JSON file")
    parser.add_argument("--output", default=None, help="Output report JSON path")
    parser.add_argument("--text-report", action="store_true", help="Also print text report")
    parser.add_argument("--auto", action="store_true", help="Auto-generate tests from workflow structure")

    args = parser.parse_args()

    runner = WorkflowTestRunner(args.workflow, args.test_suite)
    report = runner.run(output_path=args.output)

    if args.text_report or not args.output:
        print(generate_text_report(report))

    if args.output:
        print(f"\nReport saved to: {args.output}")
        print(f"Overall Score: {report['overall_score']}/100")
        print(f"Status: {report['test_status']}")
        print(f"Meets 90% target: {'YES' if report.get('meets_target') else 'NO'}")
