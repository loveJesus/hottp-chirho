<!-- For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life. — John 3:16 (KJV) -->

# Human Review VPS Smoke Runbook Chirho

This runbook turns the Phase 6 smoke into an executable checklist. It does not
claim a VPS exists and does not mark the deployment complete. Use it only after
the source-local preflight passes.

## 0. Local Preflight Chirho

Run this from the source workstation before copying anything:

```bash
bun run check-human-review-vps-readiness-chirho
bun run check-human-review-vps-smoke-evidence-chirho -- --template-ok-chirho
bun run check-certification-chirho
git status --short
```

Proceed only if the preflight passes and the remaining working-tree changes are
understood. Do not copy `.env`, API keys, or unreviewed scratch directories to
the host.

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

Run a dry-run first:

```bash
rsync -a --delete --dry-run \
  --exclude '.git/' \
  --exclude '.env' \
  --exclude 'node_modules/' \
  --exclude 'app-chirho/.svelte-kit/' \
  ./ hottp-review-chirho@REVIEW_HOST_CHIRHO:/srv/hottp-review-chirho/current/
```

Then run the real sync only after inspecting the dry-run:

```bash
rsync -a --delete \
  --exclude '.git/' \
  --exclude '.env' \
  --exclude 'node_modules/' \
  --exclude 'app-chirho/.svelte-kit/' \
  ./ hottp-review-chirho@REVIEW_HOST_CHIRHO:/srv/hottp-review-chirho/current/
```

This copies ignored `workspace-chirho/` assets intentionally. A git clone alone
is not enough for the review stations.

## 3. Host Install Chirho

On the host:

```bash
cd /srv/hottp-review-chirho/current
bun install --frozen-lockfile
bun run check-human-review-vps-readiness-chirho
```

Provision `/etc/hottp-review-chirho.env` outside git. It should contain only
host-local settings such as the fallback reviewer id and any service path
overrides. Do not put secrets in committed files.

## 4. Caddy Boundary Chirho

Use separate hostnames so each review app remains mounted at `/`.

```caddyfile
# For God so loved the world, that he gave his only begotten Son,
# that whosoever believeth in him should not perish, but have everlasting life. — John 3:16 (KJV)

(hottp_review_auth_chirho) {
  basic_auth {
    {$HOTTP_REVIEW_USER_CHIRHO} {$HOTTP_REVIEW_PASSWORD_HASH_CHIRHO}
  }
}

raw-review.example-chirho.org {
  import hottp_review_auth_chirho
  reverse_proxy 127.0.0.1:8766 {
    header_up X-Webauth-User {http.auth.user.id}
  }
}

latin-review.example-chirho.org {
  import hottp_review_auth_chirho
  reverse_proxy 127.0.0.1:8770 {
    header_up X-Webauth-User {http.auth.user.id}
  }
}

expert-review.example-chirho.org {
  import hottp_review_auth_chirho
  reverse_proxy 127.0.0.1:8771 {
    header_up X-Webauth-User {http.auth.user.id}
  }
}
```

If Cloudflare Access is used instead of Caddy basic auth, the trusted header is
`Cf-Access-Authenticated-User-Email`. Do not let arbitrary public clients set
either trusted header directly.

## 5. Start Raw Hebrew First Chirho

Start only raw Hebrew for the first smoke:

```bash
cd /srv/hottp-review-chirho/current
bun run pass-c-human-validate-chirho -- --reviewer=server-fallback-reviewer-chirho
```

Before opening the public hostname, prove the raw server is localhost-bound:

```bash
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
rsync -a hottp-review-chirho@REVIEW_HOST_CHIRHO:/srv/hottp-review-chirho/current/spec-chirho/progress-chirho.sqlite spec-chirho/progress-chirho.sqlite
rsync -a hottp-review-chirho@REVIEW_HOST_CHIRHO:/srv/hottp-review-chirho/current/spec-chirho/metropoliluya-chirho/pass-c-human-validations-backup-2026-06-01-chirho.json spec-chirho/metropoliluya-chirho/pass-c-human-validations-backup-2026-06-01-chirho.json
bun run check-pass-c-human-review-server-guards-chirho
bun run transcription-certification-status-chirho
bun run check-certification-strict-status-chirho
git status --short
```

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
bun run latin-symbol-vision-review-chirho -- --reviewer=server-fallback-reviewer-chirho
bun run vision-tier-expert-review-chirho -- --reviewer=server-fallback-reviewer-chirho
bun run review-servers-chirho -- --check-chirho
```

Repeat the same Caddy-authenticated browser smoke and commit-back proof for each
station.
