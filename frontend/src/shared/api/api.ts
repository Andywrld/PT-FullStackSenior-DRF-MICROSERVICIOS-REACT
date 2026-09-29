import type { AxiosRequestConfig } from 'axios'
import { z } from 'zod'

import { ApiError } from './api-error'
import { type Meta, successEnvelopeSchema } from './envelope'
import { httpClient } from './http-client'

export type ApiResult<T> = { data: T; meta: Meta }

export async function apiRequest<T extends z.ZodType>(
  config: AxiosRequestConfig,
  dataSchema: T,
): Promise<ApiResult<z.output<T>>> {
  const response = await httpClient.request(config)
  const envelope = successEnvelopeSchema.safeParse(response.data)
  if (!envelope.success) throw invalidResponse(response.status, envelope.error.issues)
  const data = dataSchema.safeParse(envelope.data.data)
  if (!data.success) throw invalidResponse(response.status, data.error.issues)
  return { data: data.data, meta: envelope.data.meta }
}

function invalidResponse(status: number, issues: unknown) {
  return new ApiError({
    status,
    code: 'invalid_response',
    message: 'The server response did not match the expected format.',
    details: issues,
  })
}

export function apiGet<T extends z.ZodType>(url: string, dataSchema: T, params?: Record<string, unknown>) {
  return apiRequest({ method: 'GET', url, params }, dataSchema)
}

export function apiPost<T extends z.ZodType>(url: string, dataSchema: T, body?: unknown, config?: AxiosRequestConfig) {
  return apiRequest({ ...config, method: 'POST', url, data: body }, dataSchema)
}

export function apiPatch<T extends z.ZodType>(url: string, dataSchema: T, body: unknown) {
  return apiRequest({ method: 'PATCH', url, data: body }, dataSchema)
}

export function apiDelete<T extends z.ZodType>(url: string, dataSchema: T) {
  return apiRequest({ method: 'DELETE', url }, dataSchema)
}
