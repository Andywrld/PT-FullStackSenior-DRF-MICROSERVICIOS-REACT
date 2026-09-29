import type { z } from 'zod'

import type { errorEnvelopeSchema } from './envelope'

type ErrorEnvelope = z.infer<typeof errorEnvelopeSchema>

export class ApiError extends Error {
  readonly status: number
  readonly code: string
  readonly details: unknown
  readonly requestId?: string

  constructor(params: { status: number; code: string; message: string; details?: unknown; requestId?: string }) {
    super(params.message)
    this.name = 'ApiError'
    this.status = params.status
    this.code = params.code
    this.details = params.details ?? null
    this.requestId = params.requestId
  }

  static fromEnvelope(status: number, envelope: ErrorEnvelope) {
    return new ApiError({
      status,
      code: envelope.error.code,
      message: envelope.error.message,
      details: envelope.error.details,
      requestId: envelope.meta.request_id,
    })
  }

  get fieldErrors(): Record<string, string[]> {
    return this.code === 'validation_error' && this.details && typeof this.details === 'object'
      ? (this.details as Record<string, string[]>)
      : {}
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError
}
