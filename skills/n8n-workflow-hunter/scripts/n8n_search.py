#!/usr/bin/env python3
"""
n8n Workflow Deep Search Engine
Searches GitHub, n8n.io, npm, and the web for n8n workflow JSON files.
Filters by license, quality, and relevance.
"""

import json
import os
import re
import sys
import time
import urllib.request
import urllib.parse
import urllib.error
from typing import Optional


# ─── Configuration ───────────────────────────────────────────────────────────

GITHUB_API = "https://api.github.com"
N8N_WORKFLOWS_URL = "https://n8n.io/workflows"
NPM_API = "https://registry.npmjs.org"
OUTPUT_DIR = os.environ.get("N8N_HUNTER_OUTPUT", "/home/z/my-project/download/n8n-hunter")

# n8n workflow JSON structure markers
N8N_MARKERS = [
    "n8n-nodes-base",
    "n8n-nodes-langchain",
    '"nodes"',
    '"connections"',
    '"settings"',
    '"active"',
    '"pinData"',
]


# ─── GitHub Search ───────────────────────────────────────────────────────────

def search_github_code(query: str, max_pages: int = 3, per_page: int = 30) -> list:
    """
    Search GitHub code for n8n workflow JSON files.
    Uses GitHub REST API /search/code endpoint.
    No token needed for basic searches (60 req/hr limit).
    """
    results = []
    # Build a query that targets n8n workflow files
    n8n_query = f'{query} "n8n-nodes-base" filename:json path:workflow'
    
    for page in range(1, max_pages + 1):
        params = urllib.parse.urlencode({
            "q": n8n_query,
            "per_page": per_page,
            "page": page,
            "sort": "indexed",
        })
        url = f"{GITHUB_API}/search/code?{params}"
        
        req = urllib.request.Request(url, headers={
            "Accept": "application/vnd.github.v3+json",
            "User-Agent": "n8n-workflow-hunter",
        })
        
        try:
            with urllib.request.urlopen(req, timeout=15) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                items = data.get("items", [])
                if not items:
                    break
                for item in items:
                    results.append({
                        "source": "github",
                        "name": item.get("name", ""),
                        "path": item.get("path", ""),
                        "url": item.get("html_url", ""),
                        "repository": item.get("repository", {}).get("full_name", ""),
                        "repo_url": item.get("repository", {}).get("html_url", ""),
                        "description": item.get("repository", {}).get("description", ""),
                        "score": item.get("score", 0),
                    })
                # Respect rate limits
                remaining = resp.headers.get("X-RateLimit-Remaining", "60")
                if int(remaining) < 5:
                    print(f"  [GitHub] Rate limit approaching: {remaining} remaining. Stopping.")
                    break
                time.sleep(2)  # Be nice to the API
        except urllib.error.HTTPError as e:
            if e.code == 403:
                print(f"  [GitHub] Rate limited. Waiting 60s...")
                time.sleep(60)
                continue
            print(f"  [GitHub] HTTP Error {e.code}: {e.reason}")
            break
        except Exception as e:
            print(f"  [GitHub] Error: {e}")
            break
    
    return results


