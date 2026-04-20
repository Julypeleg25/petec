import { jest } from "@jest/globals";
import { Types } from "mongoose";

const findMock = jest.fn() as any;
const leanMock = jest.fn() as any;
const execMock = jest.fn() as any;

jest.unstable_mockModule("../../../../src/models/lookups/index.js", () => ({
  MedicineModel: {
    find: findMock,
  },
}));

const { hasCaseWeightChanged, recalculateCaseGridMedicationDoses } = await import(
  "../../../../src/services/patient/utils/caseWeightDose.utils.js"
);

describe("caseWeightDose.utils", () => {
  beforeEach(() => {
    findMock.mockReset();
    leanMock.mockReset();
    execMock.mockReset();

    leanMock.mockReturnValue({
      exec: execMock,
    });
    findMock.mockReturnValue({
      lean: leanMock,
    });
  });

  it("normalizes empty weights and detects real weight changes", () => {
    expect(hasCaseWeightChanged(undefined, null)).toBe(false);
    expect(hasCaseWeightChanged(Number.NaN, undefined)).toBe(false);
    expect(hasCaseWeightChanged(12, 12)).toBe(false);
    expect(hasCaseWeightChanged(12, 13)).toBe(true);
  });

  it("returns copied rows when there are no valid medicine ids to recalculate", async () => {
    const rows = [
      {
        time: "08:00",
        fluids: [{ medicineId: "", doseAmount: 1 }],
        medicines: [{ medicineId: "not-an-object-id", doseAmount: 2 }],
      },
    ] as any;

    const result = await recalculateCaseGridMedicationDoses(rows, 10);

    expect(findMock).not.toHaveBeenCalled();
    expect(result).toEqual(rows);
    expect(result[0]).not.toBe(rows[0]);
    expect(result[0].fluids).toBe(rows[0].fluids);
    expect(result[0].medicines).toBe(rows[0].medicines);
  });

  it("recalculates fluid and medicine doses from stored recommendations", async () => {
    const byAverageDoseId = new Types.ObjectId();
    const byFixedRangeId = new Types.ObjectId();
    const byTotalDoseId = new Types.ObjectId();
    const preserveRecommendationId = new Types.ObjectId();
    const missingRecommendationId = new Types.ObjectId();
    const session = { id: "session-1" } as any;

    execMock.mockResolvedValue([
      {
        _id: byAverageDoseId,
        rangeMin: 2,
        rangeMax: 4,
      },
      {
        _id: byFixedRangeId,
        rangeMin: 5,
        rangeMax: 5,
      },
      {
        _id: byTotalDoseId,
        totalDose: 7,
      },
      {
        _id: preserveRecommendationId,
      },
    ]);

    const result = await recalculateCaseGridMedicationDoses(
      [
        {
          fluids: [
            { medicineId: byTotalDoseId.toString(), doseAmount: 1 },
            { medicineId: missingRecommendationId, doseAmount: 9 },
          ],
          medicines: [
            { medicineId: byAverageDoseId, doseAmount: 2 },
            { medicineId: { _id: byFixedRangeId }, doseAmount: 3 },
            { medicineId: preserveRecommendationId, doseAmount: 4 },
          ],
        },
      ] as any,
      10,
      session,
    );

    expect(findMock).toHaveBeenCalledTimes(1);
    const [query, projection, options] = findMock.mock.calls[0];
    expect(query.isDeleted).toEqual({ $ne: true });
    expect(query._id.$in.map((id: Types.ObjectId) => id.toString())).toEqual([
      byTotalDoseId.toString(),
      missingRecommendationId.toString(),
      byAverageDoseId.toString(),
      byFixedRangeId.toString(),
      preserveRecommendationId.toString(),
    ]);
    expect(projection).toBe("_id rangeMin rangeMax totalDose");
    expect(options).toEqual({ session });

    expect(result).toEqual([
      {
        fluids: [
          { medicineId: byTotalDoseId.toString(), doseAmount: 7 },
          { medicineId: missingRecommendationId, doseAmount: 9 },
        ],
        medicines: [
          { medicineId: byAverageDoseId, doseAmount: 30 },
          { medicineId: { _id: byFixedRangeId }, doseAmount: 50 },
          { medicineId: preserveRecommendationId, doseAmount: 4 },
        ],
      },
    ]);
  });
});
