import { jest } from "@jest/globals";
import { Types, type ClientSession } from "mongoose";
import type { ICaseDetailsRow } from "../../../../src/models/case/index.js";

type Recommendation = {
  _id: Types.ObjectId;
  rangeMin?: number;
  rangeMax?: number;
  totalDose?: number;
};

type LeanQuery = {
  exec: typeof execMock;
};

type FindQuery = {
  lean: typeof leanMock;
};

type FindArgs = [
  query: {
    _id?: { $in: Types.ObjectId[] };
    isDeleted?: { $ne: boolean };
  },
  projection: string,
  options: { session?: ClientSession },
];

type CaseGridRowsInput = Array<Partial<ICaseDetailsRow>>;

const asCaseGridRows = (
  rows: ReadonlyArray<Record<string, unknown>>,
): CaseGridRowsInput => rows as CaseGridRowsInput;

const execMock = jest.fn<() => Promise<Recommendation[]>>();
const leanMock = jest.fn<() => LeanQuery>();
const findMock = jest.fn<(...args: FindArgs) => FindQuery>();

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
    const rows = asCaseGridRows([
      {
        time: "08:00",
        fluids: [{ medicineId: "", doseAmount: 1 }],
        medicines: [{ medicineId: "not-an-object-id", doseAmount: 2 }],
      },
      {
        time: "09:00",
        medicines: [{ medicineId: { _id: "plain-string-id" }, doseAmount: 3 }],
      },
    ]);

    const result = await recalculateCaseGridMedicationDoses(rows, 10);

    expect(findMock).not.toHaveBeenCalled();
    expect(result).toEqual(rows);
    expect(result[0]).not.toBe(rows[0]);
    expect(result[0].fluids).toBe(rows[0].fluids);
    expect(result[0].medicines).toBe(rows[0].medicines);
    expect(result[1]).not.toBe(rows[1]);
    expect(result[1].medicines).toBe(rows[1].medicines);
  });

  it("recalculates fluid and medicine doses from stored recommendations", async () => {
    const byAverageDoseId = new Types.ObjectId();
    const byFixedRangeId = new Types.ObjectId();
    const byTotalDoseId = new Types.ObjectId();
    const preserveRecommendationId = new Types.ObjectId();
    const missingRecommendationId = new Types.ObjectId();
    const session = {} as ClientSession;

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
      asCaseGridRows([
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
      ]),
      10,
      session,
    );

    expect(findMock).toHaveBeenCalledTimes(1);
    const firstCall = findMock.mock.calls[0];
    expect(firstCall).toBeDefined();
    if (!firstCall) {
      throw new Error("findMock was not called");
    }
    const [query, projection, options] = firstCall;
    expect(query.isDeleted).toEqual({ $ne: true });
    expect(query._id).toBeDefined();
    if (!query._id) {
      throw new Error("Expected _id filter to be present");
    }
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