def search_github_repos(query: str, max_pages: int = 2, per_page: int = 20) -> list:
    """
    Search GitHub repositories that contain n8n workflows.
    Uses GitHub REST API /search/repositories endpoint.
    """
    results = []
    n8n_query = f'{query} n8n workflow automation'
    
    for page in range(1, max_pages + 1):
        params = urllib.parse.urlencode({
            "q": n8n_query,
            "per_page": per_page,
            "page": page,
            "sort": "stars",
            "order": "desc",
        })
        url = f"{GITHUB_API}/search/repositories?{params}"
        
        req = urllib.request.Request(url, headers={
            "Accept": "application/vnd.github.v3+json",
            "User-Agent": "n8n-workflow-hunter",
        })
        
        try:
            with urllib.request.urlopen(req, timeout=15) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                items = data.get("items", [])
                if not items:
                    break
                for item in items:
                    license_info = item.get("license", {}) or {}
                    results.append({
                        "source": "github_repo",
                        "name": item.get("name", ""),
                        "full_name": item.get("full_name", ""),
                        "url": item.get("html_url", ""),
                        "description": item.get("description", ""),
                        "stars": item.get("stargazers_count", 0),
                        "forks": item.get("forks_count", 0),
                        "license": license_info.get("spdx_id", "NOASSERTION") if license_info else "NOASSERTION",
                        "license_name": license_info.get("name", "Not specified") if license_info else "Not specified",
                        "language": item.get("language", ""),
                        "topics": item.get("topics", []),
                        "updated_at": item.get("updated_at", ""),
                    })
                time.sleep(2)
        except Exception as e:
            print(f"  [GitHub Repos] Error: {e}")
            break
    
    return results


def get_github_repo_license(repo_full_name: str) -> dict:
    """
    Get the license of a GitHub repository.
    """
    url = f"{GITHUB_API}/repos/{repo_full_name}/license"
    req = urllib.request.Request(url, headers={
        "Accept": "application/vnd.github.v3+json",
        "User-Agent": "n8n-workflow-hunter",
    })
    
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            return {
                "spdx_id": data.get("license", {}).get("spdx_id", "NOASSERTION"),
                "name": data.get("license", {}).get("name", "Not specified"),
                "url": data.get("html_url", ""),
            }
    except:
        return {"spdx_id": "NOASSERTION", "name": "Not specified", "url": ""}


def fetch_github_file_content(repo_full_name: str, file_path: str) -> Optional[dict]:
    """
    Fetch raw content of a file from GitHub and parse as n8n workflow JSON.
    """
    url = f"https://raw.githubusercontent.com/{repo_full_name}/HEAD/{file_path}"
    
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "n8n-workflow-hunter"})
        with urllib.request.urlopen(req, timeout=15) as resp:
            content = resp.read().decode("utf-8")
            return json.loads(content)
    except json.JSONDecodeError:
        return None
    except Exception as e:
        print(f"  [GitHub Content] Error fetching {file_path}: {e}")
        return None


# ─── n8n.io Workflows Search ────────────────────────────────────────────────

def search_n8n_io(query: str) -> list:
    """
    Search n8n.io/workflows library.
    Since there's no official public API, we search via web and parse results.
    Returns structured data about found workflows.
    """
    # n8n.io workflow pages follow a pattern
    # We'll search the web for n8n.io/workflows pages matching the query
    # The actual scraping is done through the web_search SDK in the skill
    
    results = []
    search_url = f"https://n8n.io/workflows/?search={urllib.parse.quote(query)}"
    
    results.append({
        "source": "n8n_io",
        "name": f"n8n.io workflow search: {query}",
        "url": search_url,
        "description": f"Search results from the official n8n workflow library for '{query}'",
        "license": "Fair-code (n8n Sustainable Use License)",
        "license_tier": "acceptable",
        "note": "Official n8n workflows are under Sustainable Use License - free for most uses but check terms",
    })
    
    return results


# ─── npm Search ──────────────────────────────────────────────────────────────

def search_npm(query: str, limit: int = 20) -> list:
    """
    Search npm for n8n-related packages (custom nodes, workflow collections).
    """
    results = []
    npm_query = f"n8n {query}"
    url = f"https://registry.npmjs.org/-/v1/search?text={urllib.parse.quote(npm_query)}&size={limit}"
    
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "n8n-workflow-hunter"})
        with urllib.request.urlopen(req, timeout=15) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            for item in data.get("objects", []):
                pkg = item.get("package", {})
                results.append({
                    "source": "npm",
                    "name": pkg.get("name", ""),
                    "version": pkg.get("version", ""),
                    "url": pkg.get("links", {}).get("npm", ""),
                    "repo_url": pkg.get("links", {}).get("repository", ""),
                    "description": pkg.get("description", ""),
                    "license": pkg.get("license", "Not specified"),
                    "author": pkg.get("author", {}).get("name", "") if isinstance(pkg.get("author"), dict) else str(pkg.get("author", "")),
                    "keywords": pkg.get("keywords", []),
                    "date": pkg.get("date", ""),
                    "score": item.get("score", {}).get("detail", {}).get("popularity", 0),
                })
    except Exception as e:
        print(f"  [npm] Error: {e}")
    
    return results


