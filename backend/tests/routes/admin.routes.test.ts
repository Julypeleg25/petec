import { Permission, UPLOAD } from "@petec/shared";
import { jest } from "@jest/globals";
import { ADMIN_ROUTE_PATHS } from "../../src/routes/admin/adminRoutes.constants.js";

const authenticate = jest.fn();
const requireAdmin = jest.fn();
const requirePermissionMock = jest.fn<(permission: string) => unknown>();
const validateBodyMock = jest.fn<(schema: unknown) => unknown>();
const validateParamsMock = jest.fn<(schema: unknown) => unknown>();
const validateAdminCreateTypeBody = jest.fn();
const validateAdminUpdateTypeBody = jest.fn();
const uploadBulkTemplateSingleMock = jest.fn<(fieldName: string) => unknown>();

const adminController = {
  getActiveTypes: jest.fn(),
  getAllTypes: jest.fn(),
  createType: jest.fn(),
  updateType: jest.fn(),
  deleteType: jest.fn(),
  getTypesByAnimalType: jest.fn(),
  getAllUsers: jest.fn(),
  updateUser: jest.fn(),
  deleteUser: jest.fn(),
};

const bulkTemplateController = {
  downloadTemplate: jest.fn(),
  uploadTemplate: jest.fn(),
};

const createRouterMock = () => ({
  use: jest.fn<(...args: any[]) => void>(),
  get: jest.fn<(...args: any[]) => void>(),
  post: jest.fn<(...args: any[]) => void>(),
  put: jest.fn<(...args: any[]) => void>(),
  delete: jest.fn<(...args: any[]) => void>(),
});

const loadAdminRoutes = async () => {
  jest.resetModules();
  requirePermissionMock.mockReset();
  validateBodyMock.mockReset();
  validateParamsMock.mockReset();
  uploadBulkTemplateSingleMock.mockReset();

  requirePermissionMock
    .mockReturnValueOnce({ kind: "permission-read-patient-active" })
    .mockReturnValueOnce({ kind: "permission-read-patient-animal" });
  validateBodyMock
    .mockReturnValueOnce({ kind: "validate-bulk-download" })
    .mockReturnValueOnce({ kind: "validate-update-user" });
  validateParamsMock
    .mockReturnValueOnce({ kind: "validate-bulk-upload" })
    .mockReturnValueOnce({ kind: "validate-active-types" })
    .mockReturnValueOnce({ kind: "validate-all-types" })
    .mockReturnValueOnce({ kind: "validate-type-create" })
    .mockReturnValueOnce({ kind: "validate-type-update" })
    .mockReturnValueOnce({ kind: "validate-type-delete" })
    .mockReturnValueOnce({ kind: "validate-types-by-animal" })
    .mockReturnValueOnce({ kind: "validate-user-update" })
    .mockReturnValueOnce({ kind: "validate-user-delete" });
  uploadBulkTemplateSingleMock.mockReturnValue({ kind: "upload-bulk-template" });

  const router = createRouterMock();

  jest.unstable_mockModule("express", () => ({
    Router: () => router,
  }));
  jest.unstable_mockModule("../../src/controllers/admin/index.js", () => ({
    adminController,
    bulkTemplateController,
  }));
  jest.unstable_mockModule("../../src/middlewares/auth.middleware.js", () => ({
    authenticate,
    requireAdmin,
    requirePermission: requirePermissionMock,
  }));
  jest.unstable_mockModule("../../src/middlewares/validate.js", () => ({
    validateBody: validateBodyMock,
    validateParams: validateParamsMock,
  }));
  jest.unstable_mockModule(
    "../../src/middlewares/adminTypeBodyValidation.js",
    () => ({
      validateAdminCreateTypeBody,
      validateAdminUpdateTypeBody,
    }),
  );
  jest.unstable_mockModule("../../src/middlewares/upload.js", () => ({
    uploadBulkTemplate: {
      single: uploadBulkTemplateSingleMock,
    },
  }));

  const module = await import("../../src/routes/admin/admin.routes.js");
  return { router, module };
};

describe("admin.routes", () => {
  it("registers bulk, type, and user management routes", async () => {
    const { router, module } = await loadAdminRoutes();

    expect(module.default).toBe(router);
    expect(router.use).toHaveBeenCalledWith(authenticate);
    expect(requirePermissionMock).toHaveBeenNthCalledWith(
      1,
      Permission.READ_PATIENT,
    );
    expect(requirePermissionMock).toHaveBeenNthCalledWith(
      2,
      Permission.READ_PATIENT,
    );
    expect(validateBodyMock).toHaveBeenCalledTimes(2);
    expect(validateParamsMock).toHaveBeenCalledTimes(9);
    expect(uploadBulkTemplateSingleMock).toHaveBeenCalledWith(
      UPLOAD.FILE_FORM_FIELD_NAME,
    );

    expect(router.post).toHaveBeenNthCalledWith(
      1,
      ADMIN_ROUTE_PATHS.bulkDownload,
      requireAdmin,
      validateBodyMock.mock.results[0]?.value,
      bulkTemplateController.downloadTemplate,
    );
    expect(router.post).toHaveBeenNthCalledWith(
      2,
      ADMIN_ROUTE_PATHS.bulkUpload,
      requireAdmin,
      validateParamsMock.mock.results[0]?.value,
      uploadBulkTemplateSingleMock.mock.results[0]?.value,
      bulkTemplateController.uploadTemplate,
    );
    expect(router.get).toHaveBeenNthCalledWith(
      1,
      ADMIN_ROUTE_PATHS.activeTypes,
      requirePermissionMock.mock.results[0]?.value,
      validateParamsMock.mock.results[1]?.value,
      adminController.getActiveTypes,
    );
    expect(router.get).toHaveBeenNthCalledWith(
      4,
      ADMIN_ROUTE_PATHS.users,
      requireAdmin,
      adminController.getAllUsers,
    );
    expect(router.put).toHaveBeenNthCalledWith(
      1,
      ADMIN_ROUTE_PATHS.typeById,
      requireAdmin,
      validateParamsMock.mock.results[4]?.value,
      validateAdminUpdateTypeBody,
      adminController.updateType,
    );
    expect(router.put).toHaveBeenNthCalledWith(
      2,
      ADMIN_ROUTE_PATHS.userById,
      requireAdmin,
      validateParamsMock.mock.results[7]?.value,
      validateBodyMock.mock.results[1]?.value,
      adminController.updateUser,
    );
    expect(router.delete).toHaveBeenNthCalledWith(
      1,
      ADMIN_ROUTE_PATHS.typeById,
      requireAdmin,
      validateParamsMock.mock.results[5]?.value,
      adminController.deleteType,
    );
    expect(router.delete).toHaveBeenNthCalledWith(
      2,
      ADMIN_ROUTE_PATHS.userById,
      requireAdmin,
      validateParamsMock.mock.results[8]?.value,
      adminController.deleteUser,
    );
  });
});
