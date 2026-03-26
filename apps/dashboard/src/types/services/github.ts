export interface ErrorWithStatus {
  status?: number;
}

export interface ValidateRepositoryBranchExistsParams {
  owner: string;
  repo: string;
  branch: string;
  token?: string | null;
  encryptedToken?: string | null;
}
