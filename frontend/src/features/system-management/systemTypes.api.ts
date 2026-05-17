import {
    requestBlob,
    requestFormDataWithResponseSchema,
    requestNoContent,
    requestWithRequestAndResponseSchema,
    requestWithSchema,
} from "../../lib/apiClient";
import { API_ROUTES } from "../../config/apiRoutes";
import { HTTP_METHODS } from "../../lib/http.constants";
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
    BulkTemplateDownloadDTOSchema,
    BulkTemplateUploadParamsDTOSchema,
    BulkTemplateUploadResponseDTO,
    BulkTemplateUploadResponseDTOSchema,
    UPLOAD,
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
            { method: HTTP_METHODS.GET, url: API_ROUTES.admin.types.getAll(typeName) },
            SimpleSystemTypeListResponseDTOSchema,
        ),

    getActive: (typeName: SystemTypeName): Promise<SimpleSystemTypeDTO[]> =>
        requestWithSchema(
            { method: HTTP_METHODS.GET, url: API_ROUTES.admin.types.getActive(typeName) },
            SimpleSystemTypeListResponseDTOSchema,
        ),

    getRaceTypesByAnimal: (animalTypeId: string): Promise<RaceTypeDTO[]> => {
        const params = SystemTypeByAnimalParamsDTOSchema.parse({
            typeName: SYSTEM_TYPE_NAMES.RACE_TYPES,
            animalTypeId,
        });
        return requestWithSchema(
            { method: HTTP_METHODS.GET, url: API_ROUTES.admin.types.byAnimalType(params.typeName, params.animalTypeId) },
            RaceTypeListResponseDTOSchema,
        );
    },

    getAnimalVitalsByAnimal: (animalTypeId: string): Promise<AnimalVitalDTO[]> => {
        const params = SystemTypeByAnimalParamsDTOSchema.parse({
            typeName: SYSTEM_TYPE_NAMES.ANIMAL_VITALS,
            animalTypeId,
        });
        return requestWithSchema(
            { method: HTTP_METHODS.GET, url: API_ROUTES.admin.types.byAnimalType(params.typeName, params.animalTypeId) },
            AnimalVitalListResponseDTOSchema,
        );
    },

    create: (typeName: SystemTypeName, payload: SystemTypeCreatePayload): Promise<SimpleSystemTypeDTO> =>
        requestWithRequestAndResponseSchema(
            { method: HTTP_METHODS.POST, url: API_ROUTES.admin.types.create(typeName) },
            payload,
            getCreateSchema(typeName),
            SimpleSystemTypeDTOSchema,
        ),

    update: (typeName: SystemTypeName, id: string, payload: SystemTypeEditPayload): Promise<SimpleSystemTypeDTO> =>
        requestWithRequestAndResponseSchema(
            { method: HTTP_METHODS.PUT, url: API_ROUTES.admin.types.edit(typeName, id) },
            { ...payload, id },
            getUpdateSchema(typeName),
            SimpleSystemTypeDTOSchema,
        ),

    delete: (typeName: SystemTypeName, id: string): Promise<void> => {
        const parsedParams = SystemTypeNameWithIdParamsDTOSchema.parse({ typeName, id });
        return requestNoContent({
            method: HTTP_METHODS.DELETE,
            url: API_ROUTES.admin.types.delete(parsedParams.typeName, parsedParams.id),
        });
    },

    downloadBulkTemplate: (systemType: SystemTypeName): Promise<Blob> => {
        const dto = BulkTemplateDownloadDTOSchema.parse({ systemType });
        return requestBlob({
            method: HTTP_METHODS.POST,
            url: API_ROUTES.admin.downloadBulkTemplate,
            data: dto,
        });
    },

    uploadBulkTemplate: (
        systemType: SystemTypeName,
        file: File,
    ): Promise<BulkTemplateUploadResponseDTO> => {
        const params = BulkTemplateUploadParamsDTOSchema.parse({ systemType });
        const form = new FormData();
        form.append(UPLOAD.FILE_FORM_FIELD_NAME, file);
        return requestFormDataWithResponseSchema(
            {
                method: HTTP_METHODS.POST,
                url: `${API_ROUTES.admin.uploadBulkTemplate}/${params.systemType}`,
            },
            form,
            BulkTemplateUploadResponseDTOSchema,
        );
    },
};
