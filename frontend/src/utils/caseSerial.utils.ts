export const getCaseSerialPrefix = (
  serialId: string | null | undefined,
): string => {
  if (!serialId) {
    return "";
  }

  const normalized = serialId.trim();
  if (normalized.length === 0) {
    return "";
  }

  const [prefix] = normalized.split("-");
  return prefix && prefix.length > 0 ? prefix : normalized;
};
