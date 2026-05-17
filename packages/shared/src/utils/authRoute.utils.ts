export const buildResetPasswordPath = (token: string): string =>
  `/reset-password/${encodeURIComponent(token)}`;
