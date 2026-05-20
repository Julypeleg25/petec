import { ROUTES } from "@petec/shared";
import { toPatientPhotoUrl } from "../../src/utils/patientPhoto.utils.js";

describe("patientPhoto.utils", () => {
  it("returns null when the photo name is missing or blank", () => {
    expect(toPatientPhotoUrl("patient-1", undefined)).toBeNull();
    expect(toPatientPhotoUrl("patient-1", "   ")).toBeNull();
  });

  it("returns null when a stored filename exists but patient id is missing", () => {
    expect(toPatientPhotoUrl(undefined, "photo.jpg")).toBeNull();
  });

  it("passes through existing asset, api, absolute, and data urls", () => {
    expect(toPatientPhotoUrl("patient-1", "/assets/default.png")).toBe(
      "/assets/default.png",
    );
    expect(toPatientPhotoUrl("patient-1", `${ROUTES.PATIENT}/photo/patient-1`)).toBe(
      `${ROUTES.PATIENT}/photo/patient-1`,
    );
    expect(toPatientPhotoUrl("patient-1", "https://cdn.example.com/photo.jpg")).toBe(
      "https://cdn.example.com/photo.jpg",
    );
    expect(toPatientPhotoUrl("patient-1", "data:image/png;base64,abc123")).toBe(
      "data:image/png;base64,abc123",
    );
  });

  it("builds a versioned patient photo url from a Date", () => {
    const updatedAt = new Date(2026, 3, 19, 9, 30, 0);

    expect(toPatientPhotoUrl("patient-1", "photo.jpg", updatedAt)).toBe(
      `${ROUTES.PATIENT}/photo/patient-1?v=${updatedAt.getTime()}`,
    );
  });

  it("builds a versioned patient photo url from a date string", () => {
    const updatedAt = "2026-04-19T09:30:00.000Z";
    const timestamp = new Date(updatedAt).getTime();

    expect(toPatientPhotoUrl("patient-1", "photo.jpg", updatedAt)).toBe(
      `${ROUTES.PATIENT}/photo/patient-1?v=${timestamp}`,
    );
  });

  it("omits the version query when the date is invalid", () => {
    expect(toPatientPhotoUrl("patient-1", "photo.jpg", "not-a-date")).toBe(
      `${ROUTES.PATIENT}/photo/patient-1`,
    );
  });

  it("builds an unversioned patient photo url when no update time is provided", () => {
    expect(toPatientPhotoUrl("patient-1", "photo.jpg")).toBe(
      `${ROUTES.PATIENT}/photo/patient-1`,
    );
  });
});
