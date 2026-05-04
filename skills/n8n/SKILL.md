---
name: n8n
description: "Integrate with n8n workflow automation platform. Use this skill whenever the user mentions n8n, workflow automation, wants to trigger workflows, list workflows, execute automation tasks, or connect to n8n instance. This includes: triggering webhook workflows, listing/managing n8n workflows, checking execution status, sending data through n8n pipelines, and any n8n-related operations. Always use this skill when the user says 'n8n', 'workflow', or 'automation' in context of n8n."
---

# n8n Integration Skill

This skill enables the agent to interact with a local n8n instance, allowing workflow management, execution, and monitoring directly from the chat.

## Overview

n8n is a workflow automation tool. This skill connects the agent to n8n via its REST API, enabling:

- Listing and managing workflows
- Triggering workflows via webhooks
- Checking execution status and history
- Creating new workflows programmatically

## Configuration

Before using this skill, verify or ask the user for:

1. **n8n Base URL** — Default: `http://localhost:5678`
2. **API Key** — Required for API authentication. The user should generate this in n8n under Settings > API > API Keys

**IMPORTANT**: Never hardcode API keys. Always ask the user for the API key and use it as a parameter in commands.

## CLI Tool (Primary Method)

The easiest way to interact with n8n is through the bundled bash script. This script handles authentication and provides a clean interface.

### Basic Usage

```bash
# Source the script to load helper functions
source /home/z/my-project/skills/n8n/scripts/n8n_client.sh
```

### Available Commands

#### 1. List All Workflows

```bash
source /home/z/my-project/skills/n8n/scripts/n8n_client.sh
n8n_list_workflows "http://localhost:5678" "<API_KEY>"
```

This returns a table of all workflows with their IDs, names, active status, and tags.

#### 2. Get a Specific Workflow

```bash
source /home/z/my-project/skills/n8n/scripts/n8n_client.sh
n8n_get_workflow "http://localhost:5678" "<API_KEY>" "<WORKFLOW_ID>"
```

#### 3. Execute a Workflow (via Webhook)

```bash
source /home/z/my-project/skills/n8n/scripts/n8n_client.sh
n8n_trigger_webhook "http://localhost:5678" "<WEBHOOK_PATH>" '<JSON_DATA>'
```

Example:
```bash
n8n_trigger_webhook "http://localhost:5678" "/webhook/send-email" '{"to": "user@example.com", "subject": "Hello", "body": "Test message"}'
```

#### 4. Execute a Workflow by ID

```bash
source /home/z/my-project/skills/n8n/scripts/n8n_client.sh
n8n_execute_workflow "http://localhost:5678" "<API_KEY>" "<WORKFLOW_ID>" '<JSON_DATA>'
```

#### 5. Check Execution Status

```bash
source /home/z/my-project/skills/n8n/scripts/n8n_client.sh
n8n_get_execution "http://localhost:5678" "<API_KEY>" "<EXECUTION_ID>"
```

#### 6. List Recent Executions

```bash
source /home/z/my-project/skills/n8n/scripts/n8n_client.sh
n8n_list_executions "http://localhost:5678" "<API_KEY>"
```

#### 7. Activate / Deactivate a Workflow

```bash
# Activate
source /home/z/my-project/skills/n8n/scripts/n8n_client.sh
n8n_toggle_workflow "http://localhost:5678" "<API_KEY>" "<WORKFLOW_ID>" "activate"

# Deactivate
n8n_toggle_workflow "http://localhost:5678" "<API_KEY>" "<WORKFLOW_ID>" "deactivate"
```

#### 8. Delete a Workflow

```bash
source /home/z/my-project/skills/n8n/scripts/n8n_client.sh
n8n_delete_workflow "http://localhost:5678" "<API_KEY>" "<WORKFLOW_ID>"
```

#### 9. Create a New Workflow

```bash
source /home/z/my-project/skills/n8n/scripts/n8n_client.sh
n8n_create_workflow "http://localhost:5678" "<API_KEY>" '<WORKFLOW_JSON>'
```

