const getUnkeyData = (keyInfo: unknown) => {
  if (!keyInfo || typeof keyInfo !== "object" || !("data" in keyInfo)) {
    return null;
  }

  const { data } = keyInfo;
  return data && typeof data === "object" ? data : null;
};

const getPermissions = (keyInfo: unknown) => {
  const data = getUnkeyData(keyInfo);
  if (!data || !("permissions" in data)) {
    return [] as string[];
  }

  const { permissions } = data;
  if (!Array.isArray(permissions)) {
    if (!("meta" in data)) {
      return [] as string[];
    }

    const { meta } = data;
    if (!meta || typeof meta !== "object" || !("permission" in meta)) {
      return [] as string[];
    }

    return typeof meta.permission === "string" ? [meta.permission] : [];
  }

  return permissions.filter(
    (permission): permission is string => typeof permission === "string"
  );
};

export const hasApiReadPermission = (keyInfo: unknown) => {
  return getPermissions(keyInfo).includes("api.read");
};

export const getExternalOrganizationId = (keyInfo: unknown) => {
  const data = getUnkeyData(keyInfo);
  if (!data || !("identity" in data)) {
    return null;
  }

  const { identity } = data;
  if (!identity || typeof identity !== "object") {
    return null;
  }

  if (!("externalId" in identity)) {
    return null;
  }

  const externalId = identity.externalId;
  return typeof externalId === "string" ? externalId : null;
};
