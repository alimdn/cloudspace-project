# VPS Hosting Business Model: Legal & Business Research Report

**Date**: June 2025  
**Purpose**: Evaluate legal viability of pivoting from "managed n8n hosting" to "generic workspace/server hosting with one-click deployment templates"

---

## EXECUTIVE SUMMARY

**The pivoted business model is legally viable with proper implementation.** The research conclusively shows that selling generic infrastructure (compute/storage/space) where users install their own software is a well-established, legally protected business model — distinct from commercially distributing or reselling n8n. Multiple precedents exist (Railway, DigitalOcean, Cloudron, Coolify, Hetzner) that operate this exact model with n8n and similar fair-code licensed software.

**Risk Level: LOW** — Provided the platform is structured as genuine infrastructure provisioning, not a disguised n8n reselling service.

---

## FINDING 1: n8n Sustainable Use License — What It Actually Restricts

### License Type
- **Fair-code license** (NOT open source, NOT MIT/Apache)
- Created by n8n in March 2022, replacing Apache 2.0 + Commons Clause
- GitHub: `github.com/n8n-io/n8n/blob/master/LICENSE.md`

### The Three Core Restrictions
Per `docs.n8n.io/sustainable-use-license`:

1. **"You may use or modify the software only for your own internal business purposes or for non-commercial or personal use."**
2. **"You may not sell, sublicense, or otherwise commercialize the software."**
3. **"You may not use the software to provide a service to third parties if the value of that service derives entirely or substantially from n8n."**

### Explicitly Prohibited Under the License
- Hosting n8n and charging people money to access it
- Installing a cluster of n8n servers, creating multiple users for different clients, and selling them access to YOUR deployment
- Offering "n8n-as-a-Service" by hosting n8n and charging clients a subscription fee to access the n8n interface
- Embedding n8n inside a commercial product
- Under the free license, end-users must not log into n8n or provide their own third-party credentials if offered as a service

### Explicitly Allowed Under the License
- Using n8n to sync data you control as a business internally
- Building and using workflows for your own company
- Self-hosting n8n for internal business purposes
- Jan Oberhauser (n8n CEO) confirmed: You CAN legally power a SaaS backend with n8n if n8n is used internally by your company

### KEY INSIGHT FOR YOUR PIVOT
The license restricts the **person/entity using n8n commercially**, not the **infrastructure provider**. A hosting provider selling generic server space is not "using n8n" — the user who installs it is. This is the same legal distinction that protects DigitalOcean, Hetzner, Railway, and every VPS provider.

---

## FINDING 2: Precedents — How Major Platforms Handle This EXACT Model

### Railway (railway.com) — THE CLOSEST PRECEDENT
- **Literally has "Deploy n8n" as a one-click template** at `railway.com/deploy/n8n`
- Also has `railway.com/deploy/n8n-self-hosted`
- Terms of Service: "You are responsible for what you host on Railway"
- Railway explicitly states n8n is "free under a fair-code n8n license. You can self host it at no software cost; you only pay for the infrastructure"
- **Railway is NOT commercially using n8n — they provide infrastructure and the user deploys it**

### DigitalOcean
- Has **official documentation** for hosting n8n: `docs.n8n.io/hosting/installation/server-setups/digital-ocean`
- DigitalOcean's community tutorials include step-by-step n8n deployment guides
- DigitalOcean provides "Droplets" (VPS) and the user installs everything themselves
- Their ToS makes users responsible for software licensing compliance

### Hetzner
- n8n has **official documentation** for Hetzner: `docs.n8n.io/hosting/installation/server-setups/hetzner`
- Hetzner is listed as a recommended hosting provider by n8n itself
- This is **n8n officially endorsing a hosting provider** that lets users install their software

### Render (render.com)
- Similar PaaS model — users deploy their own software
- Terms make users responsible for what they host

