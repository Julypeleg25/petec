import { roles, UserStatus } from "@petec/shared";
import {
  mapUserToResponse,
  mapUserToRow,
  mapUserToStaffMember,
} from "../../../src/mappers/user/user.mappers.js";

describe("user.mappers", () => {
  const user = {
    _id: "user-1",
    username: "doctor1",
    firstName: "Dana",
    lastName: "Levi",
    email: "dana@example.com",
    role: roles.DOCTOR,
    privileges: ["read:patient"],
    status: UserStatus.INACTIVE,
    lastLogin: "2026-04-19T07:30:00.000Z",
    createdAt: "2026-04-10T07:30:00.000Z",
    updatedAt: "2026-04-11T07:30:00.000Z",
  };

  it("maps a user to the response dto", () => {
    expect(mapUserToResponse(user as never)).toEqual({
      id: "user-1",
      username: "doctor1",
      firstName: "Dana",
      lastName: "Levi",
      fullName: "Dana Levi",
      email: "dana@example.com",
      role: roles.DOCTOR,
      privileges: ["read:patient"],
      status: UserStatus.INACTIVE,
      lastLogin: "2026-04-19T07:30:00.000Z",
      createdAt: "2026-04-10T07:30:00.000Z",
      updatedAt: "2026-04-11T07:30:00.000Z",
    });
  });

  it("maps a user to the row dto", () => {
    expect(mapUserToRow(user as never)).toEqual({
      id: "user-1",
      username: "doctor1",
      first_name: "Dana",
      last_name: "Levi",
      email: "dana@example.com",
      role: roles.DOCTOR,
      role_name: "רופא",
      privileges: ["read:patient"],
      status: UserStatus.INACTIVE,
      lastLogin: "2026-04-19T07:30:00.000Z",
      createdAt: "2026-04-10T07:30:00.000Z",
      updatedAt: "2026-04-11T07:30:00.000Z",
    });
  });

  it("maps a user to the staff-member dto", () => {
    expect(mapUserToStaffMember(user as never)).toEqual({
      id: "user-1",
      username: "doctor1",
      fullName: "Dana Levi",
      email: "dana@example.com",
      role: roles.DOCTOR,
    });
  });

  it("fills missing optional fields with safe defaults", () => {
    expect(
      mapUserToResponse({
        _id: "user-2",
        role: roles.ADMIN,
      } as never),
    ).toEqual({
      id: "user-2",
      username: "",
      firstName: "",
      lastName: "",
      fullName: "",
      email: "",
      role: roles.ADMIN,
      privileges: [],
      status: UserStatus.ACTIVE,
      lastLogin: undefined,
      createdAt: "",
      updatedAt: "",
    });
  });
});