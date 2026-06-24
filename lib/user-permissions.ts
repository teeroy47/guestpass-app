export type UserRole = "admin" | "usher";

export type UserPermissionKey =
  | "manage_events"
  | "manage_guests"
  | "delete_events"
  | "archive_events"
  | "restore_events"
  | "manual_checkin"
  | "view_analytics";

export type UserPermissions = Partial<Record<UserPermissionKey, boolean>>;

const ADMIN_DEFAULTS: Record<UserPermissionKey, boolean> = {
  manage_events: true,
  manage_guests: true,
  delete_events: true,
  archive_events: true,
  restore_events: true,
  manual_checkin: true,
  view_analytics: true,
};

const USHER_DEFAULTS: Record<UserPermissionKey, boolean> = {
  manage_events: false,
  manage_guests: false,
  delete_events: false,
  archive_events: false,
  restore_events: false,
  manual_checkin: true,
  view_analytics: false,
};

export function getDefaultPermissions(role: string | null | undefined) {
  return role === "admin" ? ADMIN_DEFAULTS : USHER_DEFAULTS;
}

export function normalizePermissions(
  role: string | null | undefined,
  rawPermissions: unknown,
): Record<UserPermissionKey, boolean> {
  const defaults = getDefaultPermissions(role);
  const parsed =
    rawPermissions && typeof rawPermissions === "object"
      ? (rawPermissions as UserPermissions)
      : {};

  return {
    ...defaults,
    ...parsed,
  };
}

export function hasPermission(
  role: string | null | undefined,
  permissions: Record<UserPermissionKey, boolean>,
  key: UserPermissionKey,
) {
  if (role === "admin") {
    return true;
  }

  return Boolean(permissions[key]);
}