### Cloudron — THE APP STORE PRECEDENT
- Provides an **app store** with one-click installation of n8n, WordPress, Nextcloud, etc.
- Users install these apps on their own Cloudron instance
- Key legal language from `cloudron.io/legal/terms.html`: **"You are fully responsible for all activities that occur under the account"**
- From docs: **"Community apps are not reviewed by Cloudron. Only install apps from trusted developers. Third-party code can compromise your system."**
- Cloudron explicitly disclaims responsibility for the apps users install
- Available on AWS Marketplace — a major cloud provider distributing it

### Coolify (coolify.io)
- **Open-source self-hosted PaaS** — alternative to Heroku
- Provides **280+ one-click services** including n8n
- Users deploy these on their own servers
- AGPL v3 licensed platform itself

### Dokploy (dokploy.com)
- Open-source PaaS similar to Coolify
- **80-100 one-click deployment templates**
- Users self-host and deploy applications

### YunoHost
- Self-hosting platform with AGPL v3 licensed packages
- App catalog includes various open-source tools
- "YunoHost packages are under free licenses GNU AGPL v.3"

---

## FINDING 3: Docker Container Hosting — Legal Framework

### Linux Foundation Analysis
Per the Linux Foundation whitepaper "Docker Containers: What are the Open Source Licensing Considerations":
- Container hosting itself is a distribution mechanism, not a license violation
- The key is whether the hosting provider is **distributing** the software (copying it for users) or merely **facilitating user installation**
- Docker Desktop has its own licensing (paid for large orgs) but Docker Engine/CLI remains Apache 2.0

### Key Legal Distinction
| Action | Legal Risk |
|--------|-----------|
| You pre-install n8n on every server and charge for "n8n hosting" | **HIGH RISK** — You're commercially using/distributing n8n |
| You provide empty servers and users install n8n via Docker pull | **LOW RISK** — Standard hosting model |
| You provide one-click scripts that `docker pull` from Docker Hub | **LOW RISK** — You're providing convenience, not distributing |
| You link to Docker Hub / official repos for user self-installation | **NO RISK** — Standard linking, no distribution |

---

## FINDING 4: DMCA Safe Harbor & Hosting Provider Liability

### US Law — 17 USC § 512 (DMCA Safe Harbor)
Per the **Duke Law paper** "DMCA Safe Harbors for Virtual Private Server Providers" (cited by 5 academic sources):

**Key Conclusion**: "General virtual private server providers should successfully qualify for safe harbor protection as long as they conscientiously comply with the particular DMCA rules."

**Four Safe Harbor Categories** (§ 512):
1. **Transitory digital network communications** (§ 512(a))
2. **System caching** (§ 512(b))
3. **Storage at user's direction** (§ 512(c)) — **THIS APPLIES TO VPS HOSTING**
4. **Information location tools** (§ 512(d))

**Section 512(c) — Storage Safe Harbor**:
> "A service provider shall not be liable for monetary relief... for infringement of copyright by reason of the storage at the direction of a user of material that resides on a system or network controlled or operated by or for the service provider."

**Requirements to Qualify**:
1. Register a DMCA designated agent with the US Copyright Office
2. Implement a notice-and-takedown policy
3. Have no actual knowledge of infringing material
4. Not receive financial benefit directly from infringement (with knowledge)
5. Expeditiously remove material upon notification
6. Designate a DMCA agent and publish contact information

### EU Law — E-Commerce Directive Article 14
- **Hosting safe harbor**: Online intermediaries who host content are not liable for user-generated content if they:
  - Act passively (no knowledge of illegal content)
  - Promptly remove content after notice (expeditious takedown)
- **EU Digital Services Act (DSA)** (2024) updates but maintains this principle
- The European Parliament confirmed: "The E-commerce Directive introduces a safe harbour principle under which hosting intermediaries... are exempt from liability"

### Precedent: Fenwick & West Analysis
> "The storage safe harbor protects the OSP against copyright liability 'by reason of the storage at the direction of a user of material that resides on a system or network controlled or operated by or for the service provider.'"

### Vicarious Liability Risk
For hosting providers, vicarious liability requires:
1. **Right and ability to control** the infringing activity, AND
2. **Direct financial benefit** from the infringement

