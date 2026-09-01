export type ProfileStatusInfo = {
  label: string;
  description: string;
};

export const MAX_REJECTIONS = 3;

export function attemptsRemaining(rejectionCount: number) {
  return Math.max(0, MAX_REJECTIONS - rejectionCount);
}

export function isLockedOut(status: string, rejectionCount: number) {
  return status === "rejected" && rejectionCount >= MAX_REJECTIONS;
}

export function getProfileStatusInfo(
  status: string,
  isActive: boolean,
  isHiddenByOwner: boolean = false,
  rejectionCount: number = 0
): ProfileStatusInfo {
  if (status === "pending") {
    return {
      label: "Pending approval",
      description: "Your profile is currently being reviewed by an admin.",
    };
  }

  if (status === "rejected") {
    if (isLockedOut(status, rejectionCount)) {
      return {
        label: "Rejected",
        description:
          "Your profile wasn't approved and you've used all your resubmission attempts. Contact support to get your profile sorted.",
      };
    }

    const left = attemptsRemaining(rejectionCount);
    return {
      label: "Rejected",
      description: `Your profile wasn't approved. You can edit and resubmit — ${left} attempt${left === 1 ? "" : "s"} left before you'll need to contact support.`,
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
