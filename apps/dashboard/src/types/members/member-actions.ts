export type MemberRole = "member" | "admin";

export interface MemberActionsState {
  isRemoving: boolean;
  isChangingRole: boolean;
  showRemoveDialog: boolean;
  showChangeRoleDialog: boolean;
  newRole: MemberRole;
}

export type MemberActionsAction =
  | { type: "removeStarted" }
  | { type: "removeFinished" }
  | { type: "roleChangeStarted" }
  | { type: "roleChangeFinished" }
  | { type: "removeDialogChanged"; open: boolean }
  | { type: "roleDialogChanged"; open: boolean }
  | { type: "roleSelected"; role: MemberRole };
