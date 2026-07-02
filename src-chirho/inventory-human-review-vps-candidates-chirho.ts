// For God so loved the world that he gave his only begotten Son,
// that whoever believes in him should not perish but have eternal life. John 3:16

const MODULE_CHIRHO = "inventory-human-review-vps-candidates-chirho";
const REVIEW_DNS_NAMES_CHIRHO = [
  "raw-review.bible.systems",
  "latin-review.bible.systems",
  "expert-review.bible.systems",
] as const;

interface ProviderStatusChirho {
  okChirho: boolean;
  messageChirho: string;
}

interface HetznerServerChirho {
  idChirho: number;
  nameChirho: string;
  statusChirho: string;
  typeChirho: string;
  locationChirho: string;
  ipv4Chirho: string | null;
}

interface DigitalOceanDropletChirho {
  idChirho: number;
  nameChirho: string;
  statusChirho: string;
  sizeChirho: string;
  regionChirho: string;
  ipv4Chirho: string | null;
}

interface CloudflareDnsRecordChirho {
  nameChirho: string;
  typeChirho: string;
  contentChirho: string;
  proxiedChirho: boolean;
}

interface ProviderInventoryChirho {
  generatedAtChirho: string;
  hetznerChirho: ProviderStatusChirho & { serversChirho: HetznerServerChirho[] };
  digitalOceanChirho: ProviderStatusChirho & { dropletsChirho: DigitalOceanDropletChirho[] };
  cloudflareChirho: ProviderStatusChirho & {
    zoneNameChirho: string;
    zoneFoundChirho: boolean;
    recordsChirho: CloudflareDnsRecordChirho[];
  };
}

async function fetchJsonChirho(urlChirho: string, headersChirho: Record<string, string>): Promise<unknown> {
  const responseChirho = await fetch(urlChirho, { headers: headersChirho });
  if (!responseChirho.ok) {
    throw new Error(`HTTP ${responseChirho.status}`);
  }
  return await responseChirho.json();
}

function envChirho(nameChirho: string): string | null {
  const valueChirho = process.env[nameChirho]?.trim();
  return valueChirho === undefined || valueChirho.length === 0 ? null : valueChirho;
}

function stringValueChirho(valueChirho: unknown): string {
  return typeof valueChirho === "string" ? valueChirho : "";
}

function numberValueChirho(valueChirho: unknown): number {
  return typeof valueChirho === "number" && Number.isFinite(valueChirho) ? valueChirho : 0;
}

function arrayValueChirho(valueChirho: unknown): unknown[] {
  return Array.isArray(valueChirho) ? valueChirho : [];
}

function recordValueChirho(valueChirho: unknown): Record<string, unknown> {
  return valueChirho !== null && typeof valueChirho === "object" && !Array.isArray(valueChirho)
    ? (valueChirho as Record<string, unknown>)
    : {};
}

async function hetznerInventoryChirho(): Promise<ProviderInventoryChirho["hetznerChirho"]> {
  const tokenChirho = envChirho("HETZNER_API_TOKEN_CHIRHO");
  if (tokenChirho === null) {
    return { okChirho: false, messageChirho: "HETZNER_API_TOKEN_CHIRHO is not set", serversChirho: [] };
  }
  try {
    const bodyChirho = recordValueChirho(
      await fetchJsonChirho("https://api.hetzner.cloud/v1/servers", {
        Authorization: `Bearer ${tokenChirho}`,
      })
    );
    const serversChirho = arrayValueChirho(bodyChirho.servers).map((serverValueChirho) => {
      const serverChirho = recordValueChirho(serverValueChirho);
      const publicNetChirho = recordValueChirho(serverChirho.public_net);
      const ipv4Chirho = recordValueChirho(publicNetChirho.ipv4);
      const serverTypeChirho = recordValueChirho(serverChirho.server_type);
      const datacenterChirho = recordValueChirho(serverChirho.datacenter);
      const locationChirho = recordValueChirho(datacenterChirho.location);
      return {
        idChirho: numberValueChirho(serverChirho.id),
        nameChirho: stringValueChirho(serverChirho.name),
        statusChirho: stringValueChirho(serverChirho.status),
        typeChirho: stringValueChirho(serverTypeChirho.name),
        locationChirho: stringValueChirho(locationChirho.name),
        ipv4Chirho: stringValueChirho(ipv4Chirho.ip) || null,
      };
    });
    return { okChirho: true, messageChirho: `found ${serversChirho.length} server(s)`, serversChirho };
  } catch (errorChirho) {
    const messageChirho = errorChirho instanceof Error ? errorChirho.message : String(errorChirho);
    return { okChirho: false, messageChirho, serversChirho: [] };
  }
}