Example:
```bash
n8n_create_workflow "http://localhost:5678" "<API_KEY>" '{
  "name": "My New Workflow",
  "nodes": [
    {
      "parameters": {},
      "type": "n8n-nodes-base.manualTrigger",
      "typeVersion": 1,
      "position": [250, 300]
    }
  ],
  "connections": {}
}'
```

## Direct API Usage (Without Script)

If you prefer to call the n8n API directly using curl, here are the endpoints:

### Authentication

All API requests require the `X-N8N-API-KEY` header:

```bash
curl -H "X-N8N-API-KEY: <API_KEY>" "http://localhost:5678/api/v1/workflows"
```

### API Endpoints Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/workflows` | List all workflows |
| GET | `/api/v1/workflows/:id` | Get specific workflow |
| POST | `/api/v1/workflows` | Create a workflow |
| PUT | `/api/v1/workflows/:id` | Update a workflow |
| DELETE | `/api/v1/workflows/:id` | Delete a workflow |
| POST | `/api/v1/workflows/:id/activate` | Activate a workflow |
| POST | `/api/v1/workflows/:id/deactivate` | Deactivate a workflow |
| GET | `/api/v1/executions` | List executions |
| GET | `/api/v1/executions/:id` | Get specific execution |
| POST | `/webhook/:path` | Trigger a webhook (no API key needed if webhook is public) |
| POST | `/webhook/:path` | Trigger a webhook (with API key for production mode) |

## Workflow Patterns

### Pattern 1: Trigger and Wait

When you need to trigger a workflow and get the result:

1. Trigger the workflow via webhook or API
2. Note the execution ID from the response
3. Poll the execution status until it completes
4. Return the final output to the user

```bash
# Step 1: Trigger
source /home/z/my-project/skills/n8n/scripts/n8n_client.sh
RESULT=$(n8n_execute_workflow "http://localhost:5678" "<API_KEY>" "123" '{"input": "data"}')

# Step 2: Extract execution ID and check status
EXEC_ID=$(echo "$RESULT" | jq -r '.id')
n8n_get_execution "http://localhost:5678" "<API_KEY>" "$EXEC_ID"
```

### Pattern 2: Fire and Forget

When you just need to trigger a workflow without waiting:

```bash
source /home/z/my-project/skills/n8n/scripts/n8n_client.sh
n8n_trigger_webhook "http://localhost:5678" "/webhook/my-hook" '{"action": "notify"}'
```

### Pattern 3: List and Choose

When the user wants to work with workflows but doesn't know the ID:

```bash
# List all workflows first
source /home/z/my-project/skills/n8n/scripts/n8n_client.sh
n8n_list_workflows "http://localhost:5678" "<API_KEY>"
# Then use the workflow ID for further operations
```

## Common Use Cases

1. **Email Automation**: Trigger workflows to send emails via n8n
2. **Database Operations**: Execute workflows that read/write to databases
3. **Notification Systems**: Send notifications through Slack, WhatsApp, Telegram, etc.
4. **Data Processing**: Run data transformation pipelines
5. **API Integration**: Connect to external services through n8n workflows
6. **Scheduled Tasks**: Check status of scheduled/cron workflow executions
7. **File Operations**: Workflows that handle file uploads, downloads, or processing

## Error Handling

- If the connection fails, verify n8n is running: `curl http://localhost:5678/healthz`
- If authentication fails (401), check that the API key is correct
- If a workflow execution fails (4xx/5xx), check the execution details for error messages
- If webhook returns 404, verify the webhook path is correct and the workflow is active

## Best Practices

1. Always ask for the API key if not already provided — never guess or use placeholder values
2. Use the provided bash script for cleaner and more reliable interactions
3. When listing workflows, present results in a clear table format for easy reading
4. Confirm destructive actions (delete, deactivate) with the user before executing
5. Handle timeouts gracefully — some workflows may take time to execute
6. Use jq to parse JSON responses when working with raw curl output

## Important Notes

- This skill works with n8n instances accessible via HTTP — the default is localhost:5678
- The API key is essential for most operations (except public webhooks in development mode)
- Webhook endpoints do NOT require an API key in n8n development/test mode
- In n8n production mode, webhook endpoints also require the API key
