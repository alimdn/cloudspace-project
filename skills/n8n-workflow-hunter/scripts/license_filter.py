#!/usr/bin/env python3
"""
License Filter & Scorer for n8n Workflow Hunter
Classifies, scores, and ranks licenses for workflow results.
Can be used standalone or imported as a module.
"""

import json
import sys
from typing import Optional


# ─── License Database ────────────────────────────────────────────────────────

LICENSE_DB = {
    # ─── Preferred: Free, open source, no restrictions ───
    "MIT": {
        "tier": "preferred",
        "score": 100,
        "name": "MIT License",
        "commercial_use": True,
        "modification": True,
        "distribution": True,
        "patent_grant": False,
        "copyleft": False,
        "description": "Most permissive. Use, modify, distribute freely with attribution.",
    },
    "Apache-2.0": {
        "tier": "preferred",
        "score": 98,
        "name": "Apache License 2.0",
        "commercial_use": True,
        "modification": True,
        "distribution": True,
        "patent_grant": True,
        "copyleft": False,
        "description": "Permissive with patent protection. Excellent for enterprise use.",
    },
    "GPL-2.0": {
        "tier": "preferred",
        "score": 85,
        "name": "GNU General Public License v2.0",
        "commercial_use": True,
        "modification": True,
        "distribution": True,
        "patent_grant": False,
        "copyleft": True,
        "description": "Strong copyleft. Derivative works must use same license.",
    },
    "GPL-3.0": {
        "tier": "preferred",
        "score": 85,
        "name": "GNU General Public License v3.0",
        "commercial_use": True,
        "modification": True,
        "distribution": True,
        "patent_grant": True,
        "copyleft": True,
        "description": "Strong copyleft with patent protection. Derivative works must use same license.",
    },
    "BSD-2-Clause": {
        "tier": "preferred",
        "score": 95,
        "name": "BSD 2-Clause License",
        "commercial_use": True,
        "modification": True,
        "distribution": True,
        "patent_grant": False,
        "copyleft": False,
        "description": "Simplified BSD. Very permissive, similar to MIT.",
    },
    "BSD-3-Clause": {
        "tier": "preferred",
        "score": 93,
        "name": "BSD 3-Clause License",
        "commercial_use": True,
        "modification": True,
        "distribution": True,
        "patent_grant": False,
        "copyleft": False,
        "description": "Permissive with non-endorsement clause.",
    },
    "0BSD": {
        "tier": "preferred",
        "score": 100,
        "name": "Zero-Clause BSD",
        "commercial_use": True,
        "modification": True,
        "distribution": True,
        "patent_grant": False,
        "copyleft": False,
        "description": "Effectively public domain. No conditions whatsoever.",
    },
    "CC0-1.0": {
        "tier": "preferred",
        "score": 100,
        "name": "Creative Commons Zero v1.0 Universal",
        "commercial_use": True,
        "modification": True,
        "distribution": True,
        "patent_grant": False,
        "copyleft": False,
        "description": "Public domain dedication. No rights reserved.",
    },
    "Unlicense": {
        "tier": "preferred",
        "score": 100,
        "name": "The Unlicense",
        "commercial_use": True,
        "modification": True,
        "distribution": True,
        "patent_grant": False,
        "copyleft": False,
        "description": "Public domain equivalent. Unconditional waiver of rights.",
    },
    "ISC": {
        "tier": "preferred",
        "score": 97,
        "name": "ISC License",
        "commercial_use": True,
        "modification": True,
        "distribution": True,
        "patent_grant": False,
        "copyleft": False,
        "description": "Permissive, functionally equivalent to MIT/BSD-2-Clause.",
    },

    # ─── Acceptable: Some conditions but generally fine ───
    "MPL-2.0": {
        "tier": "acceptable",
        "score": 75,
        "name": "Mozilla Public License 2.0",
        "commercial_use": True,
        "modification": True,
        "distribution": True,
        "patent_grant": True,
        "copyleft": "weak",
        "description": "Weak copyleft (file-level). Modifications to covered files must stay open.",
    },
    "LGPL-2.1": {
        "tier": "acceptable",
        "score": 72,
        "name": "GNU Lesser General Public License v2.1",
        "commercial_use": True,
        "modification": True,
        "distribution": True,
        "patent_grant": False,
        "copyleft": "weak",
        "description": "Weak copyleft. Can link to this from proprietary code.",
    },
    "LGPL-3.0": {
        "tier": "acceptable",
        "score": 72,
        "name": "GNU Lesser General Public License v3.0",
        "commercial_use": True,
        "modification": True,
        "distribution": True,
        "patent_grant": True,
        "copyleft": "weak",
        "description": "Weak copyleft with patent grant. Can link from proprietary code.",
    },
    "CC-BY-4.0": {
        "tier": "acceptable",
        "score": 80,
        "name": "Creative Commons Attribution 4.0",
        "commercial_use": True,
        "modification": True,
        "distribution": True,
        "patent_grant": False,
        "copyleft": False,
        "description": "Free to use with attribution requirement.",
    },
    "CC-BY-SA-4.0": {
        "tier": "acceptable",
        "score": 70,
        "name": "Creative Commons Attribution-ShareAlike 4.0",
        "commercial_use": True,
        "modification": True,
        "distribution": True,
        "patent_grant": False,
        "copyleft": True,
        "description": "Free to use with attribution. Derivatives must use same license.",
    },
    "AGPL-3.0": {
        "tier": "acceptable",
        "score": 60,
        "name": "GNU Affero General Public License v3.0",
        "commercial_use": True,
        "modification": True,
        "distribution": True,
        "patent_grant": True,
        "copyleft": "strong",
        "description": "Strong copyleft + network clause. Network use triggers source disclosure.",
    },
    "EPL-1.0": {
        "tier": "acceptable",
        "score": 74,
        "name": "Eclipse Public License 1.0",
        "commercial_use": True,
        "modification": True,
        "distribution": True,
        "patent_grant": True,
        "copyleft": "weak",
        "description": "Weak copyleft with patent grant. Similar to MPL.",
    },
    "EPL-2.0": {
        "tier": "acceptable",
        "score": 74,
        "name": "Eclipse Public License 2.0",
        "commercial_use": True,
        "modification": True,
        "distribution": True,
        "patent_grant": True,
        "copyleft": "weak",
        "description": "Weak copyleft with patent grant. Updated from EPL-1.0.",
    },

    # ─── Restricted: Commercial restrictions or unclear ───
    "CC-BY-NC-4.0": {
        "tier": "restricted",
        "score": 30,
        "name": "Creative Commons Attribution-NonCommercial 4.0",
        "commercial_use": False,
        "modification": True,
        "distribution": True,
        "patent_grant": False,
        "copyleft": False,
        "description": "Non-commercial use only. Cannot use for business purposes.",
    },
    "CC-BY-NC-SA-4.0": {
        "tier": "restricted",
        "score": 25,
        "name": "Creative Commons Attribution-NonCommercial-ShareAlike 4.0",
        "commercial_use": False,
        "modification": True,
        "distribution": True,
        "patent_grant": False,
        "copyleft": True,
        "description": "Non-commercial + share-alike. Most restrictive CC license.",
    },
    "CC-BY-NC-ND-4.0": {
        "tier": "restricted",
        "score": 15,
        "name": "Creative Commons Attribution-NonCommercial-NoDerivatives 4.0",
        "commercial_use": False,
        "modification": False,
        "distribution": True,
        "patent_grant": False,
        "copyleft": False,
        "description": "Non-commercial, no derivatives. Most restrictive.",
    },
    "BUSL-1.1": {
        "tier": "restricted",
        "score": 20,
        "name": "Business Source License 1.1",
        "commercial_use": False,
        "modification": False,
        "distribution": False,
        "patent_grant": False,
        "copyleft": False,
        "description": "Source-available but not open source. Commercial restrictions apply.",
    },
    "NOASSERTION": {
        "tier": "restricted",
        "score": 40,
        "name": "No License / Unspecified",
        "commercial_use": None,
        "modification": None,
        "distribution": None,
        "patent_grant": False,
        "copyleft": None,
        "description": "License not specified. Legal status unclear - treat as all rights reserved.",
    },
}

