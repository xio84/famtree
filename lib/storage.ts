import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3"
import { randomUUID } from "crypto"

const ENDPOINT = process.env.STORAGE_ENDPOINT ?? ""

/**
 * Region used for SigV4 request signing. Cloudflare R2 uses the special
 * value "auto", but most other S3-compatible providers (Hetzner, etc.)
 * reject it and require the real region — which is the first label of the
 * endpoint host, e.g. https://hel1.your-objectstorage.com -> "hel1".
 * `STORAGE_REGION` overrides the detection when set.
 */
function resolveRegion(): string {
  if (process.env.STORAGE_REGION) return process.env.STORAGE_REGION
  if (!ENDPOINT || ENDPOINT.includes("r2.cloudflarestorage.com")) return "auto"
  try {
    return new URL(ENDPOINT).hostname.split(".")[0] || "auto"
  } catch {
    return "auto"
  }
}

const s3 = new S3Client({
  region: resolveRegion(),
  endpoint: ENDPOINT,
  forcePathStyle: true,
  credentials: {
    accessKeyId: process.env.STORAGE_ACCESS_KEY!,
    secretAccessKey: process.env.STORAGE_SECRET_KEY!,
  },
})

const BUCKET = process.env.STORAGE_BUCKET ?? "family-tree-photos"
const PUBLIC_URL = process.env.STORAGE_PUBLIC_URL ?? ""

export async function uploadPhoto(file: File, userId: string): Promise<string> {
  const ext = file.name.split(".").pop() ?? "jpg"
  const key = `photos/${userId}/${randomUUID()}.${ext}`
  const buffer = Buffer.from(await file.arrayBuffer())

  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: buffer,
      ContentType: file.type,
    })
  )

  return `${PUBLIC_URL}/${key}`
}
