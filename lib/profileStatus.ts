export type ProfileStatusInfo = {
  label: string;
  description: string;
};

export function getProfileStatusInfo(
  status: string,
  isActive: boolean
): ProfileStatusInfo {
  if (status === "pending") {
    return {
      label: "Pending approval",
      description: "Your profile is currently being reviewed by an admin.",
    };
  }

  if (status === "rejected") {
    return {
      label: "Rejected",
      description:
        "Your profile was not approved. Reach out if you think this is a mistake.",
    };
  }

  if (status === "approved" && isActive) {
    return {
      label: "Live",
      description: "Your profile is publicly visible on Browse.",
    };
  }

  if (status === "approved" && !isActive) {
    return {
      label: "Hidden by an admin",
      description: "Your profile was suspended and isn't publicly visible right now.",
    };
  }

  return { label: status, description: "" };
}