# Aliases for license variations
LICENSE_ALIASES = {
    "APACHE-2.0": "Apache-2.0",
    "GPL-2.0-ONLY": "GPL-2.0",
    "GPL-2.0-OR-LATER": "GPL-2.0",
    "GPL-3.0-ONLY": "GPL-3.0",
    "GPL-3.0-OR-LATER": "GPL-3.0",
    "AGPL-3.0-ONLY": "AGPL-3.0",
    "AGPL-3.0-OR-LATER": "AGPL-3.0",
    "LGPL-2.0": "LGPL-2.1",
    "LGPL-2.0-ONLY": "LGPL-2.1",
    "LGPL-2.0-OR-LATER": "LGPL-2.1",
    "LGPL-2.1-ONLY": "LGPL-2.1",
    "LGPL-2.1-OR-LATER": "LGPL-2.1",
    "LGPL-3.0-ONLY": "LGPL-3.0",
    "LGPL-3.0-OR-LATER": "LGPL-3.0",
    "MPL-2.0-NO-COPYLEFT-EXCEPTION": "MPL-2.0",
    "CC-BY-3.0": "CC-BY-4.0",
    "CC-BY-2.5": "CC-BY-4.0",
    "CC-BY-2.0": "CC-BY-4.0",
    "CC-BY-SA-3.0": "CC-BY-SA-4.0",
    "CC-BY-NC-3.0": "CC-BY-NC-4.0",
    "CC-BY-NC-2.5": "CC-BY-NC-4.0",
    "CC-BY-NC-2.0": "CC-BY-NC-4.0",
    "CC-BY-NC-SA-3.0": "CC-BY-NC-SA-4.0",
    "CC-BY-NC-ND-3.0": "CC-BY-NC-ND-4.0",
    "BSD-2-CLAUSE-FREEBSD": "BSD-2-Clause",
    "BSD-3-CLAUSE-CLEAR": "BSD-3-Clause",
}