**Your platform should NOT have**: the ability to see/control what users install inside their containers. This is why container isolation is legally important.

---

## FINDING 5: Activepieces — MIT License Confirmed

### License Details
Per `activepieces.com/docs/about/license` and GitHub:
- **"Activepieces' core is released as open source under the MIT license"**
- **"Free to use, modify, and resell"** (per n8nlab.io comparison)
- Enterprise/cloud features are under separate Commercial License
- Community Edition has **NO commercial use restrictions**

### Commercial Hosting Rights
- You CAN host Activepieces as a service
- You CAN resell it
- You CAN embed it in your product
- You CAN modify and redistribute
- Only requirement: preserve copyright notice

### Comparison with n8n

| Feature | n8n (Sustainable Use) | Activepieces (MIT) |
|---------|----------------------|-------------------|
| Self-host commercially | Internal use only | Unlimited |
| Sell as service | NOT allowed | Allowed |
| Embed in product | NOT allowed | Allowed |
| Modify & redistribute | With same license restrictions | Allowed, even with different license |
| Hosting provider install | User's responsibility | Anyone can host |

---

## FINDING 6: Self-Hosted Software Marketplace — Legal Framework

### How Existing Platforms Handle Licensing

**Cloudron Model**:
- Sells the Cloudron platform itself (their own commercial product)
- Provides an app store as a convenience feature
- Users install apps from Docker images on their own Cloudron instance
- Cloudron disclaims: "You are fully responsible for all activities"
- Community apps explicitly unreviewed and unendorsed

**Coolify Model**:
- Open-source (AGPL v3) PaaS platform
- Provides 280+ service templates
- Users deploy on their own servers
- Templates pull official Docker images from upstream sources
- Coolify is the infrastructure layer, not the app distributor

**Key Legal Principles Used by All Platforms**:

1. **Platform-user responsibility separation**: Clear ToS stating users are responsible for software compliance
2. **No pre-installation**: Software is installed at user's direction, not pre-bundled
3. **Attribution to upstream**: Templates link to official sources, not redistributions
4. **Container isolation**: Technical separation reinforces legal separation
5. **Takedown policy**: DMCA compliance for any reported infringement

---

## FINDING 7: Recommended Platform Architecture for Legal Safety

### SAFE Architecture (Recommended)
```
┌─────────────────────────────────────────────┐
│            YOUR PLATFORM                     │
│  ┌─────────────────────────────────────────┐│
│  │  Generic Container/VPS Management UI    ││
│  │  - Create workspace                     ││
│  │  - Allocate resources                   ││
│  │  - Manage DNS/SSL                       ││
│  └─────────────────────────────────────────┘│
│  ┌─────────────────────────────────────────┐│
│  │  Template Marketplace (LINKS ONLY)      ││
│  │  - "Deploy n8n" → pulls from Docker Hub ││
│  │  - "Deploy Activepieces" → official src ││
│  │  - "Deploy WordPress" → official image  ││
│  │  (All templates pull from upstream)     ││
│  └─────────────────────────────────────────┘│
│  ┌─────────────────────────────────────────┐│
│  │  User's Isolated Container              ││
│  │  - User controls everything inside      ││
│  │  - Platform has no visibility           ││
│  │  - User is bound by each software's     ││
│  │    license terms                        ││
│  └─────────────────────────────────────────┘│
└─────────────────────────────────────────────┘
```

### UNSAFE Architecture (Avoid)
```
❌ Pre-installing n8n on every workspace
❌ Marketing as "managed n8n hosting" or "n8n cloud"
❌ Platform having admin access to n8n instances
❌ Charging specifically for "n8n access" (vs. generic space)
❌ Bundling n8n as part of your platform's value proposition
❌ Using n8n's branding to sell your service
```

---

## FINDING 8: Critical ToS Provisions You MUST Include

### Your Terms of Service Must State:

1. **User Responsibility Clause**: "Users are solely responsible for ensuring their use of any software installed on their workspace complies with that software's license terms."

