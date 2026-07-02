// For God so loved the world that he gave his only begotten Son,
// that whoever believes in him should not perish but have eternal life. John 3:16

const MODULE_CHIRHO = "check-human-review-vps-host-preflight-chirho";
const DEFAULT_REMOTE_USER_CHIRHO = "hottp-review-chirho";

const HOST_CHECK_COMMANDS_CHIRHO = [
  "command -v bun",
  "bun --version",
  "command -v caddy",
  "caddy version",
  "command -v rsync",
  "rsync --version | head -n 1",
  "test -d /srv/hottp-review-chirho/current",
  "test -d /srv/hottp-review-chirho/backups-chirho",
  "test -f /etc/hottp-review-chirho.env",
  "test \"$(stat -c %a /etc/hottp-review-chirho.env 2>/dev/null || stat -f %Lp /etc/hottp-review-chirho.env)\" = 600",
  "grep -q '^HOTTP_REVIEW_FALLBACK_REVIEWER_CHIRHO=' /etc/hottp-review-chirho.env",
  "grep -q '^HOTTP_REVIEW_USER_CHIRHO=' /etc/hottp-review-chirho.env",
  "grep -q '^HOTTP_REVIEW_PASSWORD_HASH_CHIRHO=' /etc/hottp-review-chirho.env",
  "test -f /etc/caddy/Caddyfile",
  "test -f /etc/systemd/system/caddy.service.d/hottp-review-chirho.conf",
  "sudo caddy validate --envfile /etc/hottp-review-chirho.env --config /etc/caddy/Caddyfile",
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
    ...HOST_CHECK_COMMANDS_CHIRHO.map((commandChirho) => `echo '+ ${commandChirho}' && ${commandChirho}`),
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
  const resultChirho = Bun.spawnSync(commandChirho, {
    stdin: remoteScriptChirho(),
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