def lookup_license(license_id: str) -> dict:
    """
    Look up a license by SPDX ID. Handles aliases.
    Returns license info dict or a default for unknown licenses.
    """
    if not license_id:
        return LICENSE_DB["NOASSERTION"]
    
    # Normalize
    normalized = license_id.strip().upper()
    
    # Check aliases first
    if normalized in LICENSE_ALIASES:
        normalized = LICENSE_ALIASES[normalized]
    
    # Direct lookup
    for key, value in LICENSE_DB.items():
        if key.upper() == normalized:
            return value
    
    # Fuzzy match for common patterns
    lower = license_id.lower()
    if "mit" in lower:
        return LICENSE_DB["MIT"]
    elif "apache" in lower:
        return LICENSE_DB["Apache-2.0"]
    elif "gpl" in lower and "agpl" not in lower and "lgpl" not in lower:
        return LICENSE_DB["GPL-3.0"]
    elif "agpl" in lower:
        return LICENSE_DB["AGPL-3.0"]
    elif "lgpl" in lower:
        return LICENSE_DB["LGPL-3.0"]
    elif "bsd" in lower:
        return LICENSE_DB["BSD-3-Clause"]
    elif "mpl" in lower or "mozilla" in lower:
        return LICENSE_DB["MPL-2.0"]
    elif "cc-by-nc" in lower:
        return LICENSE_DB["CC-BY-NC-4.0"]
    elif "cc-by-sa" in lower:
        return LICENSE_DB["CC-BY-SA-4.0"]
    elif "cc-by" in lower:
        return LICENSE_DB["CC-BY-4.0"]
    elif "cc0" in lower or "public domain" in lower:
        return LICENSE_DB["CC0-1.0"]
    elif "unlicense" in lower:
        return LICENSE_DB["Unlicense"]
    elif "isc" in lower:
        return LICENSE_DB["ISC"]
    elif "busl" in lower or "business source" in lower:
        return LICENSE_DB["BUSL-1.1"]
    elif "proprietary" in lower or "all rights reserved" in lower:
        return {
            "tier": "restricted",
            "score": 10,
            "name": "Proprietary",
            "commercial_use": False,
            "modification": False,
            "distribution": False,
            "patent_grant": False,
            "copyleft": False,
            "description": "Proprietary license. All rights reserved by author.",
        }
    
    # Unknown license
    return {
        "tier": "unknown",
        "score": 50,
        "name": license_id,
        "commercial_use": None,
        "modification": None,
        "distribution": None,
        "patent_grant": False,
        "copyleft": None,
        "description": f"Unknown license: {license_id}. Review terms before use.",
    }


def classify_license(license_id: str) -> str:
    """Quick classification of a license ID into a tier."""
    info = lookup_license(license_id)
    return info.get("tier", "unknown")


def score_license(license_id: str) -> int:
    """Get a numerical score (0-100) for a license. Higher = more permissive."""
    info = lookup_license(license_id)
    return info.get("score", 50)


