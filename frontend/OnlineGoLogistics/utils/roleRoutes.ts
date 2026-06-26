export type AppRole = "admin" | "branch" | "user" | "agent" | "customer";

export const normalizeRole = (role?: string | null): AppRole => {
  const value = (role || "").toLowerCase();

  if (
    value === "admin" ||
    value === "branch" ||
    value === "user" ||
    value === "agent" ||
    value === "customer"
  ) {
    return value;
  }

  return "customer";
};

export const getHomeRouteForRole = (role?: string | null) => {
  return "/drawer/user-dashboard";
};

export const getRoleTitle = (role?: string | null) => {
  switch (normalizeRole(role)) {
    case "admin":
      return "Admin Panel";
    case "branch":
      return "Branch Panel";
    case "user":
      return "User Panel";
    case "agent":
      return "Agent Panel";
    case "customer":
    default:
      return "Customer Panel";
  }
};
