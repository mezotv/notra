export function getPgConstraintName(error: unknown) {
  if (!(typeof error === "object" && error !== null)) {
    return null;
  }

  if ("constraint_name" in error && typeof error.constraint_name === "string") {
    return error.constraint_name;
  }

  if ("constraint" in error && typeof error.constraint === "string") {
    return error.constraint;
  }

  if (
    "cause" in error &&
    typeof error.cause === "object" &&
    error.cause !== null
  ) {
    if (
      "constraint_name" in error.cause &&
      typeof error.cause.constraint_name === "string"
    ) {
      return error.cause.constraint_name;
    }

    if (
      "constraint" in error.cause &&
      typeof error.cause.constraint === "string"
    ) {
      return error.cause.constraint;
    }
  }

  return null;
}

function hasUniqueViolationCode(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "23505"
  );
}

export function isPgUniqueViolation(error: unknown) {
  if (hasUniqueViolationCode(error)) {
    return true;
  }

  if (
    typeof error === "object" &&
    error !== null &&
    "cause" in error &&
    hasUniqueViolationCode(error.cause)
  ) {
    return true;
  }

  return false;
}

export function isConstraintViolation(error: unknown, constraintName: string) {
  const resolvedConstraintName = getPgConstraintName(error);

  if (resolvedConstraintName === constraintName) {
    return true;
  }

  if (error instanceof Error) {
    return error.message.includes(constraintName);
  }

  return false;
}
