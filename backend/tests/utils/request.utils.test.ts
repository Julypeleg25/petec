import type { Request } from "express";
import { AuthError, BadRequestError } from "../../src/constants/error.constants.js";
import {
  getAuthenticatedUserId,
  getParam,
  getValidatedBody,
  getValidatedParams,
  getValidatedQuery,
} from "../../src/utils/request.utils.js";

const createRequest = (overrides: Partial<Request> = {}): Request =>
  ({
    params: {},
    body: {},
    query: {},
    ...overrides,
  }) as Request;

describe("request.utils", () => {
  it("returns a route param when it exists", () => {
    const req = createRequest({ params: { caseId: "case-123" } });

    expect(getParam(req, "caseId")).toBe("case-123");
  });

  it("returns the first route param when Express provides an array", () => {
    const req = createRequest({ params: { caseId: ["case-123", "case-456"] } });

    expect(getParam(req, "caseId")).toBe("case-123");
  });

  it("throws a BadRequestError when a required route param is missing", () => {
    const req = createRequest();

    expect(() => getParam(req, "caseId")).toThrow(BadRequestError);
    expect(() => getParam(req, "caseId")).toThrow("Missing route param: caseId");
  });

  it("returns the validated request body", () => {
    const req = createRequest({ body: { name: "Nina", age: 3 } });

    expect(getValidatedBody<typeof req.body>(req)).toEqual({
      name: "Nina",
      age: 3,
    });
  });

  it("returns the validated request params", () => {
    const req = createRequest({ params: { patientId: "patient-42" } });

    expect(getValidatedParams<typeof req.params>(req)).toEqual({
      patientId: "patient-42",
    });
  });

  it("returns the validated request query", () => {
    const req = createRequest({ query: { archived: "true", page: "2" } });

    expect(getValidatedQuery<typeof req.query>(req)).toEqual({
      archived: "true",
      page: "2",
    });
  });

  it("returns the authenticated user id when present", () => {
    const req = createRequest({
      authenticatedUser: {
        userId: "user-17",
        role: "admin",
        privileges: [],
      },
    });

    expect(getAuthenticatedUserId(req)).toBe("user-17");
  });

  it("throws an AuthError when the request is unauthenticated", () => {
    const req = createRequest();

    expect(() => getAuthenticatedUserId(req)).toThrow(AuthError);
    expect(() => getAuthenticatedUserId(req)).toThrow("Authentication required");
  });
});