2. **No License Grant**: "The Platform does not grant, sell, sublicense, or distribute any third-party software. The Platform provides compute infrastructure only."

3. **User-Initiated Installation**: "All software installations are initiated by the user. Templates provided are convenience scripts that pull from official upstream sources."

4. **Indemnification**: "Users agree to indemnify the Platform against any claims arising from their installation or use of third-party software."

5. **DMCA/Notice Policy**: "The Platform complies with DMCA safe harbor provisions. For copyright complaints, contact [DMCA Agent]."

6. **No Access to User Containers**: "The Platform does not access, monitor, or control the contents of user containers."

7. **License Acknowledgment**: "When using one-click deployment templates, users acknowledge they are bound by the respective software's license terms."

---

## RISK ASSESSMENT MATRIX

| Risk Area | Level | Mitigation |
|-----------|-------|------------|
| n8n license violation | **LOW** | Sell infrastructure, not n8n. Users install independently. |
| DMCA/copyright liability | **VERY LOW** | Register DMCA agent, implement takedown policy, use § 512(c) safe harbor |
| User software piracy | **VERY LOW** | Container isolation, no visibility, user responsibility in ToS |
| Trademark issues | **LOW** | Don't use "n8n" in your branding/marketing as a service name |
| EU E-Commerce liability | **LOW** | Passive hosting role, expeditious takedown upon notice |
| Vicarious liability | **VERY LOW** | No control over user containers, no direct financial benefit from infringement |
| Activepieces license | **NONE** | MIT license — fully permissive |
| General OSS licenses | **LOW** | Templates pull from official upstream Docker images |

---

## COMPETITIVE INTELLIGENCE

### What Similar Platforms Are Doing

| Platform | Model | n8n Available? | Legal Approach |
|----------|-------|----------------|----------------|
| Railway | PaaS, one-click deploy | Yes (official template) | ToS: "You are responsible for what you host" |
| Render | PaaS | Yes (user deploys) | Standard PaaS ToS |
| DigitalOcean | IaaS/PaaS | Yes (official n8n docs) | User responsibility |
| Hetzner | IaaS | Yes (official n8n docs) | VPS provider model |
| Cloudron | Self-hosted platform | Yes (app store) | "Fully responsible for all activities" |
| Coolify | Self-hosted PaaS | Yes (280+ services) | Open source AGPL v3 |
| Dokploy | Self-hosted PaaS | Yes (templates) | Standard hosting ToS |
| Zeabur | PaaS | Yes | User deploys independently |
| Northflank | PaaS | Yes (guides published) | User responsibility |
| Elest.io | Managed services | Yes ($14/mo) | n8n Enterprise partner |

**Key Observation**: Many platforms that offer one-click n8n deployment have NOT been challenged by n8n GmbH. n8n itself lists some of these providers (Hetzner, DigitalOcean) in their official documentation. This strongly suggests n8n's legal team distinguishes between "hosting provider" and "n8n reseller."

---

## STRATEGIC RECOMMENDATIONS

### 1. GO with the Pivot (Confidence: HIGH)
The pivoted model is legally sound and well-precedented. Railway, DigitalOcean, Cloudron, and Coolify all operate successfully under this exact model.

### 2. Position Correctly from Day 1
- **DO NOT**: Market as "n8n hosting", "managed n8n", or "n8n cloud"
- **DO**: Market as "workspace hosting", "developer workspaces", "one-click app deployment platform"
- **DO**: Frame n8n as "one of many apps users can deploy" (alongside Activepieces, WordPress, databases, etc.)

### 3. Technical Architecture Decisions
- Use Docker containers with full user isolation
- Templates should `docker pull` from official upstream images (Docker Hub, GitHub Container Registry)
- Never pre-install software on workspaces — always user-initiated
- Consider providing a "template marketplace" where the platform provides scripts that pull from official sources