# ─── Web Search Queries Builder ─────────────────────────────────────────────

def build_web_search_queries(query: str, license_filter: str = None) -> list:
    """
    Build optimized web search queries for finding n8n workflows.
    Returns a list of query strings for the web_search SDK function.
    """
    queries = []
    
    # Primary search - n8n workflows
    queries.append(f'n8n workflow {query} filetype:json site:github.com')
    
    # Search for n8n workflow templates
    queries.append(f'n8n workflow template {query} site:n8n.io')
    
    # Search for n8n workflow examples
    queries.append(f'n8n automation workflow {query} example json')
    
    # Search in community forums
    queries.append(f'n8n workflow {query} site:community.n8n.io')
    
    # Search for shared workflows
    queries.append(f'share n8n workflow {query} json download')
    
    # License-specific searches
    if license_filter:
        license_map = {
            "mit": "license:mit",
            "apache": "license:apache",
            "gpl": "license:gpl",
            "open_source": "open source license",
            "free": "free license OR open source OR MIT OR Apache",
        }
        license_term = license_map.get(license_filter.lower(), license_filter)
        queries.append(f'n8n workflow {query} {license_term} site:github.com')
    
    return queries


# ─── Main Search Orchestration ───────────────────────────────────────────────

def deep_search(
    query: str,
    sources: list = None,
    license_filter: str = None,
    max_results: int = 50,
    fetch_content: bool = False,
) -> dict:
    """
    Perform a deep search for n8n workflows across multiple sources.
    
    Args:
        query: Search query (e.g., "telegram bot", "email automation")
        sources: List of sources to search. Default: all
            Options: "github_code", "github_repos", "n8n_io", "npm", "web"
        license_filter: Filter by license type
            Options: "mit", "apache", "gpl", "open_source", "free", None (all)
        max_results: Maximum number of results per source
        fetch_content: Whether to fetch full JSON content of found workflows
    
    Returns:
        Dict with search results, metadata, and license-filtered output.
    """
    if sources is None:
        sources = ["github_code", "github_repos", "n8n_io", "npm", "web"]
    
    all_results = {
        "query": query,
        "license_filter": license_filter,
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "sources_searched": [],
        "results": {
            "github_code": [],
            "github_repos": [],
            "n8n_io": [],
            "npm": [],
            "web_queries": [],
        },
        "summary": {
            "total_found": 0,
            "by_license_tier": {"preferred": 0, "acceptable": 0, "restricted": 0, "unknown": 0},
            "by_source": {},
        },
    }
    
    # ── GitHub Code Search ──
    if "github_code" in sources:
        print(f"[1/5] Searching GitHub code for: {query}")
        github_code_results = search_github_code(query)
        all_results["results"]["github_code"] = github_code_results
        all_results["sources_searched"].append("github_code")
        print(f"  Found {len(github_code_results)} code results")
        
        # Fetch license for each result's repository
        seen_repos = set()
        for result in github_code_results:
            repo = result.get("repository", "")
            if repo and repo not in seen_repos:
                seen_repos.add(repo)
                license_info = get_github_repo_license(repo)
                result["license"] = license_info.get("spdx_id", "NOASSERTION")
                result["license_name"] = license_info.get("name", "Not specified")
                result["license_tier"] = classify_license(license_info.get("spdx_id", "NOASSERTION"))
    
    # ── GitHub Repo Search ──
    if "github_repos" in sources:
        print(f"[2/5] Searching GitHub repositories for: {query}")
        github_repo_results = search_github_repos(query)
        all_results["results"]["github_repos"] = github_repo_results
        all_results["sources_searched"].append("github_repos")
        print(f"  Found {len(github_repo_results)} repository results")
        
        # Classify licenses
        for result in github_repo_results:
            result["license_tier"] = classify_license(result.get("license", "NOASSERTION"))
    
    # ── n8n.io Search ──
    if "n8n_io" in sources:
        print(f"[3/5] Searching n8n.io workflow library for: {query}")
        n8n_results = search_n8n_io(query)
        all_results["results"]["n8n_io"] = n8n_results
        all_results["sources_searched"].append("n8n_io")
        print(f"  Found {len(n8n_results)} n8n.io results")
    
    # ── npm Search ──
    if "npm" in sources:
        print(f"[4/5] Searching npm for n8n packages: {query}")
        npm_results = search_npm(query, limit=max_results)
        all_results["results"]["npm"] = npm_results
        all_results["sources_searched"].append("npm")
        print(f"  Found {len(npm_results)} npm results")
        
        # Classify licenses
        for result in npm_results:
            result["license_tier"] = classify_license(result.get("license", "Not specified"))
    
    # ── Web Search Queries ──
    if "web" in sources:
        print(f"[5/5] Building web search queries for: {query}")
        web_queries = build_web_search_queries(query, license_filter)
        all_results["results"]["web_queries"] = web_queries
        all_results["sources_searched"].append("web")
        print(f"  Built {len(web_queries)} web search queries")
    
    # ── Fetch Content (optional) ──
    if fetch_content and all_results["results"]["github_code"]:
        print(f"\n[Extra] Fetching workflow JSON content...")
        fetched = 0
        for result in all_results["results"]["github_code"][:10]:  # Limit to 10
            repo = result.get("repository", "")
            path = result.get("path", "")
            if repo and path:
                content = fetch_github_file_content(repo, path)
                if content and is_valid_n8n_workflow(content):
                    result["workflow_content"] = content
                    result["workflow_valid"] = True
                    result["node_count"] = len(content.get("nodes", []))
                    result["connection_count"] = sum(
                        len(v) for v in content.get("connections", {}).values()
                    )
                    fetched += 1
                else:
                    result["workflow_valid"] = False
        print(f"  Fetched and validated {fetched} workflow files")
    
    # ── Apply License Filter ──
    if license_filter:
        all_results = apply_license_filter(all_results, license_filter)
    
    # ── Build Summary ──
    total = 0
    for source_name, source_results in all_results["results"].items():
        if isinstance(source_results, list):
            count = len(source_results)
            total += count
            all_results["summary"]["by_source"][source_name] = count
            for r in source_results:
                tier = r.get("license_tier", "unknown")
                all_results["summary"]["by_license_tier"][tier] = \
                    all_results["summary"]["by_license_tier"].get(tier, 0) + 1
    
    all_results["summary"]["total_found"] = total
    
    # ── Save Results ──
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    safe_query = re.sub(r'[^\w\s-]', '', query).strip().replace(' ', '_')[:50]
    output_file = os.path.join(OUTPUT_DIR, f"search_{safe_query}_{int(time.time())}.json")
    
    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(all_results, f, ensure_ascii=False, indent=2)
    
    print(f"\n✅ Results saved to: {output_file}")
    print(f"📊 Total found: {total}")
    
    return all_results


