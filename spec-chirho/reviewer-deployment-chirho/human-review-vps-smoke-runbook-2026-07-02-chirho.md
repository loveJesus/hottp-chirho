<!-- For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life. — John 3:16 (KJV) -->

# Human Review VPS Smoke Runbook Chirho

This runbook turns the Phase 6 smoke into an executable checklist. It does not
claim a VPS exists and does not mark the deployment complete. Use it only after
the source-local preflight passes.

## 0. Local Preflight Chirho

Run this from the source workstation before copying anything:

```bash
bun run check-human-review-vps-readiness-chirho
bun run check-human-review-vps-deployment-templates-chirho
bun run check-human-review-vps-smoke-evidence-chirho -- --template-ok-chirho
bun run check-human-review-vps-provisioning-decision-chirho -- --template-ok-chirho
bun run inventory-human-review-vps-candidates-chirho
bun run check-certification-chirho
git status --short
```

Proceed only if the preflight passes and the remaining working-tree changes are
understood. Do not copy `.env`, API keys, or unreviewed scratch directories to
the host.

The provider inventory command is read-only. It lists existing Hetzner servers,
DigitalOcean droplets if the token is usable, and existing `bible.systems`
review DNS records. It must not create a server or DNS record.

Before provisioning or reusing a host, copy the provisioning decision template,
fill the exact owner approval, host, DNS plan, inventory snapshot, and safety
acknowledgements, then verify it:

```bash
cp spec-chirho/reviewer-deployment-chirho/human-review-vps-provisioning-decision-template-2026-07-02-chirho.json \
  spec-chirho/reviewer-deployment-chirho/human-review-vps-provisioning-decision-YYYY-MM-DD-chirho.json
bun run check-human-review-vps-provisioning-decision-chirho -- \
  --decision-chirho=spec-chirho/reviewer-deployment-chirho/human-review-vps-provisioning-decision-YYYY-MM-DD-chirho.json
```

An inventory-backed non-completed starter exists at
`spec-chirho/reviewer-deployment-chirho/human-review-vps-provisioning-decision-draft-2026-07-02-chirho.json`.
It records the current read-only provider inventory but is not approval and must
not be passed off as a completed decision until the owner fills the approval,
host, budget, DNS, and safety fields.
The owner-facing approval summary is
`spec-chirho/reviewer-deployment-chirho/human-review-vps-owner-approval-handoff-2026-07-02-chirho.md`.

Do not create a billable resource, reuse an existing host as write-owner, or add
review DNS records unless the completed decision verifier passes.

## 1. Host Shape Chirho

Create one write-owning review host. The expected layout is:

```text
/srv/hottp-review-chirho/current
/srv/hottp-review-chirho/backups-chirho
/etc/hottp-review-chirho.env
```

The host needs Bun, Caddy, `rsync`, and enough disk for `workspace-chirho/`.
Exactly one host owns write-capable review servers at a time.

## 2. Sync Chirho

Print the reviewed rsync command shape first:

```bash
bun run sync-human-review-vps-chirho -- --print-command-chirho
```

Then run a host-targeted dry-run and inspect its output:

```bash
bun run sync-human-review-vps-chirho -- --host-chirho=REVIEW_HOST_CHIRHO
```

Before the real sync, record the write lease that makes the VPS the canonical
writer and proves local review writers are stopped:

```bash
bun run check-human-review-vps-write-lease-chirho -- \
  --lease-chirho=spec-chirho/reviewer-deployment-chirho/human-review-vps-write-lease-YYYY-MM-DD-chirho.json \
  --host-chirho=REVIEW_HOST_CHIRHO
```

Run the real sync only after inspecting the dry-run:

```bash
bun run sync-human-review-vps-chirho -- \
  --host-chirho=REVIEW_HOST_CHIRHO \
  --decision-chirho=spec-chirho/reviewer-deployment-chirho/human-review-vps-provisioning-decision-YYYY-MM-DD-chirho.json \
  --write-lease-chirho=spec-chirho/reviewer-deployment-chirho/human-review-vps-write-lease-YYYY-MM-DD-chirho.json \
  --apply-chirho
```

