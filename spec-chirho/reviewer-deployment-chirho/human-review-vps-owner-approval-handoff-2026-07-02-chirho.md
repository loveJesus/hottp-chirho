<!-- For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life. — John 3:16 (KJV) -->

# Human Review VPS Owner Approval Handoff Chirho

This is a decision aid only. It is not owner approval, does not create a host,
does not start a stopped host, and does not create DNS records.

## Current Inventory Chirho

Read-only inventory from `bun run inventory-human-review-vps-candidates-chirho`
at `2026-07-02T10:42:04.884Z`:

- Hetzner: `ok - found 4 server(s)`.
- `ubuntu-16gb-ash-1-chirho`: off, `cpx42`, IPv4 `46.224.142.19`.
- `perffection-api-chirho`: running, `cx22`, IPv4 `88.99.82.23`.
- `global-bible-tools-chirho`: running, `cpx32`, IPv4 `46.224.100.134`.
- `cairn-chirho`: running, `cax11`, IPv4 `167.235.194.27`.
- DigitalOcean: `not-ok - HTTP 401`.
- Cloudflare review DNS: `ok - found 0 review DNS record(s)` for
  `raw-review.bible.systems`, `latin-review.bible.systems`, and
  `expert-review.bible.systems`.

## Decision Needed Chirho

Owner approval must choose exactly one write-owning host before Phase 6 can
continue. The completed provisioning decision must fill:

- `owner_approval_chirho.approved_chirho: true`
- `owner_approval_chirho.approved_by_chirho`
- `owner_approval_chirho.approval_reference_chirho`
- `selected_host_chirho.host_name_chirho`
- `selected_host_chirho.host_address_chirho`
- all `safety_acknowledgements_chirho` values as `true`

Use this draft as the starting point:

```bash
spec-chirho/reviewer-deployment-chirho/human-review-vps-provisioning-decision-draft-2026-07-02-chirho.json
```

Then verify the completed decision:

```bash
bun run check-human-review-vps-provisioning-decision-chirho -- \
  --decision-chirho=spec-chirho/reviewer-deployment-chirho/human-review-vps-provisioning-decision-YYYY-MM-DD-chirho.json
```

## Conservative Host Reading Chirho

- A running shared host may already carry unrelated responsibilities. Reusing
  one must explicitly accept that it becomes the single write-owning review
  host for this workflow.
- A stopped host may be more isolated, but starting or repurposing it still
  needs owner approval and budget confirmation.
- No DNS records currently exist for the review hostnames. Creating them is a
  separate explicit owner decision.

## Approval Sentence Chirho

An approval message should be this concrete:

```text
I approve Phase 6 reuse of <host_name_chirho> at <host_address_chirho> as the
single write-owning human-review VPS for raw-review first. Approved scope:
reuse-existing-host-chirho. Creates billable resources: false. Monthly budget:
$0 new resources. DNS changes: <none | create raw-review/latin-review/expert-review
records>. Approval reference: <message/link/id>.
```

Without that level of specificity, do not run host provisioning, Caddy setup,
DNS changes, rsync `--apply-chirho`, or remote review writes.

## Next Command After Approval Chirho

After the completed decision verifier passes, continue with the runbook:

```bash
spec-chirho/reviewer-deployment-chirho/human-review-vps-smoke-runbook-2026-07-02-chirho.md
```
