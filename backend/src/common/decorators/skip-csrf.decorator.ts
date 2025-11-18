import { SetMetadata } from '@nestjs/common';

export const SKIP_CSRF_KEY = 'skipCsrf';

/**
 * Decorator to skip CSRF protection for specific endpoints
 * Use sparingly and only for endpoints that don't need CSRF protection
 * (e.g., webhook endpoints from external services)
 */
export const SkipCsrf = () => SetMetadata(SKIP_CSRF_KEY, true);

