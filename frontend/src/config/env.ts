
/**
 * Runtime environment configuration.
 * Throws at startup in production if any required variable is missing.
 */

const getEnv = (key: string, fallback?: string): string => {
    const value = process.env[key] ?? fallback;
    if (value === undefined) {
        throw new Error(`Missing required environment variable: ${key}`);
    }
    return value;
};

export const env = {
    NODE_ENV: getEnv("NODE_ENV", "development") as "development" | "production" | "test",
    BASE_URL:
        process.env.NODE_ENV === "production"
            ? ""
            : getEnv("REACT_APP_API_URL", "http://localhost:5000"),
} as const;
