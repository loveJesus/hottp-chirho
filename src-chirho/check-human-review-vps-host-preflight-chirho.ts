// For God so loved the world that he gave his only begotten Son,
// that whoever believes in him should not perish but have eternal life. John 3:16

const MODULE_CHIRHO = "check-human-review-vps-host-preflight-chirho";
const DEFAULT_REMOTE_USER_CHIRHO = "hottp-review-chirho";

const CADDY_TRUSTED_HEADER_BLOCK_CHECK_CHIRHO = String.raw`awk '
BEGIN {
  expected_chirho["8766"] = 1
  expected_chirho["8770"] = 1
  expected_chirho["8771"] = 1
}
{
  line_chirho = $0
  sub(/^[ \t]+/, "", line_chirho)
  if (line_chirho ~ /^#/) next
  if (line_chirho ~ /^reverse_proxy[ \t]+127[.]0[.]0[.]1:(8766|8770|8771)[ \t]*[{][ \t]*$/) {
    split(line_chirho, host_parts_chirho, ":")
    split(host_parts_chirho[2], port_parts_chirho, /[ \t{]/)
    current_port_chirho = port_parts_chirho[1]
    in_proxy_chirho = 1
    strip_cf_chirho = 0
    strip_webauth_chirho = 0
    inject_webauth_chirho = 0
    next
  }
  if (in_proxy_chirho == 1) {
    if (line_chirho == "header_up -Cf-Access-Authenticated-User-Email") strip_cf_chirho = 1
    if (line_chirho == "header_up -X-Webauth-User") strip_webauth_chirho = 1
    if (line_chirho == "header_up X-Webauth-User {http.auth.user.id}") inject_webauth_chirho = 1
    if (line_chirho ~ /^[}][ \t]*$/) {
      if (strip_cf_chirho != 1 || strip_webauth_chirho != 1 || inject_webauth_chirho != 1) {
        printf("reverse_proxy 127.0.0.1:%s lacks trusted reviewer header strip/inject lines\n", current_port_chirho) > "/dev/stderr"
        exit 1
      }
      seen_chirho[current_port_chirho] = 1
      in_proxy_chirho = 0
    }
  }
}
END {
  for (port_chirho in expected_chirho) {
    if (seen_chirho[port_chirho] != 1) {
      printf("missing reverse_proxy trusted-header block for 127.0.0.1:%s\n", port_chirho) > "/dev/stderr"
      exit 1
    }
  }
}
' /etc/caddy/Caddyfile`;

const HOST_CHECK_COMMANDS_CHIRHO = [
  "command -v bun",
  "bun --version",
  "command -v caddy",
  "caddy version",
  "command -v rsync",
  "rsync --version >/dev/null",
  "command -v magick >/dev/null || command -v convert >/dev/null",
  "test -d /srv/hottp-review-chirho/current",
  "test -d /srv/hottp-review-chirho/backups-chirho",
  "cd /srv/hottp-review-chirho/current && bun run check-human-review-vps-readiness-chirho",
  "test -f /etc/hottp-review-chirho.env",
  "test \"$(stat -c %a /etc/hottp-review-chirho.env 2>/dev/null || stat -f %Lp /etc/hottp-review-chirho.env)\" = 600",
  "sudo grep -q '^HOTTP_REVIEW_FALLBACK_REVIEWER_CHIRHO=' /etc/hottp-review-chirho.env",
  "sudo grep -q '^HOTTP_TRUSTED_REVIEWER_HEADER_CHIRHO=x-webauth-user$' /etc/hottp-review-chirho.env",
  "sudo grep -q '^HOTTP_REVIEW_USER_CHIRHO=' /etc/hottp-review-chirho.env",
  "sudo grep -q '^HOTTP_REVIEW_PASSWORD_HASH_CHIRHO=' /etc/hottp-review-chirho.env",
  "test -f /etc/caddy/Caddyfile",
  "test -f /etc/systemd/system/caddy.service.d/hottp-review-chirho.conf",
  "grep -q 'auto_https disable_redirects' /etc/caddy/Caddyfile",
  "grep -q 'tls internal' /etc/caddy/Caddyfile",
  "sudo caddy validate --envfile /etc/hottp-review-chirho.env --config /etc/caddy/Caddyfile",
  CADDY_TRUSTED_HEADER_BLOCK_CHECK_CHIRHO,
  "test -f /etc/systemd/system/hottp-raw-review-chirho.service",
  "systemctl is-enabled hottp-raw-review-chirho.service >/dev/null",
  "systemctl is-active hottp-raw-review-chirho.service >/dev/null",
  "curl -fsS http://127.0.0.1:8766/api-chirho/server-health-chirho >/dev/null",
] as const;

