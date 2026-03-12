// Route paths in one place for navigation and links.

export const ROUTES = {
  HOME: '/',
  DRAFT: '/draft/:code',
} as const;

export function draftUrl(code: string): string {
  return `/draft/${code}`;
}
