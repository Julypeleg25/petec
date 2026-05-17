export const ADMIN_ROUTE_PATHS = {
  activeTypes: "/types/:typeName",
  allTypes: "/types/:typeName/all",
  typeById: "/types/:typeName/:id",
  typesByAnimal: "/types/:typeName/animal/:animalTypeId",
  bulkDownload: "/types/bulk/download",
  bulkUpload: "/types/bulk/upload/:systemType",
  users: "/users",
  userById: "/users/:userId",
} as const;
