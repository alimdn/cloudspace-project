#!/usr/bin/env python3
"""
n8n Workflow Validator & Analyzer
Validates JSON files as n8n workflows and extracts metadata.
"""

import json
import os
import sys
from typing import Optional


# ─── n8n Node Type Database ─────────────────────────────────────────────────

# Common n8n node types with categories
NODE_CATEGORIES = {
    # Triggers
    "n8n-nodes-base.manualTrigger": "trigger",
    "n8n-nodes-base.scheduleTrigger": "trigger",
    "n8n-nodes-base.webhook": "trigger",
    "n8n-nodes-base.emailTrigger": "trigger",
    "n8n-nodes-base.cron": "trigger",
    "n8n-nodes-base.formTrigger": "trigger",
    "n8n-nodes-base.chatTrigger": "trigger",
    
    # Actions - Communication
    "n8n-nodes-base.emailSend": "communication",
    "n8n-nodes-base.slack": "communication",
    "n8n-nodes-base.telegram": "communication",
    "n8n-nodes-base.discord": "communication",
    "n8n-nodes-base.twilio": "communication",
    "n8n-nodes-base.sendGrid": "communication",
    "n8n-nodes-base.microsoftTeams": "communication",
    
    # Actions - Data
    "n8n-nodes-base.httpRequest": "data",
    "n8n-nodes-base.postgres": "data",
    "n8n-nodes-base.mysql": "data",
    "n8n-nodes-base.mongoDb": "data",
    "n8n-nodes-base.redis": "data",
    "n8n-nodes-base.googleSheets": "data",
    "n8n-nodes-base.airtable": "data",
    "n8n-nodes-base.supabase": "data",
    "n8n-nodes-base.notion": "data",
    
    # Actions - AI / LangChain
    "n8n-nodes-langchain.agent": "ai",
    "n8n-nodes-langchain.chainLlm": "ai",
    "n8n-nodes-langchain.chatModel": "ai",
    "n8n-nodes-langchain.embeddings": "ai",
    "n8n-nodes-langchain.vectorStore": "ai",
    "n8n-nodes-langchain.memory": "ai",
    "n8n-nodes-langchain.tool": "ai",
    "n8n-nodes-langchain.textClassifier": "ai",
    "@n8n/n8n-nodes-langchain": "ai",
    
    # Logic & Flow
    "n8n-nodes-base.if": "logic",
    "n8n-nodes-base.switch": "logic",
    "n8n-nodes-base.merge": "logic",
    "n8n-nodes-base.splitInBatches": "logic",
    "n8n-nodes-base.noOp": "logic",
    "n8n-nodes-base.errorTrigger": "logic",
    "n8n-nodes-base.stopAndError": "logic",
    
    # Transform
    "n8n-nodes-base.set": "transform",
    "n8n-nodes-base.code": "transform",
    "n8n-nodes-base.function": "transform",
    "n8n-nodes-base.functionItem": "transform",
    "n8n-nodes-base.crypto": "transform",
    "n8n-nodes-base.dateTime": "transform",
    "n8n-nodes-base.html": "transform",
    "n8n-nodes-base.xml": "transform",
    "n8n-nodes-base.json": "transform",
    "n8n-nodes-base.csv": "transform",
    
    # Utility
    "n8n-nodes-base.wait": "utility",
    "n8n-nodes-base.executeWorkflow": "utility",
    "n8n-nodes-base.stickyNote": "utility",
    
    # File
    "n8n-nodes-base.readBinaryFile": "file",
    "n8n-nodes-base.writeBinaryFile": "file",
    "n8n-nodes-base.moveBinaryData": "file",
    "n8n-nodes-base.compression": "file",
}