# ─── License Classification ─────────────────────────────────────────────────

def classify_license(license_id: str) -> str:
    """
    Classify a license SPDX ID into a tier.
    Returns: "preferred", "acceptable", "restricted", or "unknown"
    """
    license_id = (license_id or "").strip().upper()
    
    PREFERRED = {
        "MIT", "Apache-2.0", "Apache-2.0-ONLY", "Apache-2.0-OR-LATER",
        "GPL-2.0", "GPL-2.0-ONLY", "GPL-2.0-OR-LATER",
        "GPL-3.0", "GPL-3.0-ONLY", "GPL-3.0-OR-LATER",
        "BSD-2-Clause", "BSD-3-Clause", "0BSD",
        "CC0-1.0", "Unlicense", "ISC",
    }
    
    ACCEPTABLE = {
        "MPL-2.0", "MPL-2.0-NO-COPYLEFT-EXCEPTION",
        "LGPL-2.0", "LGPL-2.1", "LGPL-3.0",
        "LGPL-2.0-ONLY", "LGPL-2.1-ONLY", "LGPL-3.0-ONLY",
        "LGPL-2.0-OR-LATER", "LGPL-2.1-OR-LATER", "LGPL-3.0-OR-LATER",
        "CC-BY-4.0", "CC-BY-3.0", "CC-BY-2.5", "CC-BY-2.0",
        "CC-BY-SA-4.0", "CC-BY-SA-3.0",
        "EPL-1.0", "EPL-2.0",
        "AGPL-3.0", "AGPL-3.0-ONLY", "AGPL-3.0-OR-LATER",
    }
    
    RESTRICTED = {
        "CC-BY-NC-4.0", "CC-BY-NC-3.0", "CC-BY-NC-2.5", "CC-BY-NC-2.0",
        "CC-BY-NC-SA-4.0", "CC-BY-NC-SA-3.0",
        "CC-BY-NC-ND-4.0", "CC-BY-NC-ND-3.0",
        "BUSL-1.1", "BSL-1.1",
        "NOASSERTION",  # Proprietary or unspecified
    }
    
    if license_id in PREFERRED:
        return "preferred"
    elif license_id in ACCEPTABLE:
        return "acceptable"
    elif license_id in RESTRICTED:
        return "restricted"
    else:
        return "unknown"


