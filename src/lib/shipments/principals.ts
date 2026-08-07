export const dashboardRoles = ["user", "admin", "staff", "super_admin"] as const;

export type DashboardRole = (typeof dashboardRoles)[number];

export interface SessionUserLike {
  id: string;
  role: DashboardRole;
  username?: string | null;
  email?: string | null;
}

export interface CustomerShipmentPrincipal {
  kind: "customer";
  userId: string;
  role: "user";
  username?: string;
}

export interface InternalShipmentPrincipal {
  kind: "internal";
  userId: string;
  role: "admin" | "staff" | "super_admin";
  username?: string;
}

export interface PartnerShipmentPrincipal {
  kind: "partner_api";
  organizationId: string;
  apiClientId: string;
  credentialId: string;
  environment: "test" | "live";
  scopes: readonly string[];
}

export type ShipmentPrincipal =
  | CustomerShipmentPrincipal
  | InternalShipmentPrincipal
  | PartnerShipmentPrincipal;

export function shipmentPrincipalFromSessionUser(
  user: SessionUserLike,
): CustomerShipmentPrincipal | InternalShipmentPrincipal {
  const username = user.username || undefined;

  if (user.role === "user") {
    return {
      kind: "customer",
      userId: user.id,
      role: "user",
      username,
    };
  }

  return {
    kind: "internal",
    userId: user.id,
    role: user.role,
    username,
  };
}
