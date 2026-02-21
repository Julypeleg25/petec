import { requestNoContent, requestWithRequestAndResponseSchema, requestWithSchema } from "../../lib/api-client";
import { API_ROUTES } from "../../config/api-routes";
import {
    SYSTEM_TYPE_NAMES,
    type SystemTypeName,
    SimpleSystemTypeDTO,
    SimpleSystemTypeDTOSchema,
    SimpleSystemTypeListResponseDTOSchema,
    RaceTypeDTO,
    RaceTypeListResponseDTOSchema,
    AnimalVitalDTO,
    AnimalVitalListResponseDTOSchema,
    CreateTypeDTO,
    CreateTypeDTOSchema,
    CreateMedicineDTO,
    CreateMedicineDTOSchema,
    CreateAnimalVitalsDTO,
    CreateAnimalVitalsDTOSchema,
    EditTypeDTO,
    EditTypeDTOSchema,
    EditMedicineDTO,
    EditMedicineDTOSchema,
    EditAnimalVitalsDTO,
    EditAnimalVitalsDTOSchema,
    SystemTypeByAnimalParamsDTOSchema,
    SystemTypeNameWithIdParamsDTOSchema,
} from "@petec/shared";

export type SystemTypeCreatePayload = CreateTypeDTO | CreateMedicineDTO | CreateAnimalVitalsDTO;
export type SystemTypeEditPayload = Omit<EditTypeDTO, "id"> | Omit<EditMedicineDTO, "id"> | Omit<EditAnimalVitalsDTO, "id">;

const getCreateSchema = (typeName: SystemTypeName) => {
    if (typeName === SYSTEM_TYPE_NAMES.MEDICINES) {
        return CreateMedicineDTOSchema;
    }
    if (typeName === SYSTEM_TYPE_NAMES.ANIMAL_VITALS) {
        return CreateAnimalVitalsDTOSchema;
    }
    return CreateTypeDTOSchema;
};

const getUpdateSchema = (typeName: SystemTypeName) => {
    if (typeName === SYSTEM_TYPE_NAMES.MEDICINES) {
        return EditMedicineDTOSchema;
    }
    if (typeName === SYSTEM_TYPE_NAMES.ANIMAL_VITALS) {
        return EditAnimalVitalsDTOSchema;
    }
    return EditTypeDTOSchema;
};

export const systemTypesApi = {
    getAll: (typeName: SystemTypeName): Promise<SimpleSystemTypeDTO[]> =>
        requestWithSchema(
            { method: "get", url: API_ROUTES.admin.types.getAll(typeName) },
            SimpleSystemTypeListResponseDTOSchema,
        ),

    getActive: (typeName: SystemTypeName): Promise<SimpleSystemTypeDTO[]> =>
        requestWithSchema(
            { method: "get", url: API_ROUTES.admin.types.getActive(typeName) },
            SimpleSystemTypeListResponseDTOSchema,
        ),

    getRaceTypesByAnimal: (animalTypeId: string): Promise<RaceTypeDTO[]> => {
        const params = SystemTypeByAnimalParamsDTOSchema.parse({
            typeName: SYSTEM_TYPE_NAMES.RACE_TYPES,
            animalTypeId,
        });
        return requestWithSchema(
            { method: "get", url: API_ROUTES.admin.types.byAnimalType(params.typeName, params.animalTypeId) },
            RaceTypeListResponseDTOSchema,
        );
    },

    getAnimalVitalsByAnimal: (animalTypeId: string): Promise<AnimalVitalDTO[]> => {
        const params = SystemTypeByAnimalParamsDTOSchema.parse({
            typeName: SYSTEM_TYPE_NAMES.ANIMAL_VITALS,
            animalTypeId,
        });
        return requestWithSchema(
            { method: "get", url: API_ROUTES.admin.types.byAnimalType(params.typeName, params.animalTypeId) },
            AnimalVitalListResponseDTOSchema,
        );
    },

    create: (typeName: SystemTypeName, payload: SystemTypeCreatePayload): Promise<SimpleSystemTypeDTO> =>
        requestWithRequestAndResponseSchema(
            { method: "post", url: API_ROUTES.admin.types.create(typeName) },
            payload,
            getCreateSchema(typeName),
            SimpleSystemTypeDTOSchema,
        ),

    update: (typeName: SystemTypeName, id: string, payload: SystemTypeEditPayload): Promise<SimpleSystemTypeDTO> =>
        requestWithRequestAndResponseSchema(
            { method: "put", url: API_ROUTES.admin.types.edit(typeName, id) },
            { ...payload, id },
            getUpdateSchema(typeName),
            SimpleSystemTypeDTOSchema,
        ),

    delete: (typeName: SystemTypeName, id: string): Promise<void> => {
        const parsedParams = SystemTypeNameWithIdParamsDTOSchema.parse({ typeName, id });
        return requestNoContent({
            method: "delete",
            url: API_ROUTES.admin.types.delete(parsedParams.typeName, parsedParams.id),
        });
    },
};
