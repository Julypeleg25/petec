import {
    SimpleSystemTypeDTO,
    SimpleSystemTypeListResponseDTOSchema,
    MedicineDTO,
    MedicineListResponseDTOSchema,
    CategoryIdParamsDTOSchema,
} from "@petec/shared";
import { requestWithSchema } from "../../lib/apiClient";
import { API_ROUTES } from "../../config/apiRoutes";
import { HTTP_METHODS } from "../../lib/http.constants";

export const medicineApi = {
    getAll: (): Promise<MedicineDTO[]> =>
        requestWithSchema({ method: HTTP_METHODS.GET, url: API_ROUTES.medicine.getAll }, MedicineListResponseDTOSchema),

    getAllByCategoryType: (categoryId: string): Promise<MedicineDTO[]> =>
        requestWithSchema(
            { method: HTTP_METHODS.GET, url: API_ROUTES.medicine.getAllByCategoryType(CategoryIdParamsDTOSchema.parse({ categoryId }).categoryId) },
            MedicineListResponseDTOSchema,
        ),

    getAllCategoryTypes: (): Promise<SimpleSystemTypeDTO[]> =>
        requestWithSchema(
            { method: HTTP_METHODS.GET, url: API_ROUTES.medicine.getAllCategoryTypes },
            SimpleSystemTypeListResponseDTOSchema,
        ),

    getFrequencies: (): Promise<SimpleSystemTypeDTO[]> =>
        requestWithSchema({ method: HTTP_METHODS.GET, url: API_ROUTES.medicine.frequencies }, SimpleSystemTypeListResponseDTOSchema),

    getRoutesOfAdministration: (): Promise<SimpleSystemTypeDTO[]> =>
        requestWithSchema(
            { method: HTTP_METHODS.GET, url: API_ROUTES.medicine.routesOfAdministration },
            SimpleSystemTypeListResponseDTOSchema,
        ),

    getMeasureUnitTypes: (): Promise<SimpleSystemTypeDTO[]> =>
        requestWithSchema(
            { method: HTTP_METHODS.GET, url: API_ROUTES.medicine.measureUnitTypes },
            SimpleSystemTypeListResponseDTOSchema,
        ),
};
