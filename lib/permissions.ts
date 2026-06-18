import type { UserRole } from "@prisma/client";

export function canManageAdminFeatures(role: UserRole) {
  return role === "ADMIN";
}

export function canUseTechnicianFeatures(role: UserRole) {
  return role === "ADMIN" || role === "TECHNICIAN" || role === "USER";
}

export function getRoleLabel(role: UserRole) {
  switch (role) {
    case "ADMIN":
      return "Administrateur";
    case "TECHNICIAN":
      return "Technicien";
    default:
      return "Utilisateur";
  }
}