# Credential type to service mapping
CREDENTIAL_SERVICES = {
    "openAiApi": {"name": "OpenAI", "url": "https://platform.openai.com/api-keys"},
    "googleApi": {"name": "Google", "url": "https://console.cloud.google.com/apis/credentials"},
    "slackApi": {"name": "Slack", "url": "https://api.slack.com/apps"},
    "telegramApi": {"name": "Telegram", "url": "https://core.telegram.org/bots#botfather"},
    "discordApi": {"name": "Discord", "url": "https://discord.com/developers/applications"},
    "githubApi": {"name": "GitHub", "url": "https://github.com/settings/tokens"},
    "notionApi": {"name": "Notion", "url": "https://www.notion.so/my-integrations"},
    "airtableApi": {"name": "Airtable", "url": "https://airtable.com/account"},
    "twilioApi": {"name": "Twilio", "url": "https://www.twilio.com/console"},
    "sendGridApi": {"name": "SendGrid", "url": "https://app.sendgrid.com/settings/api_keys"},
    "httpBasicAuth": {"name": "HTTP Basic Auth", "url": ""},
    "httpHeaderAuth": {"name": "HTTP Header Auth", "url": ""},
    "oAuth2Api": {"name": "OAuth2", "url": ""},
    "postgres": {"name": "PostgreSQL", "url": ""},
    "mysql": {"name": "MySQL", "url": ""},
    "mongoDb": {"name": "MongoDB", "url": ""},
    "redis": {"name": "Redis", "url": ""},
    "awsApi": {"name": "AWS", "url": "https://console.aws.amazon.com/iam"},
    "azureApi": {"name": "Azure", "url": "https://portal.azure.com"},
    "stripeApi": {"name": "Stripe", "url": "https://dashboard.stripe.com/apikeys"},
    "shopifyApi": {"name": "Shopify", "url": "https://partners.shopify.com"},
    "hubspotApi": {"name": "HubSpot", "url": "https://app.hubspot.com/settings/api-key"},
    "salesforceApi": {"name": "Salesforce", "url": "https://login.salesforce.com"},
    "supabaseApi": {"name": "Supabase", "url": "https://app.supabase.com"},
    "mailgunApi": {"name": "Mailgun", "url": "https://app.mailgun.com"},
    "dropboxApi": {"name": "Dropbox", "url": "https://www.dropbox.com/developers/apps"},
    "googleDriveOAuth2": {"name": "Google Drive", "url": "https://console.cloud.google.com/apis/credentials"},
    "googleSheetsOAuth2": {"name": "Google Sheets", "url": "https://console.cloud.google.com/apis/credentials"},
    "googleCalendarOAuth2": {"name": "Google Calendar", "url": "https://console.cloud.google.com/apis/credentials"},
    "microsoftOutlookOAuth2": {"name": "Microsoft Outlook", "url": "https://portal.azure.com/#blade/Microsoft_AAD_RegisteredApps"},
    "microsoftTeamsOAuth2": {"name": "Microsoft Teams", "url": "https://portal.azure.com/#blade/Microsoft_AAD_RegisteredApps"},
}


# ─── Validation Functions ────────────────────────────────────────────────────

