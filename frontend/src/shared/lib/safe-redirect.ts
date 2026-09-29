/** Only same-app paths: `?redirect=//evil.example` must never send the user off-site (open redirect). */
export function safeRedirect(target: string | null | undefined, fallback: string): string {
  if (!target || !target.startsWith('/') || target.startsWith('//') || target.startsWith('/\\')) {
    return fallback
  }
  return target
}
