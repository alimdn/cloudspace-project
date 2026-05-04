---
name: n8n-workflow-hunter
description: >
  Deep search for n8n workflow JSON files across GitHub, n8n.io, npm, and the web.
  Use this skill whenever the user wants to find, discover, search for, or download
  n8n workflows, automation templates, or n8n workflow examples from the internet.
  Also triggers when the user mentions finding n8n workflows with specific licenses
  (MIT, Apache, open source, free), searching for n8n templates by topic (telegram,
  email, AI, slack, etc.), or wants to discover n8n workflows from GitHub repositories.
  Use this skill even if the user doesn't explicitly say "search" — triggers on
  phrases like "find n8n workflows", "where can I get n8n templates", "download n8n
  workflows", "n8n workflow library", "n8n examples", "show me n8n automations",
  "ابحث عن workflows لـ n8n", "n8n قوالب", or any request to discover n8n workflows
  from external sources.
---

# n8n Workflow Hunter — Deep Search Skill

This skill enables deep, multi-source searching for n8n workflow JSON files across the internet. It combines GitHub API search, n8n.io workflow library lookup, npm package search, and web search to find workflows that match the user's needs — with intelligent license filtering and workflow validation.

## When to Use This Skill

Activate this skill when the user wants to:
- Find n8n workflows for a specific purpose (e.g., "telegram bot", "email automation", "AI chatbot")
- Search for n8n workflow templates or examples
- Download n8n workflows from GitHub or other sources
- Find n8n workflows with a specific license (MIT, Apache, open source)
- Discover n8n automation ideas or inspirations
- Get n8n workflows for a particular service integration (Slack, Google, OpenAI, etc.)

## Architecture

```
n8n-workflow-hunter/
├── SKILL.md                          ← You are here (main instructions)
└── scripts/
    ├── n8n_search.py                 ← Deep search orchestration engine
    ├── license_filter.py             ← License classification, scoring & filtering
    └── workflow_validator.py         ← n8n workflow JSON validation & analysis
```

## Search Workflow

Follow this exact sequence when the user requests an n8n workflow search:

### Step 1: Understand the Search Request

Extract from the user's message:
- **Topic/query**: What kind of workflow? (e.g., "telegram bot", "email automation")
- **License preference**: Any specific license? Default: prefer open source (MIT, Apache)
- **Source preference**: GitHub only? All sources? Default: all sources
- **Need content**: Do they want the actual JSON files or just links? Default: links first

If the user doesn't specify a license preference, assume they want **free/open source** workflows and filter accordingly.

### Step 2: Run the Deep Search

Execute the main search script:

```bash
python3 /home/z/my-project/skills/n8n-workflow-hunter/scripts/n8n_search.py \
  "<query>" \
  --sources github_code github_repos n8n_io npm web \
  --license <license_filter> \
  --max-results 50 \
  --fetch-content
```

Parameters:
- `query`: The search topic (required)
- `--sources`: Which sources to search (default: all five)
  - `github_code` — Search GitHub code for n8n workflow JSON files
  - `github_repos` — Search GitHub repositories containing n8n workflows
  - `n8n_io` — Search the official n8n.io workflow library
  - `npm` — Search npm for n8n-related packages
  - `web` — Build optimized web search queries for the z-ai-web-dev-sdk
- `--license`: License filter (optional)
  - `mit` — MIT License only
  - `apache` — Apache 2.0 only
  - `gpl` — GPL licenses
  - `open_source` — All open source licenses (preferred + acceptable tiers)
  - `free` — Same as open_source
- `--fetch-content`: Fetch actual workflow JSON content from GitHub (slower but more thorough)

### Step 3: Run Web Search via SDK

The Python script generates optimized web search queries. Execute each query using the z-ai-web-dev-sdk web_search function to find additional results from the open web:

```javascript
import ZAI from 'z-ai-web-dev-sdk';

const zai = await ZAI.create();
const searchResults = await zai.functions.invoke("web_search", {
  query: "n8n workflow <topic> filetype:json site:github.com",
  num: 10
});
```

Run the web queries from the search results and combine findings with the API results.

### Step 4: Filter and Rank by License

Run the license filter on the results:

```bash
python3 /home/z/my-project/skills/n8n-workflow-hunter/scripts/license_filter.py \
  "<results_json_file>" \
  --min-tier acceptable \
  --report \
  --output /home/z/my-project/download/n8n-hunter/license_report.md
```

License tiers:
- **Preferred** 🟢: MIT, Apache-2.0, GPL, BSD, CC0, Unlicense, ISC — Free for any use
- **Acceptable** 🟡: MPL-2.0, LGPL, CC-BY, AGPL, EPL — Some conditions
- **Restricted** 🔴: CC-BY-NC, Proprietary, Unspecified — Commercial limits

### Step 5: Validate Found Workflows

If workflow JSON content was fetched, validate each one:

```bash
python3 /home/z/my-project/skills/n8n-workflow-hunter/scripts/workflow_validator.py \
  <json_files> \
  --report \
  --output /home/z/my-project/download/n8n-hunter/validation_report.md
```

The validator checks:
- Valid n8n JSON structure (nodes, connections)
- Node types are recognized n8n nodes
- Workflow has trigger nodes
- Connections are properly defined
- No duplicate node names
- Quality score (0-100)

### Step 6: Present Results to User

Organize the search results in a clear, structured format. Present them grouped by license tier and source.

**Result format for each workflow:**