def apply_license_filter(results: dict, license_filter: str) -> dict:
    """
    Filter search results by license tier.
    """
    tier_map = {
        "mit": ["preferred"],
        "apache": ["preferred"],
        "gpl": ["preferred"],
        "open_source": ["preferred", "acceptable"],
        "free": ["preferred", "acceptable"],
    }
    
    allowed_tiers = tier_map.get(license_filter.lower(), ["preferred", "acceptable"])
    
    for source_name, source_results in results["results"].items():
        if isinstance(source_results, list):
            filtered = []
            for r in source_results:
                tier = r.get("license_tier", "unknown")
                if tier in allowed_tiers:
                    filtered.append(r)
            results["results"][source_name] = filtered
    
    return results


# ─── n8n Workflow Validation ────────────────────────────────────────────────

def is_valid_n8n_workflow(data: dict) -> bool:
    """
    Validate that a JSON object is a valid n8n workflow.
    Checks for required fields and structure.
    """
    if not isinstance(data, dict):
        return False
    
    # Must have 'nodes' field
    if "nodes" not in data:
        return False
    
    nodes = data.get("nodes", [])
    if not isinstance(nodes, list) or len(nodes) == 0:
        return False
    
    # At least one node should have n8n-specific type
    n8n_node_types = {"n8n-nodes-base.", "n8n-nodes-langchain."}
    has_n8n_node = False
    for node in nodes:
        node_type = node.get("type", "")
        if any(node_type.startswith(prefix) for prefix in n8n_node_types):
            has_n8n_node = True
            break
    
    # Check for connections field (may be empty for simple workflows)
    has_connections = "connections" in data
    
    return has_n8n_node or has_connections


