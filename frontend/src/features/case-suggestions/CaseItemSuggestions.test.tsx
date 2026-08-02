import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  cleanup,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ComponentProps } from "react";
import type {
  CaseItemSuggestion,
  CaseSuggestionsResponse,
} from "@petec/shared";
import { patientsApi } from "../patients/patients.api";
import { CaseItemSuggestions } from "./CaseItemSuggestions";

vi.mock("../patients/patients.api", () => ({
  patientsApi: {
    getCaseSuggestions: vi.fn(),
  },
}));

const getCaseSuggestionsMock = vi.mocked(patientsApi.getCaseSuggestions);
const patientId = "507f1f77bcf86cd799439011";

const suggestion = (
  index: number,
  overrides: Partial<CaseItemSuggestion> = {},
): CaseItemSuggestion => ({
  id: `00000000-0000-4000-8000-${String(index).padStart(12, "0")}`,
  category: "medication",
  itemId: `507f1f77bcf86cd7994390${String(index).padStart(2, "0")}`,
  displayName: `פריט בדיוני ${index}`,
  patientDataVersion: "2026-07-01T10:00:00.000Z",
  candidateDataVersion: "2026-07-01T11:00:00.000Z",
  generatedAt: "2026-07-01T12:00:00.000Z",
  authoritativeValues: {
    category: "medication",
    medicationId: `507f1f77bcf86cd7994390${String(index).padStart(2, "0")}`,
    doseAmount: index,
    route: "דרך בדיקה",
  },
  warnings: [],
  ...overrides,
});

const response = (
  suggestions: CaseItemSuggestion[],
): CaseSuggestionsResponse => ({
  status: suggestions.length > 0 ? "success" : "insufficient_information",
  category: "medication",
  patientDataVersion: "2026-07-01T10:00:00.000Z",
  candidateDataVersion: "2026-07-01T11:00:00.000Z",
  generatedAt: "2026-07-01T12:00:00.000Z",
  missingInformation: [],
  suggestions,
  warning: "יש לבדוק לפני שמירה",
});

const renderComponent = (
  props: Partial<ComponentProps<typeof CaseItemSuggestions>> = {},
) => {
  const onSuggestionSelected = vi.fn();
  const result = render(
    <CaseItemSuggestions
      patientId={patientId}
      category="medication"
      currentItems={[]}
      invalidationKey="version-1"
      onSuggestionSelected={onSuggestionSelected}
      {...props}
    />,
  );
  return { ...result, onSuggestionSelected };
};

const openSuggestions = async () => {
  await userEvent.click(
    screen.getByRole("button", { name: /הצעות מותאמות למקרה/ }),
  );
  await waitFor(() => expect(getCaseSuggestionsMock).toHaveBeenCalled());
};

describe("CaseItemSuggestions", () => {
  beforeEach(() => {
    getCaseSuggestionsMock.mockReset();
  });

  afterEach(() => cleanup());

  it("renders at most five category-specific suggestions", async () => {
    getCaseSuggestionsMock.mockResolvedValue(
      response(Array.from({ length: 7 }, (_, index) => suggestion(index + 1))),
    );
    renderComponent();
    await openSuggestions();

    expect(screen.getAllByRole("article")).toHaveLength(5);
    expect(screen.getAllByText("כמות מוצעת")).toHaveLength(5);
    expect(screen.getAllByText("דרך מתן")).toHaveLength(5);
  });

  it("populates through the callback without calling any save endpoint", async () => {
    getCaseSuggestionsMock.mockResolvedValue(response([suggestion(1)]));
    const { onSuggestionSelected } = renderComponent();
    await openSuggestions();

    await userEvent.click(
      screen.getByRole("button", { name: "הוספת ההצעה לטופס" }),
    );

    expect(onSuggestionSelected).toHaveBeenCalledWith(
      expect.objectContaining({ itemId: suggestion(1).itemId }),
    );
    expect(screen.getByText(/ההצעה הוזנה לטופס בלבד/)).toBeTruthy();
  });

  it("clears results when the patient changes", async () => {
    getCaseSuggestionsMock.mockResolvedValue(response([suggestion(1)]));
    const { rerender } = renderComponent();
    await openSuggestions();
    expect(screen.getByText("פריט בדיוני 1")).toBeTruthy();

    rerender(
      <CaseItemSuggestions
        patientId="507f1f77bcf86cd799439099"
        category="medication"
        currentItems={[]}
        invalidationKey="version-1"
        onSuggestionSelected={vi.fn()}
      />,
    );

    expect(screen.queryByText("פריט בדיוני 1")).toBeNull();
  });

  it("marks results stale and hides calculated values after invalidation", async () => {
    getCaseSuggestionsMock.mockResolvedValue(response([suggestion(1)]));
    const { rerender } = renderComponent();
    await openSuggestions();

    rerender(
      <CaseItemSuggestions
        patientId={patientId}
        category="medication"
        currentItems={[]}
        invalidationKey="version-2"
        onSuggestionSelected={vi.fn()}
      />,
    );

    expect(
      screen.getByText("נתוני המקרה השתנו. יש לרענן את ההצעות."),
    ).toBeTruthy();
    expect(screen.queryByText("כמות מוצעת")).toBeNull();
    expect(
      (
        screen.getByRole("button", {
          name: "הוספת ההצעה לטופס",
        }) as HTMLButtonElement
      ).disabled,
    ).toBe(true);
  });

  it("keeps manual entry available after a safe loading failure", async () => {
    getCaseSuggestionsMock.mockRejectedValue(new Error("network"));
    renderComponent();
    await openSuggestions();

    expect(
      screen.getByText("לא ניתן לטעון הצעות כעת. ניתן להמשיך בהזנה ידנית."),
    ).toBeTruthy();
  });

});