### 4. Legal Compliance Checklist
- [ ] Register DMCA designated agent with US Copyright Office (`dmca.copyright.gov`)
- [ ] Publish DMCA policy on website
- [ ] Draft comprehensive ToS with all clauses listed above
- [ ] Implement DMCA takedown procedure
- [ ] Add license acknowledgment during template installation
- [ ] Consider GDPR Data Processing Agreement (if serving EU customers)
- [ ] Consult with a software licensing attorney (estimated $500-2,000 for review)

### 5. Product Differentiation Ideas (That Stay Legal)
- Focus on UX/UX simplicity vs. raw VPS providers
- Provide value in: backups, SSL, monitoring, scaling, team management
- Offer "workflow automation" category in template marketplace alongside databases, CMS, etc.
- Partner with MIT-licensed alternatives (Activepieces) for featured placement
- Consider becoming an n8n Enterprise Partner if demand exists

### 6. Revenue Model
- Charge for: compute resources, storage, bandwidth, team seats, managed backups, SSL
- Do NOT charge per "n8n workflow" or "n8n user" — this implies selling n8n specifically
- Optional: Premium support tiers, custom domain management, SSO integration

---

## POTENTIAL RISKS & HOW TO MONITOR

### Low-Probability, High-Impact Risks

1. **n8n changes their license to explicitly target hosting providers**
   - Mitigation: The current license doesn't target hosting providers. Monitor license changes. Have legal counsel review annually.
   
2. **A user sues you because their n8n installation had licensing issues**
   - Mitigation: Robust ToS indemnification clause. You're a hosting provider, same legal position as AWS if someone runs pirated Windows on EC2.

3. **n8n sends a cease-and-desist**
   - Mitigation: Your model is identical to Railway/DigitalOcean/Hetzner whom n8n officially endorses. Strong legal defense. But have a plan to quickly remove n8n templates if needed.

4. **EU Digital Services Act changes safe harbor**
   - Mitigation: DSA maintains hosting safe harbor. Monitor regulatory changes. Standard industry compliance.

---

## CONCLUSION

The business pivot from "managed n8n hosting" to "generic workspace/server hosting with one-click deployment templates" is **legally viable, well-precedented, and low-risk** when implemented correctly.

The key legal insight is that the n8n Sustainable Use License restricts the **entity commercially using n8n** (the person installing and using it), not the **infrastructure provider** enabling that installation. This is the same legal distinction that has protected every VPS and PaaS provider from the beginning of cloud computing.

Railway literally offers one-click n8n deployment. DigitalOcean and Hetzner have official n8n documentation. n8n itself endorses these providers. Your model is not novel or legally questionable — it is the standard cloud computing business model.

**Proceed with the pivot, implement the recommended safeguards, and have a software licensing attorney review your ToS before launch.**

---

## KEY SOURCES

| Source | URL | Relevance |
|--------|-----|-----------|
| n8n Sustainable Use License | docs.n8n.io/sustainable-use-license | Primary license text |
| n8n Community Discussion | community.n8n.io/t/does-my-business-model-violate/253894 | Business model FAQ |
| Duke Law: VPS Safe Harbor | scholarship.law.duke.edu/dltr/vol12/iss1/9 | DMCA legal analysis |
| US Copyright Office § 512 | copyright.gov/512 | Safe harbor statute |
| 17 USC § 512 | law.cornell.edu/uscode/text/17/512 | Full legal text |
| EU E-Commerce Directive | europarl.europa.eu | EU safe harbor |
| Railway n8n Deploy | railway.com/deploy/n8n | Industry precedent |
| Activepieces License | activepieces.com/docs/about/license | MIT confirmation |
| Cloudron Terms | cloudron.io/legal/terms.html | ToS precedent |
| Linux Foundation: Docker & OSS | linuxfoundation.org | Container licensing |
| Railway ToS | railway.com/legal/terms | PaaS terms precedent |
| Fenwick & West DMCA Guide | fenwick.com | Legal analysis |
| n8n vs Activepieces | n8nlab.io | License comparison |

---

*This report is for informational purposes and does not constitute legal advice. Consult a qualified attorney before making business decisions.*
