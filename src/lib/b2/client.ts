import 'server-only'

import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
  type GetObjectCommandInput,
  type PutObjectCommandInput
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

const DEFAULT_PRESIGNED_URL_EXPIRY_SECONDS = 15 * 60
const MAX_PRESIGNED_URL_EXPIRY_SECONDS = 7 * 24 * 60 * 60

export interface B2Config {
  keyId: string
  applicationKey: string
  bucketName: string
  endpoint: string
  region: string
}

export interface CreatePresignedUploadUrlParams {
  key: string
  contentType?: string
  contentLength?: number
  expiresInSeconds?: number
}

export interface CreatePresignedDownloadUrlParams {
  key: string
  expiresInSeconds?: number
  responseContentDisposition?: string
  responseContentType?: string
}

export interface ReadObjectAsBase64Params {
  key: string
}

export interface PutObjectFromBase64Params {
  key: string
  base64: string
  contentType: string
}

export interface PresignedUrlOptions {
  client?: S3Client
  bucketName?: string
}

let cachedB2Client: S3Client | undefined

export function getB2Config(env: NodeJS.ProcessEnv = process.env): B2Config {
  return {
    keyId: readRequiredEnv(env, 'B2_KEY_ID'),
    applicationKey: readRequiredEnv(env, 'B2_APP_KEY'),
    bucketName: readRequiredEnv(env, 'B2_BUCKET_NAME'),
    endpoint: normalizeEndpoint(readRequiredEnv(env, 'B2_ENDPOINT')),
    region: readRequiredEnv(env, 'B2_REGION')
  }
}

export function createB2Client(config: B2Config = getB2Config()): S3Client {
  return new S3Client({
    region: config.region,
    endpoint: config.endpoint,
    credentials: {
      accessKeyId: config.keyId,
      secretAccessKey: config.applicationKey
    }
  })
}

export function getB2Client(): S3Client {
  cachedB2Client ??= createB2Client()
  return cachedB2Client
}

export function getB2BucketName(env: NodeJS.ProcessEnv = process.env): string {
  return readRequiredEnv(env, 'B2_BUCKET_NAME')
}

export async function createPresignedUploadUrl(
  params: CreatePresignedUploadUrlParams,
  options: PresignedUrlOptions = {}
): Promise<string> {
  const commandInput: PutObjectCommandInput = {
    Bucket: options.bucketName ?? getB2BucketName(),
    Key: validateObjectKey(params.key),
    ContentType: params.contentType,
    ContentLength: params.contentLength
  }

  return getSignedUrl(
    options.client ?? getB2Client(),
    new PutObjectCommand(commandInput),
    {
      expiresIn: validateExpiry(params.expiresInSeconds)
    }
  )
}

export async function createPresignedDownloadUrl(
  params: CreatePresignedDownloadUrlParams,
  options: PresignedUrlOptions = {}
): Promise<string> {
  const commandInput: GetObjectCommandInput = {
    Bucket: options.bucketName ?? getB2BucketName(),
    Key: validateObjectKey(params.key),
    ResponseContentDisposition: params.responseContentDisposition,
    ResponseContentType: params.responseContentType
  }

  return getSignedUrl(
    options.client ?? getB2Client(),
    new GetObjectCommand(commandInput),
    {
      expiresIn: validateExpiry(params.expiresInSeconds)
    }
  )
}

export async function readObjectAsBase64(
  params: ReadObjectAsBase64Params,
  options: PresignedUrlOptions = {}
): Promise<string> {
  const response = await (options.client ?? getB2Client()).send(
    new GetObjectCommand({
      Bucket: options.bucketName ?? getB2BucketName(),
      Key: validateObjectKey(params.key)
    })
  )

  if (!hasByteArrayBody(response.Body)) {
    throw new Error('B2 object response did not include a readable body.')
  }

  const bytes = await response.Body.transformToByteArray()
  return Buffer.from(bytes).toString('base64')
}

export async function putObjectFromBase64(
  params: PutObjectFromBase64Params,
  options: PresignedUrlOptions = {}
): Promise<void> {
  const payload = Buffer.from(params.base64, 'base64')

  await (options.client ?? getB2Client()).send(
    new PutObjectCommand({
      Bucket: options.bucketName ?? getB2BucketName(),
      Key: validateObjectKey(params.key),
      Body: payload,
      ContentType: params.contentType,
      ContentLength: payload.length
    })
  )
}

function hasByteArrayBody(
  value: unknown
): value is { transformToByteArray: () => Promise<Uint8Array> } {
  return (
    typeof value === 'object' &&
    value !== null &&
    'transformToByteArray' in value &&
    typeof value.transformToByteArray === 'function'
  )
}

function readRequiredEnv(env: NodeJS.ProcessEnv, name: string): string {
  const value = env[name]?.trim()

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`)
  }

  return value
}

function normalizeEndpoint(endpoint: string): string {
  return endpoint.startsWith('http://') || endpoint.startsWith('https://')
    ? endpoint
    : `https://${endpoint}`
}

function validateObjectKey(key: string): string {
  const trimmedKey = key.trim()

  if (!trimmedKey || trimmedKey.startsWith('/')) {
    throw new Error('B2 object key must be non-empty and relative.')
  }

  return trimmedKey
}

function validateExpiry(expiresInSeconds?: number): number {
  const expiresIn = expiresInSeconds ?? DEFAULT_PRESIGNED_URL_EXPIRY_SECONDS

  if (
    !Number.isInteger(expiresIn) ||
    expiresIn <= 0 ||
    expiresIn > MAX_PRESIGNED_URL_EXPIRY_SECONDS
  ) {
    throw new Error(
      `Presigned URL expiry must be an integer between 1 and ${MAX_PRESIGNED_URL_EXPIRY_SECONDS} seconds.`
    )
  }

  return expiresIn
}
