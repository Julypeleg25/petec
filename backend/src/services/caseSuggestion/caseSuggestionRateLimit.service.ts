import {
  AppError,
  HttpStatus,
  type CaseSuggestionCategory,
} from "@petec/shared";

const MAX_REQUESTS_PER_WINDOW = 10;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;

interface UserWindow {
  readonly startedAt: number;
  readonly requestCount: number;
}

class CaseSuggestionRateLimitError extends AppError {
  constructor(message: string) {
    super({
      message,
      statusCode: HttpStatus.TOO_MANY_REQUESTS,
      isOperational: true,
    });
  }
}

export class CaseSuggestionRateLimitService {
  private readonly userWindows = new Map<string, UserWindow>();
  private readonly activeUsers = new Set<string>();
  private readonly activePatientCategories = new Set<string>();

  private removeExpiredWindows(now: number): void {
    for (const [userId, window] of this.userWindows) {
      if (now - window.startedAt >= RATE_LIMIT_WINDOW_MS) {
        this.userWindows.delete(userId);
      }
    }
  }

  async run<T>(
    userId: string,
    patientId: string,
    category: CaseSuggestionCategory,
    operation: () => Promise<T>,
  ): Promise<T> {
    const now = Date.now();
    this.removeExpiredWindows(now);
    const currentWindow = this.userWindows.get(userId);
    const window =
      !currentWindow
        ? { startedAt: now, requestCount: 0 }
        : currentWindow;
    if (window.requestCount >= MAX_REQUESTS_PER_WINDOW) {
      throw new CaseSuggestionRateLimitError(
        "הגעת למכסת ההצעות השעתית. ניתן להמשיך בהזנה ידנית.",
      );
    }

    const patientCategoryKey = `${patientId}:${category}`;
    if (
      this.activeUsers.has(userId) ||
      this.activePatientCategories.has(patientCategoryKey)
    ) {
      throw new CaseSuggestionRateLimitError(
        "בקשת הצעות אחרת עדיין מתבצעת. יש להמתין לסיומה.",
      );
    }

    this.userWindows.set(userId, {
      startedAt: window.startedAt,
      requestCount: window.requestCount + 1,
    });
    this.activeUsers.add(userId);
    this.activePatientCategories.add(patientCategoryKey);

    try {
      return await operation();
    } finally {
      this.activeUsers.delete(userId);
      this.activePatientCategories.delete(patientCategoryKey);
    }
  }
}

export const caseSuggestionRateLimitService =
  new CaseSuggestionRateLimitService();
