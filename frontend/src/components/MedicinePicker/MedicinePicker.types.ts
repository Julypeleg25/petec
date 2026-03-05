import type {
    CaseDetailsResponseDTO,
    MedicineDTO,
    ReleaseMedicineDisplayDTO,
} from "@petec/shared";

type CaseDailyDetailsMedicineItemDTO = NonNullable<
    CaseDetailsResponseDTO["caseDailyDetails"]
>[number][number]["medicines"][number];

type ReleaseMedicineDisplayBase = Omit<
    ReleaseMedicineDisplayDTO,
    "rangeMax" | "rangeMin" | "totalDose"
>;

type MedicineRecommendationFields = Pick<
    MedicineDTO,
    "rangeMax" | "rangeMin" | "totalDose"
>;

type NormalizedMedicineRecommendationFields = {
    [K in keyof MedicineRecommendationFields]?: Exclude<
        MedicineRecommendationFields[K],
        null | undefined
    >;
};

export type MedicineSelectOptionObj = ReleaseMedicineDisplayBase &
    NormalizedMedicineRecommendationFields & {
        id?: MedicineDTO["id"];
        dosageText?: CaseDailyDetailsMedicineItemDTO["dosageText"];
    };
