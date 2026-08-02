import { Permission, UPLOAD } from "@petec/shared";
import { jest } from "@jest/globals";
import { PATIENT_ROUTE_PATHS } from "../../src/routes/patient/patientRoutes.constants.js";

const authenticate = jest.fn();
const requirePermissionMock = jest.fn<(permission: string) => unknown>();
const validateBodyMock = jest.fn<(schema: unknown) => unknown>();
const validateParamsMock = jest.fn<(schema: unknown) => unknown>();
const uploadImageSingleMock = jest.fn<(fieldName: string) => unknown>();

const patientController = {
  getPatientPhoto: jest.fn(),
  createPatientAndCase: jest.fn(),
  editPatientAndCase: jest.fn(),
  getCaseDetails: jest.fn(),
  releasePatient: jest.fn(),
  getReleasePatientData: jest.fn(),
  archivePatientCase: jest.fn(),
  deletePatientCase: jest.fn(),
  getDocuments: jest.fn(),
  uploadDocument: jest.fn(),
  uploadPatientPhoto: jest.fn(),
  deleteDocument: jest.fn(),
  getAnesthesiaForm: jest.fn(),
  upsertAnesthesiaForm: jest.fn(),
  getChartsData: jest.fn(),
  getDailyPlan: jest.fn(),
  getCalendarMonth: jest.fn(),
  updateDailyPlan: jest.fn(),
};
const caseSuggestionController = {
  generate: jest.fn(),
};

const createRouterMock = () => ({
  use: jest.fn<(...args: any[]) => void>(),
  get: jest.fn<(...args: any[]) => void>(),
  post: jest.fn<(...args: any[]) => void>(),
  put: jest.fn<(...args: any[]) => void>(),
  delete: jest.fn<(...args: any[]) => void>(),
});

const loadPatientRoutes = async () => {
  jest.resetModules();
  requirePermissionMock.mockReset();
  validateBodyMock.mockReset();
  validateParamsMock.mockReset();
  uploadImageSingleMock.mockReset();

  requirePermissionMock
    .mockReturnValueOnce({ kind: "permission-read-case-suggestions" })
    .mockReturnValueOnce({ kind: "permission-write-patient-create" })
    .mockReturnValueOnce({ kind: "permission-write-patient-edit" })
    .mockReturnValueOnce({ kind: "permission-read-case-1" })
    .mockReturnValueOnce({ kind: "permission-read-case-2" })
    .mockReturnValueOnce({ kind: "permission-read-case-3" })
    .mockReturnValueOnce({ kind: "permission-read-case-4" })
    .mockReturnValueOnce({ kind: "permission-write-case-release" })
    .mockReturnValueOnce({ kind: "permission-read-case-release" })
    .mockReturnValueOnce({ kind: "permission-write-case-archive" })
    .mockReturnValueOnce({ kind: "permission-write-case-delete" })
    .mockReturnValueOnce({ kind: "permission-read-patient-docs" })
    .mockReturnValueOnce({ kind: "permission-manage-docs-upload" })
    .mockReturnValueOnce({ kind: "permission-write-patient-photo" })
    .mockReturnValueOnce({ kind: "permission-manage-docs-delete" })
    .mockReturnValueOnce({ kind: "permission-read-case-anesthesia" })
    .mockReturnValueOnce({ kind: "permission-write-case-anesthesia" })
    .mockReturnValueOnce({ kind: "permission-read-case-charts" })
    .mockReturnValueOnce({ kind: "permission-read-case-daily-plan" })
    .mockReturnValueOnce({ kind: "permission-read-case-calendar" })
    .mockReturnValueOnce({ kind: "permission-write-case-daily-plan" });

  validateBodyMock
    .mockReturnValueOnce({ kind: "validate-case-suggestions" })
    .mockReturnValueOnce({ kind: "validate-new-patient" })
    .mockReturnValueOnce({ kind: "validate-edit-patient" })
    .mockReturnValueOnce({ kind: "validate-release" })
    .mockReturnValueOnce({ kind: "validate-archive" })
    .mockReturnValueOnce({ kind: "validate-delete-case" })
    .mockReturnValueOnce({ kind: "validate-upload-document" })
    .mockReturnValueOnce({ kind: "validate-anesthesia" })
    .mockReturnValueOnce({ kind: "validate-update-daily-plan" });

  validateParamsMock
    .mockReturnValueOnce({ kind: "validate-patient-photo-public" })
    .mockReturnValueOnce({ kind: "validate-case-suggestions" })
    .mockReturnValueOnce({ kind: "validate-case-details-1" })
    .mockReturnValueOnce({ kind: "validate-case-details-2" })
    .mockReturnValueOnce({ kind: "validate-case-details-3" })
    .mockReturnValueOnce({ kind: "validate-case-details-4" })
    .mockReturnValueOnce({ kind: "validate-case-release-id" })
    .mockReturnValueOnce({ kind: "validate-documents-by-case" })
    .mockReturnValueOnce({ kind: "validate-patient-photo-upload" })
    .mockReturnValueOnce({ kind: "validate-document-delete" })
    .mockReturnValueOnce({ kind: "validate-case-anesthesia-get" })
    .mockReturnValueOnce({ kind: "validate-case-anesthesia-post" })
    .mockReturnValueOnce({ kind: "validate-case-charts" })
    .mockReturnValueOnce({ kind: "validate-calendar" });

  uploadImageSingleMock
    .mockReturnValueOnce({ kind: "upload-image-document" })
    .mockReturnValueOnce({ kind: "upload-image-photo" });

  const router = createRouterMock();

  jest.unstable_mockModule("express", () => ({
    Router: () => router,
  }));
  jest.unstable_mockModule("../../src/controllers/patient/index.js", () => ({
    patientController,
    caseSuggestionController,
  }));
  jest.unstable_mockModule("../../src/middlewares/auth.middleware.js", () => ({
    authenticate,
    requirePermission: requirePermissionMock,
  }));
  jest.unstable_mockModule("../../src/middlewares/validate.js", () => ({
    validateBody: validateBodyMock,
    validateParams: validateParamsMock,
  }));
  jest.unstable_mockModule("../../src/middlewares/upload.js", () => ({
    uploadImage: {
      single: uploadImageSingleMock,
    },
  }));

  const module = await import("../../src/routes/patient/patient.routes.js");
  return { router, module };
};