def validate_n8n_workflow(data: dict) -> dict:
    """
    Comprehensive validation of an n8n workflow JSON structure.
    Returns a validation report with issues, warnings, and metadata.
    """
    report = {
        "valid": False,
        "errors": [],
        "warnings": [],
        "metadata": {},
    }
    
    # ── Basic Structure ──
    if not isinstance(data, dict):
        report["errors"].append("Root element must be a JSON object")
        return report
    
    # Must have 'nodes' field
    if "nodes" not in data:
        report["errors"].append("Missing required field: 'nodes'")
        return report
    
    nodes = data.get("nodes", [])
    if not isinstance(nodes, list):
        report["errors"].append("'nodes' field must be an array")
        return report
    
    if len(nodes) == 0:
        report["errors"].append("Workflow has no nodes")
        return report
    
    # ── Validate Each Node ──
    valid_nodes = 0
    node_names = set()
    trigger_nodes = []
    all_node_types = []
    credential_types = set()
    has_position = True
    has_parameters = True
    
    for i, node in enumerate(nodes):
        if not isinstance(node, dict):
            report["warnings"].append(f"Node at index {i} is not an object, skipping")
            continue
        
        # Check required node fields
        name = node.get("name", "")
        ntype = node.get("type", "")
        
        if not name:
            report["warnings"].append(f"Node at index {i} has no name")
        elif name in node_names:
            report["warnings"].append(f"Duplicate node name: '{name}'")
        node_names.add(name)
        
        if not ntype:
            report["errors"].append(f"Node '{name or i}' has no type")
            continue
        
        all_node_types.append(ntype)
        valid_nodes += 1
        
        # Check for n8n node types
        if ntype.startswith("n8n-nodes-base.") or ntype.startswith("n8n-nodes-langchain."):
            pass  # Valid n8n node
        elif ntype.startswith("@"):
            report["warnings"].append(f"Node '{name}' uses community node: {ntype}")
        else:
            report["warnings"].append(f"Node '{name}' uses unknown type: {ntype}")
        
        # Check position
        if "position" not in node:
            has_position = False
        
        # Check parameters
        if "parameters" not in node:
            has_parameters = False
        
        # Detect triggers
        if "Trigger" in ntype or "trigger" in ntype or ntype == "n8n-nodes-base.webhook":
            trigger_nodes.append({"name": name, "type": ntype})
        
        # Extract credentials
        creds = node.get("credentials", {})
        if isinstance(creds, dict):
            for cred_name in creds:
                credential_types.add(cred_name)
    
    if valid_nodes == 0:
        report["errors"].append("No valid nodes found in workflow")
        return report
    
    # ── Check Connections ──
    connections = data.get("connections", {})
    if not connections:
        report["warnings"].append("Workflow has no connections - nodes may not be linked")
    
    # ── Check for Triggers ──
    if not trigger_nodes:
        report["warnings"].append("No trigger nodes found - workflow may not start automatically")
    
    # ── Build Metadata ──
    report["metadata"] = {
        "name": data.get("name", "Untitled Workflow"),
        "active": data.get("active", False),
        "node_count": valid_nodes,
        "total_nodes": len(nodes),
        "connection_count": sum(
            len(targets) if isinstance(targets, list) else 0
            for conn in connections.values()
            for targets in (conn if isinstance(conn, list) else [conn])
        ),
        "trigger_types": trigger_nodes,
        "node_types": list(set(all_node_types)),
        "node_categories": _categorize_nodes(all_node_types),
        "credential_types": list(credential_types),
        "credential_services": [
            CREDENTIAL_SERVICES.get(ct, {"name": ct, "url": ""})
            for ct in credential_types
        ],
        "has_sticky_notes": any(
            n.get("type") == "n8n-nodes-base.stickyNote" for n in nodes
        ),
        "has_error_handler": any(
            "errorTrigger" in n.get("type", "") for n in nodes
        ),
        "tags": data.get("tags", []),
        "settings": data.get("settings", {}),
        "complexity": _estimate_complexity(valid_nodes, connections),
        "quality_score": _calculate_quality_score(valid_nodes, connections, trigger_nodes, report),
    }
    
    report["valid"] = True
    return report


def _categorize_nodes(node_types: list) -> dict:
    """Categorize nodes by function."""
    categories = {}
    for ntype in node_types:
        category = NODE_CATEGORIES.get(ntype, "other")
        categories[category] = categories.get(category, 0) + 1
    return categories


def _estimate_complexity(node_count: int, connections: dict) -> str:
    """Estimate workflow complexity."""
    conn_count = sum(
        len(targets) if isinstance(targets, list) else 0
        for conn in connections.values()
        for targets in (conn if isinstance(conn, list) else [conn])
    )
    
    if node_count <= 5 and conn_count <= 5:
        return "simple"
    elif node_count <= 15 and conn_count <= 20:
        return "moderate"
    elif node_count <= 30 and conn_count <= 50:
        return "complex"
    else:
        return "advanced"


def _calculate_quality_score(nodes: int, connections: dict, triggers: list, report: dict) -> int:
    """
    Calculate a quality score (0-100) for a workflow.
    Higher scores indicate more complete, well-structured workflows.
    """
    score = 50  # Base score
    
    # Has triggers (+10)
    if triggers:
        score += 10
    
    # Has connections (+10)
    if connections:
        score += 10
    
    # Has proper name (+5)
    name = report.get("metadata", {}).get("name", "")
    if name and name != "Untitled Workflow":
        score += 5
    
    # Multiple node types (+5, indicates real workflow vs test)
    node_types = report.get("metadata", {}).get("node_types", [])
    if len(set(node_types)) >= 3:
        score += 5
    
    # Has error handling (+10)
    if report.get("metadata", {}).get("has_error_handler"):
        score += 10
    
    # Penalties
    warnings = len(report.get("warnings", []))
    errors = len(report.get("errors", []))
    
    score -= (warnings * 3)
    score -= (errors * 10)
    
    return max(0, min(100, score))


