export type OrganizationMembershipAction = "leave" | "delete";

export function getOrganizationMembershipAction(isOwnedByCurrentUser: boolean) {
  return isOwnedByCurrentUser ? "delete" : "leave";
}

export function getOrganizationMembershipActionLabel(
  action: OrganizationMembershipAction
) {
  return action === "delete" ? "Delete" : "Leave";
}

export function getOrganizationMembershipActionDescription(
  action: OrganizationMembershipAction,
  hasOtherMembers: boolean
) {
  if (action === "leave") {
    return "You will lose access to this organization and all its content. You'll need to be invited again to rejoin.";
  }

  if (hasOtherMembers) {
    return "This organization has other members. Deleting it will permanently remove access for everyone and delete all workspace data.";
  }

  return "You are the only member of this organization. Deleting it will permanently remove all workspace data.";
}
