export const ACTIVE_STATUSES = ['active', 'inactive'] as const
export type ActiveStatus = (typeof ACTIVE_STATUSES)[number]

export function isActiveParam(status: ActiveStatus | undefined): boolean | undefined {
  return status ? status === 'active' : undefined
}
