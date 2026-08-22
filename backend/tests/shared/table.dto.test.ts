import { GetTableDataDTOSchema } from "@petec/shared";

describe("GetTableDataDTOSchema", () => {
  it("accepts scalar filters on ordinary field paths", () => {
    expect(
      GetTableDataDTOSchema.parse({
        tableName: "patients",
        filters: {
          "patientId.owner.phone": "0501234567",
          isArchived: false,
        },
      }),
    ).toMatchObject({
      tableName: "patients",
      filters: {
        "patientId.owner.phone": "0501234567",
        isArchived: false,
      },
    });
  });

  it.each([
    { filters: { $where: "sleep(1000)" } },
    { filters: { "patient.$expr": "unsafe" } },
    { filters: { patientId: { $ne: null } } },
    { filters: {}, sortBy: "$natural" },
  ])("rejects MongoDB operator input %#", (unsafeInput) => {
    expect(
      GetTableDataDTOSchema.safeParse({
        tableName: "patients",
        ...unsafeInput,
      }).success,
    ).toBe(false);
  });
});