async function digitalOceanInventoryChirho(): Promise<ProviderInventoryChirho["digitalOceanChirho"]> {
  const tokenChirho = envChirho("DIGITAL_OCEAN_API_TOKEN_CHIRHO");
  if (tokenChirho === null) {
    return { okChirho: false, messageChirho: "DIGITAL_OCEAN_API_TOKEN_CHIRHO is not set", dropletsChirho: [] };
  }
  try {
    const bodyChirho = recordValueChirho(
      await fetchJsonChirho("https://api.digitalocean.com/v2/droplets", {
        Authorization: `Bearer ${tokenChirho}`,
      })
    );
    const dropletsChirho = arrayValueChirho(bodyChirho.droplets).map((dropletValueChirho) => {
      const dropletChirho = recordValueChirho(dropletValueChirho);
      const regionChirho = recordValueChirho(dropletChirho.region);
      const networksChirho = recordValueChirho(dropletChirho.networks);
      const publicIpv4Chirho = arrayValueChirho(networksChirho.v4)
        .map(recordValueChirho)
        .find((networkChirho) => networkChirho.type === "public");
      return {
        idChirho: numberValueChirho(dropletChirho.id),
        nameChirho: stringValueChirho(dropletChirho.name),
        statusChirho: stringValueChirho(dropletChirho.status),
        sizeChirho: stringValueChirho(dropletChirho.size_slug),
        regionChirho: stringValueChirho(regionChirho.slug),
        ipv4Chirho: publicIpv4Chirho === undefined ? null : stringValueChirho(publicIpv4Chirho.ip_address),
      };
    });
    return { okChirho: true, messageChirho: `found ${dropletsChirho.length} droplet(s)`, dropletsChirho };
  } catch (errorChirho) {
    const messageChirho = errorChirho instanceof Error ? errorChirho.message : String(errorChirho);
    return { okChirho: false, messageChirho, dropletsChirho: [] };
  }
}

async function cloudflareInventoryChirho(): Promise<ProviderInventoryChirho["cloudflareChirho"]> {
  const emailChirho = envChirho("CLOUDFLARE_GLOBAL_API_EMAIL_CHIRHO");
  const keyChirho = envChirho("CLOUDFLARE_GLOBAL_API_KEY_CHIRHO");
  if (emailChirho === null || keyChirho === null) {
    return {
      okChirho: false,
      messageChirho: "Cloudflare global email/key are not set",
      zoneNameChirho: "bible.systems",
      zoneFoundChirho: false,
      recordsChirho: [],
    };
  }
  try {
    const zoneBodyChirho = recordValueChirho(
      await fetchJsonChirho("https://api.cloudflare.com/client/v4/zones?name=bible.systems", {
        "X-Auth-Email": emailChirho,
        "X-Auth-Key": keyChirho,
      })
    );
    const zoneChirho = arrayValueChirho(zoneBodyChirho.result).map(recordValueChirho)[0];
    if (zoneChirho === undefined) {
      return {
        okChirho: true,
        messageChirho: "bible.systems zone not found",
        zoneNameChirho: "bible.systems",
        zoneFoundChirho: false,
        recordsChirho: [],
      };
    }
    const zoneIdChirho = stringValueChirho(zoneChirho.id);
    const recordResultsChirho: CloudflareDnsRecordChirho[] = [];
    for (const nameChirho of REVIEW_DNS_NAMES_CHIRHO) {
      const encodedNameChirho = encodeURIComponent(nameChirho);
      const recordBodyChirho = recordValueChirho(
        await fetchJsonChirho(
          `https://api.cloudflare.com/client/v4/zones/${zoneIdChirho}/dns_records?name=${encodedNameChirho}`,
          {
            "X-Auth-Email": emailChirho,
            "X-Auth-Key": keyChirho,
          }
        )
      );
      for (const recordChirho of arrayValueChirho(recordBodyChirho.result).map(recordValueChirho)) {
        recordResultsChirho.push({
          nameChirho: stringValueChirho(recordChirho.name),
          typeChirho: stringValueChirho(recordChirho.type),
          contentChirho: stringValueChirho(recordChirho.content),
          proxiedChirho: recordChirho.proxied === true,
        });
      }
    }
    return {
      okChirho: true,
      messageChirho: `found ${recordResultsChirho.length} review DNS record(s)`,
      zoneNameChirho: "bible.systems",
      zoneFoundChirho: true,
      recordsChirho: recordResultsChirho,
    };
  } catch (errorChirho) {
    const messageChirho = errorChirho instanceof Error ? errorChirho.message : String(errorChirho);
    return {
      okChirho: false,
      messageChirho,
      zoneNameChirho: "bible.systems",
      zoneFoundChirho: false,
      recordsChirho: [],
    };
  }
}

