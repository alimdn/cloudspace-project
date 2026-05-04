# Automation Logic & Workflows

## Workflow 1: Product Publication Trigger

Fires the moment a new product is published or an existing product is updated.

### Steps

| Step | Trigger | Action | Output |
|------|---------|--------|--------|
| 1 | Product published | Extract metadata: name, category, price, description, images, audience | Product data object |
| 2 | Metadata extracted | Generate 3 ad copies (PAS, Identity, Urgency) | 3 ad copy variants |
| 3 | Ad copies generated | Generate 2 hooks (Contrarian, Specific Result) | 2 hook variants |
| 4 | Hooks generated | Generate long-form sales page description | Sales page copy |
| 5 | Sales copy generated | Generate short-form video script | Video script + shot list |
| 6 | All content generated | Queue all content in review dashboard | Review queue items |
| 7 | Content approved by human | Push to scheduling pipeline | Scheduled posts |

### Important Notes
- Steps 1-6 happen instantly (AI generation)
- Step 7 requires human approval — never auto-publish without review
- If the product is an update (not new), flag which content needs refreshing vs which can stay

---

## Workflow 2: Content Scheduling Pipeline

Takes approved content and assigns it to the optimal day, time, and platform.

### Logic

1. **Slot Assignment**: Match content type to available schedule slots
   - Video content → TikTok, Reels, Shorts slots
   - Written content → Email, community, Twitter slots
   - Visual content → Pinterest, Instagram carousel slots
   - Each slot has a predefined day, time, and platform from the 7-day schedule

2. **Platform Adaptation**: Auto-adapt each piece of content for its target platform
   - Video: Trim to platform-specific length limits (TikTok 60s, Reels 30s, Shorts 60s)
   - Ad copy: Truncate/expand to character limits
   - Hashtags: Select from platform-specific sets (5-7 for Instagram, 3-5 for TikTok, 1-2 for Twitter)
   - CTA: Platform-specific (Link in bio / Swipe up / Click below / Direct link)

3. **Cross-Posting Logic**: When content exceeds the "Good" performance threshold:
   - Automatically reformat for secondary platforms
   - Apply 48-hour delay before cross-posting
   - Adapt hook for the new platform's style

4. **Frequency Guardrails**:
   - Max 2 promotional posts per day per platform
   - Max 3 product mentions per week per platform
   - Min 48 hours between same-product posts on same platform
   - If multiple products compete for same slot, prioritize by launch date (newest first)

---

## Workflow 3: Engagement Tracking

### Metrics to Track

| Metric | Source | Good Threshold | Weak Threshold | Diagnostic Use |
|--------|--------|---------------|----------------|----------------|
| Views/Impressions | Platform APIs | > 2x account avg | < 0.5x avg | Hook effectiveness |
| Click-through Rate | UTM tracking | > 3% | < 1% | CTA and offer strength |
| Save/Share Rate | Platform APIs | > 5% | < 1% | Content value density |
| Conversion Rate | Marketplace analytics | > 2% | < 0.5% | Pricing + offer alignment |
| Email Open Rate | Email platform | > 35% | < 20% | Subject line quality |
| Email Click Rate | Email platform | > 5% | < 2% | Email CTA effectiveness |
| Follower Growth | Platform APIs | > 1% weekly | < 0% (decline) | Overall content strategy |
| Revenue per Post | Calculated | > $X target | < $X/5 | ROI of content effort |

### Tracking Implementation

1. **UTM Parameters**: Every link includes source, medium, campaign, and content tags
2. **Conversion Pixels**: Install on all marketplace listings and landing pages
3. **Weekly Snapshot**: Pull all metrics every Sunday for the weekly report
4. **Real-time Alerts**: Flag any metric that drops below the Weak threshold within 24 hours

---

## Workflow 4: Performance-Based Strategy Adjustment

### High Performer Amplification

**Trigger**: Any content exceeds "Good" threshold by 2x+ on any metric

**Automated actions**:
1. Boost the post with paid promotion (configurable weekly budget cap)
2. Cross-post to all secondary platforms with adaptations
3. Create content derivatives:
   - Viral TikTok → Instagram Reel + YouTube Short + Pinterest Idea Pin
   - High-performing email → Instagram Carousel + Twitter Thread
   - Popular pin → TikTok video showing the product in action
4. Add the winning hook/angle to the "winning angles" library for future content

### Low Performer Diagnosis

**Trigger**: Any content falls below "Weak" threshold

**Diagnosis framework**:

| Failure Type | Evidence | Likely Cause | Recommended Fix |
|-------------|----------|-------------|-----------------|
| Hook Failure | Impressions normal, retention < 15% | First 3 seconds didn't capture attention | Replace with contrarian hook or specific-result hook. Test 2 variants. |
| Value Failure | High views, low saves/shares | Content was catchy but didn't deliver value | Add 2-3 actionable tips before product mention. Reduce promotional ratio. |
| Conversion Failure | Good engagement, CTR < 1% | CTA unclear or offer not compelling | Strengthen offer: add discount, bonus, guarantee. Clarify CTA language. |

### Strategy Pivot Escalation

**Trigger**: Overall weekly performance below Weak threshold across ALL platforms simultaneously

**Action**: Escalate to human strategist with:
1. Comprehensive diagnostic report
2. Three recommended strategy pivots
3. Specific content/format changes to test
4. Risk assessment for each pivot

This prevents the automation from continuing a fundamentally flawed strategy.

---

## A/B Test Automation

### Rules
1. For each product, always run A/B tests on:
   - 2 ad copy variants (from the 3 templates)
   - 2 hook styles (Contrarian vs Specific Result)
   - 2 posting times (primary vs secondary optimal time)

2. **Rotation**: First 48 hours: 50/50 split delivery
3. **Winner selection**: After 48 hours, shift 80% delivery to winning variant
4. **Challenger system**: Continue testing new challengers with the remaining 20%
5. **Documentation**: Log all test results in the experiment tracker for pattern analysis

---

## Automation Calendar

| Frequency | Automated Action |
|-----------|-----------------|
| Instant (on product publish) | Content generation pipeline (Workflow 1) |
| Daily | Check engagement thresholds, flag anomalies |
| Weekly (Sunday) | Pull metrics, generate weekly report, update experiment tracker |
| Bi-weekly | Refresh ad copy variants, rotate hook styles |
| Monthly | Review and update platform selection, adjust schedule based on performance trends |
