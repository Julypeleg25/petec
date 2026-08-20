import { roles } from "@petec/shared";
import type { NextFunction, Request, Response } from "express";
import { ForbiddenError } from "../../src/constants/error.constants.js";
import { requireTableReadPermission } from "../../src/routes/table/tableAuthorization.middleware.js";

const createRequest = (
  tableName: string,
  role: (typeof roles)[keyof typeof roles],
): Request => {
  const request = {} as Request;
  Object.assign(request, {
    body: { tableName },
    method: "POST",
    originalUrl: "/api/v1/table",
    requestId: "request-1",
    authenticatedUser: {
      userId: "user-1",
      role,
      privileges: [],
    },
  });
  return request;
};

const runMiddleware = (req: Request) => {
  const calls: unknown[] = [];
  const next: NextFunction = (error?: unknown): void => {
    calls.push(error);
  };
  requireTableReadPermission(req, {} as Response, next);
  return calls;
};

describe("table authorization middleware", () => {
  it.each([
    ["patients", roles.RECEPTION],
    ["cases", roles.ASSISTANT],
    ["auditLogs", roles.DOCTOR],
    ["users", roles.ADMIN],
    ["medicines", roles.ADMIN],
  ])("allows %s for a role with the required permission", (tableName, role) => {
    expect(runMiddleware(createRequest(tableName, role))).toEqual([undefined]);
  });

  it.each([
    ["auditLogs", roles.ASSISTANT],
    ["users", roles.DOCTOR],
    ["medicines", roles.DOCTOR],
  ])(
    "rejects %s for role %s without the required permission",
    (tableName, role) => {
      const calls = runMiddleware(createRequest(tableName, role));
      expect(calls[0]).toBeInstanceOf(ForbiddenError);
    },
  );
});
