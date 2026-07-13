import { SetMetadata } from '@nestjs/common';

export const PERMISSIONS_KEY = 'requiredPermissions';

/**
 * Marks a controller route as requiring one or more permission keys,
 * e.g. @RequirePermissions('users.create').
 *
 * Permission keys are plain strings that must exist as rows in the
 * `permissions` table and be attached to at least one role the user
 * holds. Nothing about "what roles exist" or "what a role can do" is
 * hardcoded here — this decorator only declares what the route needs.
 */
export const RequirePermissions = (...permissions: string[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);