def validate_file(filepath: str) -> dict:
    """Validate an n8n workflow from a file path."""
    try:
        with open(filepath, "r", encoding="utf-8") as f:
            data = json.load(f)
        return validate_n8n_workflow(data)
    except json.JSONDecodeError as e:
        return {"valid": False, "errors": [f"Invalid JSON: {e}"], "warnings": [], "metadata": {}}
    except FileNotFoundError:
        return {"valid": False, "errors": [f"File not found: {filepath}"], "warnings": [], "metadata": {}}
    except Exception as e:
        return {"valid": False, "errors": [f"Error reading file: {e}"], "warnings": [], "metadata": {}}


def validate_json_string(json_string: str) -> dict:
    """Validate an n8n workflow from a JSON string."""
    try:
        data = json.loads(json_string)
        return validate_n8n_workflow(data)
    except json.JSONDecodeError as e:
        return {"valid": False, "errors": [f"Invalid JSON: {e}"], "warnings": [], "metadata": {}}


def generate_validation_report(results: list) -> str:
    """
    Generate a human-readable validation report for multiple workflows.
    """
    lines = []
    lines.append("# ✅ n8n Workflow Validation Report\n")
    
    valid_count = sum(1 for r in results if r.get("valid"))
    invalid_count = len(results) - valid_count
    
    lines.append(f"**Total:** {len(results)} | **Valid:** {valid_count} | **Invalid:** {invalid_count}\n")
    
    for i, result in enumerate(results):
        name = result.get("metadata", {}).get("name", f"Workflow {i+1}")
        status = "✅ Valid" if result.get("valid") else "❌ Invalid"
        score = result.get("metadata", {}).get("quality_score", 0)
        complexity = result.get("metadata", {}).get("complexity", "?")
        node_count = result.get("metadata", {}).get("node_count", 0)
        
        lines.append(f"\n## {i+1}. {name} — {status}\n")
        lines.append(f"- Quality Score: **{score}/100**")
        lines.append(f"- Complexity: **{complexity}**")
        lines.append(f"- Nodes: **{node_count}**")
        
        if result.get("errors"):
            lines.append(f"\n**Errors:**")
            for err in result["errors"]:
                lines.append(f"- ❌ {err}")
        
        if result.get("warnings"):
            lines.append(f"\n**Warnings:**")
            for warn in result["warnings"]:
                lines.append(f"- ⚠️ {warn}")
        
        # Node categories
        categories = result.get("metadata", {}).get("node_categories", {})
        if categories:
            lines.append(f"\n**Node Categories:**")
            for cat, count in sorted(categories.items()):
                lines.append(f"- {cat}: {count}")
        
        # Credentials needed
        creds = result.get("metadata", {}).get("credential_services", [])
        if creds:
            lines.append(f"\n**Credentials Required:**")
            for cred in creds:
                lines.append(f"- {cred['name']}")
    
    return "\n".join(lines)


# ─── CLI ─────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="n8n Workflow Validator")
    parser.add_argument("files", nargs="+", help="Workflow JSON files to validate")
    parser.add_argument("--report", action="store_true", help="Generate detailed report")
    parser.add_argument("--output", default=None, help="Output file path")
    
    args = parser.parse_args()
    
    results = []
    for filepath in args.files:
        result = validate_file(filepath)
        result["file"] = filepath
        results.append(result)
    
    if args.report:
        report = generate_validation_report(results)
        if args.output:
            with open(args.output, "w", encoding="utf-8") as f:
                f.write(report)
            print(f"Report saved to: {args.output}")
        else:
            print(report)
    else:
        for result in results:
            status = "✅ VALID" if result["valid"] else "❌ INVALID"
            filepath = result["file"]
            name = result.get("metadata", {}).get("name", "?")
            errors = len(result.get("errors", []))
            warnings = len(result.get("warnings", []))
            print(f"{status} {filepath} — {name} (errors: {errors}, warnings: {warnings})")
            
            if result["valid"]:
                meta = result["metadata"]
                print(f"  Nodes: {meta['node_count']} | Complexity: {meta['complexity']} | Score: {meta['quality_score']}/100")