This copies ignored `workspace-chirho/` assets intentionally. A git clone alone
is not enough for the review stations. The helper excludes `.git/`, `.env`,
`.env.*`, Wrangler local state, `node_modules/`, `app-chirho/.svelte-kit/`,
local `backups-chirho/` quarantine artifacts, duplicate derived SQLite files
outside the canonical `spec-chirho/` DB set, and SQLite sidecar files
(`*.sqlite-wal`, `*.sqlite-shm`, `*.sqlite-journal`), and
refuses a non-dry-run sync unless `--apply-chirho` is explicit. A real sync also requires a completed
provisioning decision, and the sync host must match that decision's selected
host name or address. It also requires the completed write lease to match the
sync host and owner approval reference before copying the canonical DB to the
VPS. Before a real sync starts, the helper refuses a non-empty
`spec-chirho/progress-chirho.sqlite-wal` or rollback journal so the copied main
SQLite file is checkpointed state, not a stale base file plus an ignored sidecar.
It also checks local `127.0.0.1` ports `8766`, `8770`, and `8771`; if any
write-capable review server is still listening locally, sync-out aborts before
rsync starts so the canonical SQLite snapshot is not copied while local writes
can race it. It also checks the remote `hottp-raw-review-chirho.service`,
`hottp-latin-symbol-review-chirho.service`, and
`hottp-expert-review-chirho.service` units before rsync; if any are active,
sync-out aborts so the remote live tree is not overwritten under a running
review server.

## 3. Host Install Chirho

On the host:

```bash
cd /srv/hottp-review-chirho/current
bun install --frozen-lockfile
bun run check-human-review-vps-readiness-chirho
```

From the source workstation, print the host preflight command shape:

```bash
bun run check-human-review-vps-host-preflight-chirho -- --print-command-chirho
```

The real host preflight also reruns
`bun run check-human-review-vps-readiness-chirho` from
`/srv/hottp-review-chirho/current`, so the synced VPS tree must have the same
review packets, scripts, and commit-back docs as the source workstation before
smoke completion can pass.

Provision `/etc/hottp-review-chirho.env` outside git. It should contain only
host-local settings such as the fallback reviewer id and any service path
overrides. Do not put secrets in committed files.
For the first Caddy basic-auth deployment, keep
`HOTTP_TRUSTED_REVIEWER_HEADER_CHIRHO=x-webauth-user` so the servers ignore any
forged `Cf-Access-Authenticated-User-Email` header.
With that env var set, writes without the configured trusted header must fail;
the local `--reviewer` fallback is only for trusted local/dev sessions where no
production trusted-header env var is configured.

Use the committed template as the starting point:

```bash
sudo install -m 0600 spec-chirho/reviewer-deployment-chirho/human-review-vps-env-template-2026-07-02-chirho.env \
  /etc/hottp-review-chirho.env
sudo editor /etc/hottp-review-chirho.env
```

Generate the Caddy password hash on the host:

```bash
caddy hash-password
```

## 4. Caddy Boundary Chirho

Use separate hostnames so each review app remains mounted at `/`. Start from the
committed Caddyfile template:

```bash
sudo install -m 0644 spec-chirho/reviewer-deployment-chirho/human-review-vps-caddyfile-template-2026-07-02-chirho.caddyfile \
  /etc/caddy/Caddyfile
sudo mkdir -p /etc/systemd/system/caddy.service.d
sudo install -m 0644 spec-chirho/reviewer-deployment-chirho/human-review-caddy-env-2026-07-02-chirho.conf \
  /etc/systemd/system/caddy.service.d/hottp-review-chirho.conf
sudo editor /etc/caddy/Caddyfile
sudo systemctl daemon-reload
sudo caddy validate --envfile /etc/hottp-review-chirho.env --config /etc/caddy/Caddyfile
sudo systemctl restart caddy
```

If Cloudflare Access is used instead of Caddy basic auth, the trusted header is
`Cf-Access-Authenticated-User-Email`. Do not let arbitrary public clients set
either trusted header directly. The basic-auth template strips both trusted
identity headers from incoming clients before injecting `X-Webauth-User` from
Caddy's authenticated user. The checked template uses `basic_auth`,
`header_up -Cf-Access-Authenticated-User-Email`, `header_up -X-Webauth-User`,
and `header_up X-Webauth-User {http.auth.user.id}`.

## 5. Start Raw Hebrew First Chirho

Start only raw Hebrew for the first smoke:

```bash
cd /srv/hottp-review-chirho/current
sudo install -m 0644 spec-chirho/reviewer-deployment-chirho/human-review-raw-hebrew-2026-07-02-chirho.service \
  /etc/systemd/system/hottp-raw-review-chirho.service
sudo systemctl daemon-reload
sudo systemctl start hottp-raw-review-chirho
sudo systemctl status hottp-raw-review-chirho --no-pager
```

Before opening the public hostname, prove the raw server is localhost-bound:

```bash
bun run check-human-review-vps-host-preflight-chirho -- --host-chirho=REVIEW_HOST_CHIRHO
curl -fsS http://127.0.0.1:8766/api-chirho/server-health-chirho
curl --connect-timeout 3 http://REVIEW_HOST_CHIRHO:8766/ || true
```