function markdownChirho(inventoryChirho: ProviderInventoryChirho): string {
  const linesChirho = [
    `# Human Review VPS Candidate Inventory Chirho`,
    "",
    `Generated: ${inventoryChirho.generatedAtChirho}`,
    "",
    "This is read-only provider inventory. It does not create servers, DNS records, or billable resources.",
    "",
    "## Hetzner Chirho",
    "",
    `Status: ${inventoryChirho.hetznerChirho.okChirho ? "ok" : "not-ok"} - ${inventoryChirho.hetznerChirho.messageChirho}`,
    "",
  ];
  for (const serverChirho of inventoryChirho.hetznerChirho.serversChirho) {
    linesChirho.push(
      `- ${serverChirho.nameChirho} (${serverChirho.statusChirho}, ${serverChirho.typeChirho}, ${serverChirho.locationChirho || "unknown-location"}, ${serverChirho.ipv4Chirho ?? "no-ipv4"})`
    );
  }
  linesChirho.push(
    "",
    "## DigitalOcean Chirho",
    "",
    `Status: ${inventoryChirho.digitalOceanChirho.okChirho ? "ok" : "not-ok"} - ${inventoryChirho.digitalOceanChirho.messageChirho}`,
    ""
  );
  for (const dropletChirho of inventoryChirho.digitalOceanChirho.dropletsChirho) {
    linesChirho.push(
      `- ${dropletChirho.nameChirho} (${dropletChirho.statusChirho}, ${dropletChirho.sizeChirho}, ${dropletChirho.regionChirho}, ${dropletChirho.ipv4Chirho ?? "no-ipv4"})`
    );
  }
  linesChirho.push(
    "",
    "## Cloudflare Review DNS Chirho",
    "",
    `Status: ${inventoryChirho.cloudflareChirho.okChirho ? "ok" : "not-ok"} - ${inventoryChirho.cloudflareChirho.messageChirho}`,
    ""
  );
  if (inventoryChirho.cloudflareChirho.recordsChirho.length === 0) {
    linesChirho.push("- No existing raw/Latin/expert review DNS records found.");
  } else {
    for (const recordChirho of inventoryChirho.cloudflareChirho.recordsChirho) {
      linesChirho.push(
        `- ${recordChirho.nameChirho} ${recordChirho.typeChirho} ${recordChirho.contentChirho} proxied=${recordChirho.proxiedChirho}`
      );
    }
  }
  return `${linesChirho.join("\n")}\n`;
}

async function mainChirho(): Promise<void> {
  const inventoryChirho: ProviderInventoryChirho = {
    generatedAtChirho: new Date().toISOString(),
    hetznerChirho: await hetznerInventoryChirho(),
    digitalOceanChirho: await digitalOceanInventoryChirho(),
    cloudflareChirho: await cloudflareInventoryChirho(),
  };
  if (process.argv.includes("--json-chirho")) {
    console.log(JSON.stringify(inventoryChirho, null, 2));
  } else {
    console.log(markdownChirho(inventoryChirho));
  }
}

if (import.meta.main) {
  try {
    await mainChirho();
  } catch (errorChirho) {
    const messageChirho = errorChirho instanceof Error ? errorChirho.message : String(errorChirho);
    console.error(`[${MODULE_CHIRHO}] ${messageChirho}`);
    process.exit(1);
  }
}
