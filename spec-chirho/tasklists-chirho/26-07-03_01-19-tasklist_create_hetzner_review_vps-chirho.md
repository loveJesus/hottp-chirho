<!-- For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life. — John 3:16 (KJV) -->

# Create Hetzner Review VPS Chirho

- [x] Confirm owner asked for a fresh review VPS instead of reusing an existing one.
- [x] Verify `cax11` capacity and current pricing from Hetzner before creation.
- [x] Attempt a dedicated Hetzner `cax11` review host with SSH keys attached.
- [x] Clean up the unused firewall created during failed placement attempts.
- [x] Choose the next host shape after `cax11` placement failed in all supported regions.
- [x] Record the completed Phase 6 provisioning decision for the selected host.
- [x] Run the provisioning-decision and readiness checks.
- [x] Report host details, cost boundary, and next runbook step without exposing secrets.

## Current Outcome Chirho

Hetzner rejected `cax11` placement in `fsn1`, `hel1`, and `nbg1` with
`resource_unavailable`. A fallback `cpx21` attempt in `fsn1` also failed because
that type is not currently supported/available there for creation. No VPS was
created.

The temporary `hottp-human-review-vps-firewall-chirho` firewall from the failed
attempt was deleted. A follow-up inventory showed no `human-review` server and
no `human-review` firewall.

Retried at `2026-07-03T22:59:02Z`: `cax11` was still unavailable in `fsn1`,
`hel1`, and `nbg1` with `resource_unavailable` placement errors. The temporary
firewall from that retry was also deleted, and follow-up inventory again showed
no `human-review` server and no `human-review` firewall.

Likely next choices:

- Wait and retry `cax11` later.
- Use an available fresh `cx23` or `cx33` host in Nuremberg.
- Reuse the existing powered-off `ubuntu-16gb-ash-1-chirho` host.

Live check at `2026-07-03T23:20:08Z`: `cx23` and `cx33` were both available in
Nuremberg (`nbg1`). `cx23` is 2 shared x86 vCPU / 4 GB RAM / 40 GB disk at
`5.49` monthly gross. `cx33` is 4 shared x86 vCPU / 8 GB RAM / 80 GB disk at
`8.49` monthly gross. No `human-review` server or firewall existed at that
check.

Owner then approved `cx33`. Created `hottp-human-review-cx33-chirho` in
Nuremberg (`nbg1`) with Hetzner id `147667582`, IPv4 `195.201.101.25`, type
`cx33`, and firewall `hottp-human-review-vps-firewall-chirho` id `11246138`.
No DNS records were created.

The completed provisioning decision is
`spec-chirho/reviewer-deployment-chirho/human-review-vps-provisioning-decision-2026-07-03-cx33-chirho.json`.
The provisioning decision check, local readiness check, deployment template
check, smoke evidence template check, and `git diff --check` passed. SSH as
`hottp-review-chirho` succeeded and confirmed the `/srv/hottp-review-chirho`
layout exists. Sync/start remains gated on the write lease and runbook.

On `2026-07-04`, owner requested attaching a domain, then clarified that
Cloudflare should own public TLS while the VPS origin remains protected. After a
minimal Fable review, created Cloudflare-proxied A records pointing to
`195.201.101.25`:

- `raw-review.bible.systems`
- `latin-review.bible.systems`
- `expert-review.bible.systems`

All three records use `proxied=true`. The Hetzner firewall keeps SSH open, opens
origin `443` only to Cloudflare IP ranges, and closes public `80`. Caddy on the
VPS remains responsible for origin HTTPS plus auth before any review service is
exposed. Raw-first remains the service startup rule, not a DNS rule.

VPS bootstrap status:

- Installed Bun `1.3.14`.
- Upgraded Caddy to official stable `v2.11.4` because the Ubuntu package lacked
  `caddy validate --envfile`, which the checked runbook requires.
- Installed the generated Caddyfile with Cloudflare-proxied HTTPS origin,
  `tls internal`, `auto_https disable_redirects`, and Basic Auth.
- Saved the generated Basic Auth secret only in local secret files and
  `/etc/hottp-review-chirho.env`; do not commit it.
- Verified unauthenticated `https://raw-review.bible.systems/` returns `401`.
- Verified authenticated access reaches Caddy and returns `502` because no
  review upstream is running yet.
- Verified direct origin `80`, direct origin `443`, and direct `8766` time out
  from the public internet.
- Installed `build-essential` because the remote `bun install --frozen-lockfile`
  needed native build tools for `better-sqlite3`.
- Deployed committed `HEAD` plus the gitignored `workspace-chirho/` assets to
  `/srv/hottp-review-chirho/current` without copying local dirty scratch files.
- Copied the canonical `spec-chirho/progress-chirho.sqlite` explicitly because
  git archive excludes ignored SQLite files; the local WAL was zero bytes.
- Started only `hottp-raw-review-chirho.service`.
- Verified `https://raw-review.bible.systems/` returns `401` without auth and
  `200` with Basic Auth, and the page title is `Pass C Hebrew Validation`.
- Verified host preflight passes with raw Hebrew active and direct public
  `80`/`8766` blocked.