The localhost health request should succeed. The direct public-port request
should fail or be blocked; public traffic must go through Caddy.
The host preflight also checks that every review `reverse_proxy` block in the
installed `/etc/caddy/Caddyfile` strips both incoming identity headers and
injects `X-Webauth-User` from the authenticated Caddy user before proxying to
its localhost review server.

## 6. Remote Reviewer Smoke Chirho

Before the browser smoke, copy the evidence template:

```bash
cp spec-chirho/reviewer-deployment-chirho/human-review-vps-smoke-evidence-template-2026-07-02-chirho.json \
  spec-chirho/reviewer-deployment-chirho/human-review-vps-smoke-evidence-YYYY-MM-DD-chirho.json
```

From the reviewer browser:

1. Open `https://raw-review.example-chirho.org/`.
2. Confirm the page shows `Pass C Hebrew Validation`.
3. Open one item and verify target crop, full line, issue flags, clean
   acknowledgement, and segment repair proposal panel are visible.
4. Do not clean-certify a real item merely for smoke.
5. For the first write smoke, use a deliberately reversible issue flag chosen
   by the project owner. Record the item id, validation id, gateway reviewer
   identity, and the saved-after/saved-before timestamp window before copying
   state back.

After any write smoke, stop the server and copy state back before continuing.

## 7. Commit-Back Proof Chirho

On the host, stop the server, then re-check the write lease before
copying state back:

```bash
cp spec-chirho/reviewer-deployment-chirho/human-review-vps-write-lease-template-2026-07-02-chirho.json \
  spec-chirho/reviewer-deployment-chirho/human-review-vps-write-lease-YYYY-MM-DD-chirho.json
bun run check-human-review-vps-write-lease-chirho -- \
  --lease-chirho=spec-chirho/reviewer-deployment-chirho/human-review-vps-write-lease-YYYY-MM-DD-chirho.json \
  --host-chirho=REVIEW_HOST_CHIRHO
```

The completed lease must state that the VPS is the canonical writer, local
write-capable review servers are stopped, the remote review server is stopped
before pull-back, and the SQLite snapshot is quarantine-only with JSON replay.
Do not run pull-back `--apply-chirho` without a passing lease. The pull helper
also measures local `127.0.0.1` ports `8766`, `8770`, and `8771` during
`--apply-chirho`; if raw Hebrew, Latin/symbol, or expert review is still
listening locally, pull-back aborts before rsync starts. It also checks the
remote `hottp-raw-review-chirho.service`,
`hottp-latin-symbol-review-chirho.service`, and
`hottp-expert-review-chirho.service` units before copying state back; if any
are active, pull-back aborts so copied artifacts come from a stopped review
host. It also refuses a non-empty remote
`spec-chirho/progress-chirho.sqlite-wal` or rollback journal before pulling the
quarantined SQLite snapshot, so the copied main file is not known-stale relative
to an ignored sidecar. A real pull-back also requires a completed provisioning
decision, and the pull host must match that decision's selected host name or address. The write lease
`owner_approval_reference_chirho` must match the provisioning decision
`owner_approval_chirho.approval_reference_chirho`.

Then copy the review state back:

```bash
bun run pull-human-review-vps-state-chirho -- --print-command-chirho
bun run pull-human-review-vps-state-chirho -- --host-chirho=REVIEW_HOST_CHIRHO
bun run pull-human-review-vps-state-chirho -- \
  --host-chirho=REVIEW_HOST_CHIRHO \
  --decision-chirho=spec-chirho/reviewer-deployment-chirho/human-review-vps-provisioning-decision-YYYY-MM-DD-chirho.json \
  --write-lease-chirho=spec-chirho/reviewer-deployment-chirho/human-review-vps-write-lease-YYYY-MM-DD-chirho.json \
  --apply-chirho
bun run check-pass-c-human-review-server-guards-chirho
bun run transcription-certification-status-chirho
bun run check-certification-strict-status-chirho
git status --short
```

The default pull is raw-Hebrew-only and pulls the remote database to a
quarantined local path
`backups-chirho/vps-snapshot-progress-chirho.sqlite` to protect local agent logs
from being clobbered, alongside the Pass-C human validation JSON backup. The
local live `spec-chirho/progress-chirho.sqlite` must never be directly
overwritten, and the quarantined SQLite snapshot is for replay/forensics only,
not for staging as the canonical DB.

To replay Pass-C rows from the quarantined snapshot, first dry-run against the
snapshot DB:

```bash
bun run apply-pass-c-human-validations-chirho -- \
  --db=backups-chirho/vps-snapshot-progress-chirho.sqlite \
  --backup-chirho=spec-chirho/metropoliluya-chirho/pass-c-human-validations-backup-2026-06-01-chirho.json
```

