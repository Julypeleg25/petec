export const userKeys = {
    all: ["users"] as const,
    list: () => ["users", "list"] as const,
    doctors: () => ["users", "doctors"] as const,
    nurses: () => ["users", "nurses"] as const,
};