def analyze_workflow(data: dict) -> dict:
    """
    Analyze an n8n workflow and return metadata.
    """
    if not is_valid_n8n_workflow(data):
        return {"valid": False}
    
    nodes = data.get("nodes", [])
    connections = data.get("connections", {})
    
    # Extract node types
    node_types = {}
    trigger_types = []
    credential_types = set()
    
    for node in nodes:
        ntype = node.get("type", "unknown")
        node_types[ntype] = node_types.get(ntype, 0) + 1
        
        # Detect triggers
        if "Trigger" in ntype or "trigger" in ntype:
            trigger_types.append(ntype)
        
        # Extract credentials
        creds = node.get("credentials", {})
        for cred_name in creds:
            credential_types.add(cred_name)
    
    return {
        "valid": True,
        "name": data.get("name", "Untitled"),
        "active": data.get("active", False),
        "node_count": len(nodes),
        "connection_count": sum(len(v) for v in connections.values()),
        "node_types": node_types,
        "trigger_types": trigger_types,
        "credential_types": list(credential_types),
        "has_webhook": any("webhook" in t.lower() for t in trigger_types),
        "has_schedule": any("schedule" in t.lower() for t in trigger_types),
        "tags": data.get("tags", []),
        "settings": data.get("settings", {}),
        "complexity": _estimate_complexity(nodes, connections),
    }


def _estimate_complexity(nodes: list, connections: dict) -> str:
    """Estimate workflow complexity level."""
    node_count = len(nodes)
    conn_count = sum(len(v) for v in connections.values())
    
    if node_count <= 5 and conn_count <= 5:
        return "simple"
    elif node_count <= 15 and conn_count <= 20:
        return "moderate"
    else:
        return "complex"


# ─── CLI Entry Point ────────────────────────────────────────────────────────

if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="n8n Workflow Deep Search Hunter")
    parser.add_argument("query", help="Search query (e.g., 'telegram bot', 'email automation')")
    parser.add_argument("--sources", nargs="+", default=["github_code", "github_repos", "n8n_io", "npm", "web"],
                        choices=["github_code", "github_repos", "n8n_io", "npm", "web"],
                        help="Sources to search")
    parser.add_argument("--license", dest="license_filter", default=None,
                        choices=["mit", "apache", "gpl", "open_source", "free"],
                        help="Filter by license type")
    parser.add_argument("--max-results", type=int, default=50, help="Max results per source")
    parser.add_argument("--fetch-content", action="store_true", help="Fetch full workflow JSON content")
    parser.add_argument("--output", default=None, help="Output file path")
    
    args = parser.parse_args()
    
    if args.output:
        os.makedirs(os.path.dirname(args.output) or ".", exist_ok=True)
    
    print(f"🔍 n8n Workflow Hunter — Deep Search")
    print(f"   Query: {args.query}")
    print(f"   Sources: {', '.join(args.sources)}")
    print(f"   License filter: {args.license_filter or 'None (all licenses)'}")
    print(f"   Fetch content: {args.fetch_content}")
    print(f"{'='*50}\n")
    
    results = deep_search(
        query=args.query,
        sources=args.sources,
        license_filter=args.license_filter,
        max_results=args.max_results,
        fetch_content=args.fetch_content,
    )
    
    # Print summary
    print(f"\n{'='*50}")
    print(f"📊 SEARCH SUMMARY")
    print(f"{'='*50}")
    print(f"   Total results: {results['summary']['total_found']}")
    for source, count in results['summary']['by_source'].items():
        print(f"   - {source}: {count}")
    print(f"\n   License breakdown:")
    for tier, count in results['summary']['by_license_tier'].items():
        tier_labels = {
            "preferred": "🟢 Preferred (MIT, Apache, GPL, BSD, CC0)",
            "acceptable": "🟡 Acceptable (MPL, LGPL, CC-BY, AGPL)",
            "restricted": "🔴 Restricted (NC, Proprietary, Unspecified)",
            "unknown": "⚪ Unknown",
        }
        print(f"   - {tier_labels.get(tier, tier)}: {count}")