def filter_by_license(results: list, min_tier: str = "acceptable") -> list:
    """
    Filter a list of results by minimum license tier.
    Tiers: "preferred" > "acceptable" > "restricted"
    """
    tier_order = {"preferred": 3, "acceptable": 2, "restricted": 1, "unknown": 0}
    min_level = tier_order.get(min_tier, 2)
    
    filtered = []
    for result in results:
        tier = result.get("license_tier", "unknown")
        level = tier_order.get(tier, 0)
        if level >= min_level:
            filtered.append(result)
    
    return filtered


def rank_by_license(results: list) -> list:
    """
    Rank results by license score (most permissive first).
    Results without license info are ranked last.
    """
    return sorted(results, key=lambda r: score_license(r.get("license", "NOASSERTION")), reverse=True)


def generate_license_report(results: list) -> str:
    """
    Generate a human-readable license report for search results.
    """
    tiers = {"preferred": [], "acceptable": [], "restricted": [], "unknown": []}
    
    for r in results:
        license_id = r.get("license", "NOASSERTION")
        info = lookup_license(license_id)
        tier = info.get("tier", "unknown")
        tiers[tier].append({
            **r,
            "license_info": info,
        })
    
    lines = []
    lines.append("# 📜 License Report\n")
    
    tier_labels = {
        "preferred": "🟢 Preferred Licenses (Free & Open Source)",
        "acceptable": "🟡 Acceptable Licenses (Some Conditions)",
        "restricted": "🔴 Restricted Licenses (Commercial Limits / Unspecified)",
        "unknown": "⚪ Unknown Licenses",
    }
    
    for tier_name, items in tiers.items():
        if not items:
            continue
        lines.append(f"\n## {tier_labels.get(tier_name, tier_name)}\n")
        for item in items:
            info = item.get("license_info", {})
            name = item.get("name", "Unknown")
            source = item.get("source", "")
            url = item.get("url", item.get("repo_url", ""))
            license_name = info.get("name", "Unknown")
            score = info.get("score", 0)
            desc = info.get("description", "")
            commercial = info.get("commercial_use")
            comm_label = "✅" if commercial else "❌" if commercial is False else "❓"
            
            lines.append(f"- **{name}** ({source})")
            if url:
                lines.append(f"  - URL: {url}")
            lines.append(f"  - License: {license_name} (Score: {score}/100)")
            lines.append(f"  - Commercial use: {comm_label}")
            lines.append(f"  - {desc}")
    
    return "\n".join(lines)


# ─── CLI ─────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="n8n Workflow License Filter")
    parser.add_argument("input", help="Path to search results JSON file")
    parser.add_argument("--min-tier", default="acceptable",
                        choices=["preferred", "acceptable", "restricted"],
                        help="Minimum license tier to include")
    parser.add_argument("--report", action="store_true", help="Generate license report")
    parser.add_argument("--output", default=None, help="Output file path")
    
    args = parser.parse_args()
    
    with open(args.input, "r", encoding="utf-8") as f:
        data = json.load(f)
    
    # Collect all results
    all_results = []
    for source_name, source_results in data.get("results", {}).items():
        if isinstance(source_results, list):
            for r in source_results:
                r["_source"] = source_name
                all_results.append(r)
    
    # Enrich with license info
    for r in all_results:
        license_id = r.get("license", "NOASSERTION")
        info = lookup_license(license_id)
        r["license_tier"] = info.get("tier", "unknown")
        r["license_score"] = info.get("score", 50)
    
    if args.report:
        report = generate_license_report(all_results)
        if args.output:
            with open(args.output, "w", encoding="utf-8") as f:
                f.write(report)
            print(f"Report saved to: {args.output}")
        else:
            print(report)
    else:
        filtered = filter_by_license(all_results, args.min_tier)
        ranked = rank_by_license(filtered)
        
        output = {
            "filter": args.min_tier,
            "original_count": len(all_results),
            "filtered_count": len(ranked),
            "results": ranked,
        }
        
        if args.output:
            with open(args.output, "w", encoding="utf-8") as f:
                json.dump(output, f, ensure_ascii=False, indent=2)
            print(f"Filtered results saved to: {args.output}")
        else:
            print(json.dumps(output, ensure_ascii=False, indent=2))
        
        print(f"\n📊 {len(ranked)}/{len(all_results)} results passed '{args.min_tier}' tier filter")
