---
name: n8n-workflow-builder
description: "AI-powered n8n workflow builder with a library of 2,000+ ready-made workflow templates. Use this skill whenever the user wants to create, build, design, or generate an n8n workflow, automation workflow, or any kind of workflow that involves n8n nodes, integrations, triggers, and actions. This includes: creating workflows from scratch, building automation pipelines, connecting APIs and services via n8n, designing workflow architectures, converting business processes to n8n workflows, combining multiple integrations into a single workflow, migrating from Zapier/Make to n8n, and any request involving workflow creation or automation design. Always use this skill when the user mentions 'workflow', 'automation', 'n8n', 'build a flow', 'connect X to Y', 'automate', or asks to create any kind of automated process even if they don't explicitly mention n8n."
---

# n8n Workflow Builder — 2,000+ Template Library

Build production-ready n8n workflows instantly by leveraging our comprehensive library of 2,000+ pre-built workflow templates. This skill analyzes the user's requirements, searches through categorized templates, selects the best matching nodes and integrations, and generates complete n8n workflow JSON ready to import.

## Core Philosophy

This skill works as an intelligent workflow architect. Instead of building every workflow from scratch, it:
1. Understands what the user wants to automate
2. Maps the requirement to our template library (2,000+ patterns across 50+ integrations)
3. Selects and combines the right nodes, triggers, and transformations
4. Generates a complete, importable n8n workflow JSON

## How This Skill Works

### Step 1: Understand the Request

When a user asks to create a workflow, extract these key elements:
- **Trigger**: What starts the workflow? (webhook, schedule, app event, form, manual)
- **Actions**: What should happen? (send email, update database, call API, transform data)
- **Integrations**: Which services are involved? (Gmail, Slack, Shopify, etc.)
- **Data Flow**: What data moves between steps? (fields, formats, transformations)
- **Conditions**: Are there branching paths? (if/else, routing, filters)
- **Error Handling**: What happens on failure? (retry, notify, fallback)

### Step 2: Search the Template Library

Read the template catalog from `references/template-catalog.md` to find matching workflows. The catalog is organized by:
- **Integration category** (Email, CRM, E-commerce, Communication, etc.)
- **Workflow pattern** (Trigger → Action, Multi-step, Batch, etc.)
- **Use case** (Lead capture, Order processing, Notification, etc.)

Each template entry includes: the integration name, node types used, a description of what it does, and the pattern it follows.

### Step 3: Select Nodes & Build Connections

For each selected template, look up the exact node configurations in:
- `references/nodes-reference.md` — Detailed node parameter specifications for 400+ n8n node types
- `references/integrations-guide.md` — Integration-specific setup, credentials, and common patterns

### Step 4: Generate Workflow JSON

Use the `scripts/build_workflow.py` script to assemble the final workflow JSON. The script takes a workflow specification and produces a complete n8n-importable JSON file.

```bash
python3 /home/z/my-project/skills/n8n-workflow-builder/scripts/build_workflow.py \
  --name "My Workflow" \
  --spec '{"trigger": "webhook", "actions": ["gmail_send", "sheets_append"], "connections": {"webhook": "gmail_send", "gmail_send": "sheets_append"}}' \
  --output /home/z/my-project/download/workflow.json
```

Or alternatively, build the JSON manually following the n8n workflow schema described below.

## n8n Workflow JSON Schema

Every n8n workflow follows this structure:

```json
{
  "name": "Workflow Name",
  "nodes": [
    {
      "parameters": { ... },
      "type": "n8n-nodes-base.nodeType",
      "typeVersion": 1,
      "position": [X, Y],
      "name": "Node Display Name",
      "credentials": { "credentialType": { "id": "credId", "name": "credName" } }
    }
  ],
  "connections": {
    "Source Node Name": {
      "main": [
        [
          {
            "node": "Target Node Name",
            "type": "main",
            "index": 0
          }
        ]
      ]
    }
  },
  "settings": { "executionOrder": "v1" },
  "staticData": null,
  "pinData": {},
  "tags": []
}
```

## Quick Reference: Positioning Nodes

When building workflows, nodes should be positioned in a grid pattern:
- Horizontal spacing: 250px between connected nodes
- Vertical spacing: 200px for branches
- Starting position: [250, 300]
- Each subsequent node: [previous_x + 250, same_y]
- Branch (IF node): True path goes up (-200y), False path goes down (+200y)

## Workflow Delivery Process

After generating a workflow:

1. **Save the JSON** to `/home/z/my-project/download/[workflow-name].json`
2. **Provide a summary** explaining:
   - What the workflow does
   - What credentials/API keys the user needs to configure
   - How to import it (n8n → Menu → Import → Upload JSON)
   - How to test it
3. **Include a visual description** of the flow (text-based diagram)

Example flow description:
```
[Webhook: Receive Data] → [Set: Transform Fields] → [IF: Check Priority]
  ├── True: [Gmail: Send High Priority Email]
  └── False: [Slack: Send Normal Notification]
```

## Handling Complex Requests

For complex multi-integration workflows:
1. Break the request into sub-flows
2. Find matching templates for each sub-flow
3. Combine them using Merge nodes or Execute Workflow nodes
4. Add error handling (Error Trigger → notification)
5. Add data transformation (Set/Code nodes) between incompatible integrations

## Template Library Access

The complete template catalog with 2,000+ templates is in `references/template-catalog.md`. Read this file when you need to search for matching templates. The catalog is indexed by:

- **50+ Integration categories** covering all major n8n nodes
- **20+ Workflow patterns** from simple trigger→action to complex multi-step pipelines
- **100+ Business use cases** from lead management to order processing
- **Node-level specifications** in `references/nodes-reference.md`

## Important Notes

- Always ask the user for their n8n instance URL and API key if they want direct import
- Credentials are NEVER included in generated workflows — the user must configure them
- All generated workflows use the latest n8n node type versions
- Webhook URLs are placeholder values the user must update
- Include comments/documentation in the workflow JSON where helpful
