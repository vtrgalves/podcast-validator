/**
 * Integração real com Oracle Cloud Infrastructure — Object Storage.
 *
 * Server-only. Nenhuma credencial é exposta ao frontend: apenas o resultado
 * (conectado / não configurado e metadados públicos dos objetos) sai daqui.
 *
 * Assinatura de requisição conforme o padrão OCI (draft-cavage HTTP Signatures).
 */
import { createHash, createSign } from "crypto";

export type OciConfig = {
  tenancy: string;
  user: string;
  fingerprint: string;
  privateKey: string;
  region: string;
  namespace: string;
  bucket: string;
};

export const OCI_ENV_VARS = [
  "OCI_TENANCY_OCID",
  "OCI_USER_OCID",
  "OCI_FINGERPRINT",
  "OCI_PRIVATE_KEY",
  "OCI_REGION",
  "OCI_NAMESPACE",
  "OCI_BUCKET",
] as const;

export function missingOciEnv(): string[] {
  return OCI_ENV_VARS.filter((k) => !process.env[k]);
}

export function getOciConfig(): OciConfig | null {
  if (missingOciEnv().length > 0) return null;
  return {
    tenancy: process.env["OCI_TENANCY_OCID"]!,
    user: process.env["OCI_USER_OCID"]!,
    fingerprint: process.env["OCI_FINGERPRINT"]!,
    // A chave pode chegar com \n escapado (env var de uma linha).
    privateKey: process.env["OCI_PRIVATE_KEY"]!.replace(/\\n/g, "\n"),
    region: process.env["OCI_REGION"]!,
    namespace: process.env["OCI_NAMESPACE"]!,
    bucket: process.env["OCI_BUCKET"]!,
  };
}

function host(cfg: OciConfig) {
  return `objectstorage.${cfg.region}.oraclecloud.com`;
}

function sign(cfg: OciConfig, headersToSign: string[], values: Record<string, string>) {
  const signingString = headersToSign.map((h) => `${h}: ${values[h]}`).join("\n");
  const signer = createSign("RSA-SHA256");
  signer.update(signingString);
  signer.end();
  const signature = signer.sign(cfg.privateKey, "base64");
  const keyId = `${cfg.tenancy}/${cfg.user}/${cfg.fingerprint}`;
  return `Signature version="1",keyId="${keyId}",algorithm="rsa-sha256",headers="${headersToSign.join(" ")}",signature="${signature}"`;
}

export async function ociRequest(
  cfg: OciConfig,
  method: "GET" | "HEAD" | "PUT" | "POST",
  path: string,
  body?: Uint8Array,
  contentType?: string,
) {
  const h = host(cfg);
  const date = new Date().toUTCString();
  const values: Record<string, string> = {
    "(request-target)": `${method.toLowerCase()} ${path}`,
    host: h,
    date,
  };
  const headersToSign = ["(request-target)", "host", "date"];
  const headers: Record<string, string> = { date };

  if ((method === "PUT" || method === "POST") && body) {
    const sha = createHash("sha256").update(body).digest("base64");
    values["x-content-sha256"] = sha;
    values["content-type"] = contentType ?? "application/octet-stream";
    values["content-length"] = String(body.byteLength);
    headersToSign.push("x-content-sha256", "content-type", "content-length");
    headers["x-content-sha256"] = sha;
    headers["content-type"] = values["content-type"]!;
    headers["content-length"] = values["content-length"]!;
  }

  headers["authorization"] = sign(cfg, headersToSign, values);

  return fetch(`https://${h}${path}`, {
    method,
    headers,
    ...(body ? { body: body as BodyInit } : {}),
  });
}

const enc = (s: string) => s.split("/").map(encodeURIComponent).join("/");

export type OciObject = { name: string; size: number | null; timeModified: string | null };

/** Lista objetos do bucket configurado. Lança erro se a chamada falhar. */
export async function listObjects(cfg: OciConfig, prefix?: string): Promise<OciObject[]> {
  const qs = new URLSearchParams({ fields: "name,size,timeModified", limit: "100" });
  if (prefix) qs.set("prefix", prefix);
  const path = `/n/${encodeURIComponent(cfg.namespace)}/b/${encodeURIComponent(cfg.bucket)}/o?${qs}`;
  const res = await ociRequest(cfg, "GET", path);
  if (!res.ok) throw new Error(`OCI list ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const json = (await res.json()) as {
    objects?: Array<{ name: string; size?: number; timeModified?: string }>;
  };
  return (json.objects ?? []).map((o) => ({
    name: o.name,
    size: o.size ?? null,
    timeModified: o.timeModified ?? null,
  }));
}

export async function headObject(cfg: OciConfig, objectName: string) {
  const path = `/n/${encodeURIComponent(cfg.namespace)}/b/${encodeURIComponent(cfg.bucket)}/o/${enc(objectName)}`;
  const res = await ociRequest(cfg, "HEAD", path);
  return { exists: res.ok, status: res.status };
}

export async function putObject(
  cfg: OciConfig,
  objectName: string,
  body: Uint8Array,
  contentType = "application/pdf",
) {
  const path = `/n/${encodeURIComponent(cfg.namespace)}/b/${encodeURIComponent(cfg.bucket)}/o/${enc(objectName)}`;
  const res = await ociRequest(cfg, "PUT", path, body, contentType);
  if (!res.ok) throw new Error(`OCI put ${res.status}: ${(await res.text()).slice(0, 200)}`);
  return { ok: true, objectName };
}

/** Cria o bucket configurado no compartimento raiz (tenancy), se ainda não existir. */
export async function ensureBucket(cfg: OciConfig) {
  const nsPath = `/n/${encodeURIComponent(cfg.namespace)}/b/`;
  const head = await ociRequest(cfg, "GET", `${nsPath}${encodeURIComponent(cfg.bucket)}`);
  if (head.ok) return { created: false };
  const body = new TextEncoder().encode(
    JSON.stringify({ name: cfg.bucket, compartmentId: cfg.tenancy, publicAccessType: "NoPublicAccess" }),
  );
  const res = await ociRequest(cfg, "POST", nsPath, body, "application/json");
  if (!res.ok) throw new Error(`OCI createBucket ${res.status}: ${(await res.text()).slice(0, 200)}`);
  return { created: true };
}
