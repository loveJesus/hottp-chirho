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

Run the real sync only after inspecting the dry-run:

```bash
bun run sync-human-review-vps-chirho -- --host-chirho=REVIEW_HOST_CHIRHO --apply-chirho
```

This copies ignored `workspace-chirho/` assets intentionally. A git clone alone
is not enough for the review stations. The helper excludes `.git/`, `.env`,
`node_modules/`, and `app-chirho/.svelte-kit/`, and refuses a non-dry-run sync
unless `--apply-chirho` is explicit.

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

Provision `/etc/hottp-review-chirho.env` outside git. It should contain only
host-local settings such as the fallback reviewer id and any service path
overrides. Do not put secrets in committed files.

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
5. For a write smoke, prefer a deliberately reversible issue or draft repair
   proposal chosen by the project owner. Record the item id before saving.

After any write smoke, stop the server and copy state back before continuing.

## 7. Commit-Back Proof Chirho

On the host, stop or pause the server, then copy the review state back:

```bash
bun run pull-human-review-vps-state-chirho -- --print-command-chirho
bun run pull-human-review-vps-state-chirho -- --host-chirho=REVIEW_HOST_CHIRHO
bun run pull-human-review-vps-state-chirho -- --host-chirho=REVIEW_HOST_CHIRHO --apply-chirho
bun run check-pass-c-human-review-server-guards-chirho
bun run transcription-certification-status-chirho
bun run check-certification-strict-status-chirho
git status --short
```

The default pull is raw-Hebrew-only and copies the canonical DB plus the Pass-C
human validation backup. If the smoke deliberately saved a draft segment repair
proposal, add `--include-segment-repair-proposals-chirho`. For later expert
supplied-text work, use `--station-chirho=expert-non-latin-chirho` and add
`--include-expert-supplied-backup-chirho`; add `--include-workspace-spans-chirho`
only when an expert-supplied text action changed live span JSON.

Stage only intentional review artifacts. If the smoke action was meant to be
temporary, restore from the pre-smoke backup and prove `git status --short` no
longer shows the smoke artifact.

Fill the evidence file and verify it:

```bash
bun run check-human-review-vps-smoke-evidence-chirho -- \
  --evidence-chirho=spec-chirho/reviewer-deployment-chirho/human-review-vps-smoke-evidence-YYYY-MM-DD-chirho.json
```

Do not mark Phase 6 complete unless this completed evidence check passes.

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