Only run `--apply` after the dry-run output gives the exact selected row count
and validation ids, then supply the same explicit `--backup-chirho=...`,
`--expected-row-count-chirho=<count>` and one
`--expected-validation-id-chirho=<id>` flag per selected row.

If the smoke deliberately saved a draft segment repair proposal, add
`--include-segment-repair-proposals-chirho`. For later expert supplied-text
work, use `--station-chirho=expert-non-latin-chirho` and add
`--include-expert-supplied-backup-chirho`; add
`--include-workspace-spans-chirho` only when an expert-supplied text action
changed live span JSON.

Stage only intentional review artifacts. If the smoke action was meant to be
temporary, restore from the pre-smoke backup and prove `git status --short` no
longer shows the smoke artifact.

Fill the evidence file and verify it:

For this Caddy Basic Auth deployment path, keep
`trusted_header_chirho` set to `X-Webauth-User`. The reusable smoke evidence
checker can validate other gateway modes, but the Phase 6 completion audit
rejects `Cf-Access-Authenticated-User-Email` evidence for this Caddy path so a
forged or wrong identity namespace cannot satisfy the final gate.
Set `write_smoke_chirho.expected_reviewer_chirho` to the reviewer identity
provided by the gateway. Do not use the server fallback reviewer value; the
evidence verifier rejects fallback-looking identities because they mean the
trusted header chain was not proven.

```bash
bun run check-human-review-vps-smoke-evidence-chirho -- \
  --live-probe-chirho \
  --evidence-chirho=spec-chirho/reviewer-deployment-chirho/human-review-vps-smoke-evidence-YYYY-MM-DD-chirho.json
bun run check-human-review-vps-first-smoke-completion-chirho -- \
  --decision-chirho=spec-chirho/reviewer-deployment-chirho/human-review-vps-provisioning-decision-YYYY-MM-DD-chirho.json \
  --evidence-chirho=spec-chirho/reviewer-deployment-chirho/human-review-vps-smoke-evidence-YYYY-MM-DD-chirho.json \
  --pass-c-backup-chirho=spec-chirho/metropoliluya-chirho/pass-c-human-validations-backup-2026-06-01-chirho.json \
  --live-probe-chirho
bun run check-human-review-vps-phase6-completion-chirho -- \
  --decision-chirho=spec-chirho/reviewer-deployment-chirho/human-review-vps-provisioning-decision-YYYY-MM-DD-chirho.json \
  --evidence-chirho=spec-chirho/reviewer-deployment-chirho/human-review-vps-smoke-evidence-YYYY-MM-DD-chirho.json \
  --write-lease-chirho=spec-chirho/reviewer-deployment-chirho/human-review-vps-write-lease-YYYY-MM-DD-chirho.json \
  --pass-c-backup-chirho=spec-chirho/metropoliluya-chirho/pass-c-human-validations-backup-2026-06-01-chirho.json \
  --live-probe-chirho
```

Do not mark the first VPS smoke complete unless both completed evidence checks
pass and the Phase 6 completion audit passes. In real mode, the completion audit
also runs the SSH host preflight against the selected host before accepting the
smoke result. The cross-check proves the decision host and raw-review DNS name
match the actual smoke evidence, that the named smoke validation row exists in
the pulled-back Pass-C backup with the gateway reviewer identity and timestamp
window recorded in the evidence, and that the write lease matches the selected
host and owner approval reference before pull-back. The live probe checks that
the authenticated URL rejects unauthenticated requests and that the
direct public review port does not answer.

## 8. Add Other Stations Chirho

Add `:8770` and `:8771` only after the raw Hebrew commit-back proof works:

```bash
sudo install -m 0644 spec-chirho/reviewer-deployment-chirho/human-review-latin-symbol-2026-07-02-chirho.service \
  /etc/systemd/system/hottp-latin-symbol-review-chirho.service
sudo install -m 0644 spec-chirho/reviewer-deployment-chirho/human-review-expert-non-latin-2026-07-02-chirho.service \
  /etc/systemd/system/hottp-expert-review-chirho.service
sudo systemctl daemon-reload
sudo systemctl start hottp-latin-symbol-review-chirho
sudo systemctl start hottp-expert-review-chirho
sudo systemctl status hottp-latin-symbol-review-chirho --no-pager
sudo systemctl status hottp-expert-review-chirho --no-pager
bun run review-servers-chirho -- --check-chirho
```

Repeat the same Caddy-authenticated browser smoke and commit-back proof for each
station. Use `--station-chirho=latin-symbol-chirho`,
`--station-chirho=expert-non-latin-chirho`, or `--station-chirho=all-chirho`
with the pull helper to bring back the relevant review artifacts.