describe("patient.routes", () => {
  it("registers the public photo route before authenticated patient routes", async () => {
    const { router, module } = await loadPatientRoutes();

    expect(module.default).toBe(router);
    expect(validateParamsMock).toHaveBeenCalledTimes(14);
    expect(router.get.mock.calls[0]?.[0]).toBe(
      PATIENT_ROUTE_PATHS.patientPhoto,
    );
    expect(router.get.mock.calls[0]?.[1]).toBe(
      validateParamsMock.mock.results[0]?.value,
    );
    expect(router.get.mock.calls[0]?.[2]).toBe(
      patientController.getPatientPhoto,
    );
    expect(router.use).toHaveBeenCalledWith(authenticate);
  });

  it("wires the key patient CRUD, document, and planning endpoints", async () => {
    const { router } = await loadPatientRoutes();

    expect(requirePermissionMock).toHaveBeenCalledWith(
      Permission.WRITE_PATIENT,
    );
    expect(requirePermissionMock).toHaveBeenCalledWith(Permission.READ_CASE);
    expect(requirePermissionMock).toHaveBeenCalledWith(Permission.WRITE_CASE);
    expect(requirePermissionMock).toHaveBeenCalledWith(
      Permission.MANAGE_DOCUMENTS,
    );
    expect(validateBodyMock).toHaveBeenCalledTimes(9);
    expect(validateParamsMock).toHaveBeenCalledTimes(14);
    expect(uploadImageSingleMock).toHaveBeenCalledWith(
      UPLOAD.FILE_FORM_FIELD_NAME,
    );

    expect(router.post).toHaveBeenCalledWith(
      PATIENT_ROUTE_PATHS.newPatient,
      requirePermissionMock.mock.results[1]?.value,
      validateBodyMock.mock.results[1]?.value,
      patientController.createPatientAndCase,
    );
    expect(router.post).toHaveBeenCalledWith(
      PATIENT_ROUTE_PATHS.documentUpload,
      requirePermissionMock.mock.results[12]?.value,
      uploadImageSingleMock.mock.results[0]?.value,
      validateBodyMock.mock.results[6]?.value,
      patientController.uploadDocument,
    );
    expect(router.post).toHaveBeenCalledWith(
      PATIENT_ROUTE_PATHS.patientPhoto,
      requirePermissionMock.mock.results[13]?.value,
      validateParamsMock.mock.results[8]?.value,
      uploadImageSingleMock.mock.results[1]?.value,
      patientController.uploadPatientPhoto,
    );
    expect(router.put).toHaveBeenCalledWith(
      PATIENT_ROUTE_PATHS.dailyPlan,
      requirePermissionMock.mock.results[20]?.value,
      validateBodyMock.mock.results[8]?.value,
      patientController.updateDailyPlan,
    );
    expect(router.delete).toHaveBeenCalledWith(
      PATIENT_ROUTE_PATHS.documentDelete,
      requirePermissionMock.mock.results[14]?.value,
      validateParamsMock.mock.results[9]?.value,
      patientController.deleteDocument,
    );
  });
});
