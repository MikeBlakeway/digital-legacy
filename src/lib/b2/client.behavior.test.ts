import { S3Client } from '@aws-sdk/client-s3'

import { createPresignedUploadUrl } from '@/lib/b2/client'

const client = new S3Client({
  region: 'eu-central-003',
  endpoint: 'https://s3.eu-central-003.backblazeb2.com',
  credentials: {
    accessKeyId: 'test-key-id',
    secretAccessKey: 'test-application-key'
  }
})

async function assertBrowserUploadSignature(): Promise<void> {
  const uploadUrl = await createPresignedUploadUrl(
    {
      key: 'media/persona/test.mov',
      contentType: 'video/quicktime',
      contentLength: 17_416_678
    },
    {
      client,
      bucketName: 'digital-legacy'
    }
  )

  const signedHeaders = new URL(uploadUrl).searchParams.get(
    'X-Amz-SignedHeaders'
  )

  if (signedHeaders?.split(';').includes('content-length')) {
    throw new Error(
      'Presigned browser upload URLs must not sign Content-Length for Backblaze B2.'
    )
  }
}

void assertBrowserUploadSignature()