function parseArgValueChirho(argsChirho: string[], nameChirho: string): string | null {
  const prefixChirho = `--${nameChirho}=`;
  const matchChirho = argsChirho.find((argChirho) => argChirho.startsWith(prefixChirho));
  return matchChirho === undefined ? null : matchChirho.slice(prefixChirho.length);
}

function failChirho(messageChirho: string): never {
  throw new Error(messageChirho);
}

function assertSafeTokenChirho(valueChirho: string, labelChirho: string): string {
  const trimmedChirho = valueChirho.trim();
  if (!/^[A-Za-z0-9._-]+$/.test(trimmedChirho)) {
    failChirho(`${labelChirho} must contain only letters, digits, dots, underscores, or dashes`);
  }
  return trimmedChirho;
}

function shellQuoteChirho(valueChirho: string): string {
  return `'${valueChirho.replace(/'/g, "'\"'\"'")}'`;
}

function remoteScriptChirho(): string {
  return [
    "set -euo pipefail",
    ...HOST_CHECK_COMMANDS_CHIRHO.map((commandChirho) => `printf '%s\\n' ${shellQuoteChirho(`+ ${commandChirho}`)} && ${commandChirho}`),
  ].join("\n");
}

function mainChirho(): void {
  const argsChirho = process.argv.slice(2);
  const printOnlyChirho = argsChirho.includes("--print-command-chirho");
  const hostArgChirho = parseArgValueChirho(argsChirho, "host-chirho");
  if (hostArgChirho === null && !printOnlyChirho) {
    failChirho("missing required --host-chirho=REVIEW_HOST_CHIRHO");
  }
  const hostChirho = assertSafeTokenChirho(hostArgChirho ?? "REVIEW_HOST_CHIRHO", "host-chirho");
  const remoteUserChirho = assertSafeTokenChirho(
    parseArgValueChirho(argsChirho, "remote-user-chirho") ?? DEFAULT_REMOTE_USER_CHIRHO,
    "remote-user-chirho"
  );
  const commandChirho = ["ssh", `${remoteUserChirho}@${hostChirho}`, "bash", "-s"];
  console.log(`[${MODULE_CHIRHO}] ${commandChirho.map(shellQuoteChirho).join(" ")}`);
  console.log(remoteScriptChirho());
  if (printOnlyChirho) return;
  if (hostChirho === "REVIEW_HOST_CHIRHO") {
    failChirho("real host preflight requires a real --host-chirho value");
  }
  const stdinChirho = new TextEncoder().encode(remoteScriptChirho());
  const resultChirho = Bun.spawnSync(commandChirho, {
    stdin: stdinChirho,
    stdout: "inherit",
    stderr: "inherit",
  });
  if (resultChirho.exitCode !== 0) {
    failChirho(`remote host preflight exited with code ${resultChirho.exitCode}`);
  }
}

if (import.meta.main) {
  try {
    mainChirho();
  } catch (errorChirho) {
    const messageChirho = errorChirho instanceof Error ? errorChirho.message : String(errorChirho);
    console.error(`[${MODULE_CHIRHO}] ${messageChirho}`);
    process.exit(1);
  }
}
