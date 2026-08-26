export type ProfileStatusInfo = {
  label: string;
  description: string;
};

export function getProfileStatusInfo(
  status: string,
  isActive: boolean,
  isHiddenByOwner: boolean = false
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

  if (status === "approved" && !isActive) {
    return {
      label: "Hidden by an admin",
      description: "Your profile was suspended and isn't publicly visible right now.",
    };
  }

  if (status === "approved" && isActive && isHiddenByOwner) {
    return {
      label: "Hidden by you",
      description: "You've hidden your profile from Browse. Unhide it any time.",
    };
  }

  if (status === "approved" && isActive) {
    return {
      label: "Live",
      description: "Your profile is publicly visible on Browse.",
    };
  }

  return { label: status, description: "" };
}