```
🟢 [MIT] Telegram Bot Message Sender
   Source: GitHub (user/repo) | Stars: ⭐ 42
   Nodes: 12 | Connections: 15 | Complexity: moderate
   Quality Score: 82/100
   Triggers: webhook
   Credentials: Telegram API
   URL: https://github.com/user/repo/blob/main/workflow.json
   Download: /home/z/my-project/download/n8n-hunter/workflow.json
```

### Step 7: Optional — Integrate with adam Skill

If the user wants the found workflows documented or annotated, invoke the `adam` skill on the downloaded JSON files. This creates:
- Sticky notes in the workflow
- README documentation
- Renamed workflow files

Say: "Would you like me to analyze and document these workflows using the adam skill?"

## Search Strategies by Topic

Use these optimized search patterns for common topics:

| Topic | GitHub Query Pattern | Web Search Pattern |
|-------|---------------------|-------------------|
| **Telegram** | `"n8n-nodes-base.telegram" filename:json` | `n8n telegram bot workflow json` |
| **Email** | `"n8n-nodes-base.emailSend" OR "emailTrigger" filename:json` | `n8n email automation workflow` |
| **AI/ChatGPT** | `"n8n-nodes-langchain" OR "openAiApi" filename:json` | `n8n AI chatbot workflow langchain` |
| **Slack** | `"n8n-nodes-base.slack" filename:json` | `n8n slack integration workflow` |
| **Database** | `"n8n-nodes-base.postgres" OR "mysql" OR "mongoDb" filename:json` | `n8n database workflow automation` |
| **Google** | `"googleSheets" OR "googleDrive" OR "googleCalendar" filename:json` | `n8n google sheets workflow` |
| **Webhook/API** | `"n8n-nodes-base.webhook" filename:json` | `n8n webhook API workflow` |
| **CRM** | `"hubspotApi" OR "salesforceApi" filename:json` | `n8n CRM integration workflow` |
| **DevOps** | `"githubApi" OR "docker" OR "awsApi" filename:json` | `n8n devops automation workflow` |
| **Data ETL** | `"n8n-nodes-base.postgres" "n8n-nodes-base.merge" filename:json` | `n8n ETL data pipeline workflow` |

## License Quick Reference

When presenting results, always include license information. Use this quick reference:

| License | Tier | Commercial | Modify | Distribute | Copyleft | Score |
|---------|------|-----------|--------|-----------|----------|-------|
| MIT | 🟢 Preferred | ✅ | ✅ | ✅ | No | 100 |
| Apache-2.0 | 🟢 Preferred | ✅ | ✅ | ✅ | No | 98 |
| ISC | 🟢 Preferred | ✅ | ✅ | ✅ | No | 97 |
| BSD-2-Clause | 🟢 Preferred | ✅ | ✅ | ✅ | No | 95 |
| BSD-3-Clause | 🟢 Preferred | ✅ | ✅ | ✅ | No | 93 |
| CC0-1.0 | 🟢 Preferred | ✅ | ✅ | ✅ | No | 100 |
| Unlicense | 🟢 Preferred | ✅ | ✅ | ✅ | No | 100 |
| GPL-3.0 | 🟢 Preferred | ✅ | ✅ | ✅ | Yes | 85 |
| GPL-2.0 | 🟢 Preferred | ✅ | ✅ | ✅ | Yes | 85 |
| MPL-2.0 | 🟡 Acceptable | ✅ | ✅ | ✅ | Weak | 75 |
| LGPL-3.0 | 🟡 Acceptable | ✅ | ✅ | ✅ | Weak | 72 |
| CC-BY-4.0 | 🟡 Acceptable | ✅ | ✅ | ✅ | No | 80 |
| AGPL-3.0 | 🟡 Acceptable | ✅ | ✅ | ✅ | Strong | 60 |
| CC-BY-NC-4.0 | 🔴 Restricted | ❌ | ✅ | ✅ | No | 30 |
| BUSL-1.1 | 🔴 Restricted | ❌ | ❌ | ❌ | No | 20 |
| Unspecified | 🔴 Restricted | ❓ | ❓ | ❓ | ❓ | 40 |

## Output Files

All output files are saved to `/home/z/my-project/download/n8n-hunter/`:

| File | Description |
|------|-------------|
| `search_<query>_<timestamp>.json` | Raw search results with all metadata |
| `license_report.md` | Human-readable license breakdown |
| `validation_report.md` | Workflow validation results |
| `workflow_<name>.json` | Downloaded workflow JSON files |

## Error Handling

- **GitHub rate limit (403)**: The script automatically waits and retries. If persistent, fall back to web search only.
- **Invalid JSON files**: The validator catches and reports these. Skip invalid workflows in results.
- **No results found**: Broaden the search query. Try removing license filter. Suggest related topics.
- **Network errors**: Retry once. If persistent, report to user with what was found so far.
- **Missing license info**: Mark as "Unspecified ⚠️" and rank lower than explicitly licensed workflows.

## Tips for Best Results

1. **Start broad, then narrow**: Search with a general topic first, then filter by license or complexity.
2. **Combine sources**: GitHub finds raw JSON files, n8n.io finds tested templates, npm finds custom nodes.
3. **Validate before importing**: Always run the validator on downloaded workflows before the user imports them into n8n.
4. **License matters**: Many GitHub repos don't specify a license. These are technically "all rights reserved" — flag them clearly.
5. **Star count indicates quality**: On GitHub, repos with more stars usually have better-maintained workflows.
6. **n8n.io workflows**: These are officially tested but may use the n8n Sustainable Use License — check before commercial use.
7. **Community nodes**: Workflows using `@` prefixed node types require installing community packages first — warn the user.
