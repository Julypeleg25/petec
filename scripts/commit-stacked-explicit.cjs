#!/usr/bin/env node
/* eslint-disable no-console */
const { spawnSync } = require("child_process");
const fs = require("fs");

const args = process.argv.slice(2);
const prefixArg = args.find((a) => a.startsWith("--prefix="));
const prefix = prefixArg ? prefixArg.split("=")[1] : "";
const planOnly = args.includes("--plan");
const gitArg = args.find((a) => a.startsWith("--git="));
const userGitPath = gitArg ? gitArg.slice("--git=".length).replace(/^"+|"+$/g, "") : "";

const groups = [
  {
    "key": "refactor/shared-dto-sorting",
    "files": [
      "packages/shared/src/dtos/admin.dto.ts",
      "packages/shared/src/dtos/anesthesia.dto.ts",
      "packages/shared/src/dtos/app.dto.ts",
      "packages/shared/src/dtos/auth.dto.ts",
      "packages/shared/src/dtos/index.ts",
      "packages/shared/src/dtos/params/admin.params.dto.ts",
      "packages/shared/src/dtos/params/index.ts",
      "packages/shared/src/dtos/params/medicine.params.dto.ts",
      "packages/shared/src/dtos/params/patient.params.dto.ts",
      "packages/shared/src/dtos/patient.dto.ts",
      "packages/shared/src/dtos/table.dto.ts",
      "packages/shared/src/dtos/table.dto.types.ts",
      "packages/shared/src/dtos/user.dto.ts"
    ]
  },
  {
    "key": "refactor/shared-types-and-exports",
    "files": [
      "packages/shared/src/constants/app.constants.ts",
      "packages/shared/src/constants/auth.constants.ts",
      "packages/shared/src/constants/http.constants.ts",
      "packages/shared/src/constants/index.ts",
      "packages/shared/src/constants/pagination.constants.ts",
      "packages/shared/src/constants/routes.constants.ts",
      "packages/shared/src/constants/security.constants.ts",
      "packages/shared/src/constants/storage.constants.ts",
      "packages/shared/src/constants/system-types.constants.ts",
      "packages/shared/src/constants/table.constants.ts",
      "packages/shared/src/constants/upload.constants.ts",
      "packages/shared/src/errors/app-error.ts",
      "packages/shared/src/errors/app-error.types.ts",
      "packages/shared/src/errors/index.ts",
      "packages/shared/src/index.ts",
      "packages/shared/src/types/api.types.ts",
      "packages/shared/src/types/auth.types.ts",
      "packages/shared/src/types/case.types.ts",
      "packages/shared/src/types/index.ts",
      "packages/shared/src/types/table.types.ts",
      "packages/shared/src/utils/index.ts",
      "packages/shared/src/utils/object-id.utils.ts",
      "packages/shared/src/utils/schema.utils.ts",
      "packages/shared/src/utils/zod.utils.ts"
    ]
  },
  {
    "key": "refactor/server-model-types-extraction",
    "files": [
      "backend/src/mappers/patient.mappers.ts",
      "backend/src/mappers/patient.mappers.types.ts",
      "backend/src/mappers/table.mappers.ts",
      "backend/src/mappers/table.mappers.types.ts",
      "backend/src/models/AnesthesiaForm.ts",
      "backend/src/models/AnesthesiaForm.types.ts",
      "backend/src/models/AuditLog.ts",
      "backend/src/models/AuditLog.types.ts",
      "backend/src/models/Lookups.ts",
      "backend/src/models/Lookups.types.ts",
      "backend/src/models/MasterCase.ts",
      "backend/src/models/MasterCase.types.ts",
      "backend/src/models/Patient.ts",
      "backend/src/models/Patient.types.ts",
      "backend/src/models/PatientDocument.ts",
      "backend/src/models/PatientDocument.types.ts",
      "backend/src/models/PatientMedicine.ts",
      "backend/src/models/PatientMedicine.types.ts",
      "backend/src/models/User.ts",
      "backend/src/models/User.types.ts",
      "backend/src/models/index.ts"
    ]
  },
  {
    "key": "feat/server-validation",
    "files": [
      "backend/src/middlewares/adminTypeBodyValidation.ts",
      "backend/src/middlewares/validate.ts",
      "backend/src/utils/sanitizer.ts",
      "backend/src/utils/sanitizer.types.ts",
      "backend/src/utils/validation.types.ts"
    ]
  },
  {
    "key": "feat/server-auth",
    "files": [
      "backend/src/controllers/auth.controller.ts",
      "backend/src/middlewares/auth.middleware.ts",
      "backend/src/routes/auth.routes.ts",
      "backend/src/services/auth.service.ts",
      "backend/src/types/express.d.ts",
      "backend/src/utils/authTokens.ts"
    ]
  },
  {
    "key": "bugfix/server-errors-and-logging",
    "files": [
      "backend/test-logger2.js",
      "backend/test-logger3.js",
      "backend/src/middlewares/errorsHandler.ts",
      "backend/src/middlewares/notFound.middleware.ts",
      "backend/src/middlewares/requestId.ts",
      "backend/src/middlewares/requestLogger.ts",
      "backend/src/utils/errors.ts",
      "backend/src/utils/logger.ts",
      "backend/src/utils/request.utils.ts"
    ]
  },
  {
    "key": "refactor/server-data-layer",
    "files": [
      "backend/src/db/dbConnection.ts",
      "backend/src/repositories/base.repository.ts",
      "backend/src/repositories/patient.repository.ts",
      "backend/src/repositories/patientMedicine.repository.ts",
      "backend/src/repositories/systemTypes.repository.ts",
      "backend/src/repositories/user.repository.ts"
    ]
  },
  {
    "key": "feat/server-routes-and-services",
    "files": [
      "backend/src/controllers/admin.controller.ts",
      "backend/src/controllers/medicine.controller.ts",
      "backend/src/controllers/patient.controller.ts",
      "backend/src/controllers/table.controller.ts",
      "backend/src/controllers/user.controller.ts",
      "backend/src/routes/admin.routes.ts",
      "backend/src/routes/medicine.routes.ts",
      "backend/src/routes/patient.routes.ts",
      "backend/src/routes/table.routes.ts",
      "backend/src/services/medicine.service.ts",
      "backend/src/services/medicine.service.types.ts",
      "backend/src/services/patient.service.ts",
      "backend/src/services/systemTypes.service.ts",
      "backend/src/services/table.service.ts",
      "backend/src/services/user.service.ts"
    ]
  },
  {
    "key": "chore/server-bootstrap-and-utils",
    "files": [
      "backend/.gitignore",
      "backend/package-lock.json",
      "backend/package.json",
      "backend/src/app.ts",
      "backend/src/config/config.json",
      "backend/src/config/config.ts",
      "backend/src/utils/apiResponse.ts",
      "backend/src/utils/constants.ts",
      "backend/src/utils/emailUtils.ts",
      "backend/src/utils/emailUtils.types.ts",
      "backend/src/utils/objectId.utils.ts",
      "backend/src/utils/types.ts",
      "backend/tsconfig.json"
    ]
  },
  {
    "key": "feat/frontend-auth",
    "files": [
      "frontend/src/components/ForgotPassword/ForgotPassword.tsx",
      "frontend/src/components/Login/Login.css",
      "frontend/src/components/Login/Login.tsx",
      "frontend/src/components/ResetPassword/ResetPassword.css",
      "frontend/src/components/ResetPassword/ResetPassword.tsx",
      "frontend/src/components/ResetPassword/ResetPassword.types.ts",
      "frontend/src/features/auth/AuthProvider.tsx",
      "frontend/src/features/auth/AuthProvider.types.ts",
      "frontend/src/features/auth/ProtectedRoute.tsx",
      "frontend/src/features/auth/ProtectedRoute.types.ts",
      "frontend/src/features/auth/auth.api.ts",
      "frontend/src/features/auth/hooks/useForgotPassword.ts",
      "frontend/src/features/auth/hooks/useLogin.ts",
      "frontend/src/features/auth/hooks/useResetPassword.ts",
      "frontend/src/router/AppRouter.tsx"
    ]
  },
  {
    "key": "feat/frontend-validation-and-forms",
    "files": [
      "frontend/src/utils/FormCheckbox/FormCheckbox.css",
      "frontend/src/utils/FormCheckbox/FormCheckbox.tsx",
      "frontend/src/utils/FormCheckbox/FormCheckbox.types.ts",
      "frontend/src/utils/FormInput/FormInput.css",
      "frontend/src/utils/FormInput/FormInput.tsx",
      "frontend/src/utils/FormInput/FormInput.types.ts",
      "frontend/src/utils/FormRadio/FormRadio.css",
      "frontend/src/utils/FormRadio/FormRadio.tsx",
      "frontend/src/utils/FormRadio/FormRadio.types.ts",
      "frontend/src/utils/FormSelect/FormSelect.css",
      "frontend/src/utils/FormSelect/FormSelect.tsx",
      "frontend/src/utils/FormSelect/FormSelect.types.ts",
      "frontend/src/utils/FormTextarea/FormTextarea.css",
      "frontend/src/utils/FormTextarea/FormTextarea.tsx",
      "frontend/src/utils/FormTextarea/FormTextarea.types.ts",
      "frontend/src/utils/FormUploadImage/FormUploadImage.css",
      "frontend/src/utils/FormUploadImage/FormUploadImage.tsx",
      "frontend/src/utils/FormUploadImage/FormUploadImage.types.ts",
      "frontend/src/utils/FormattingUtil.ts",
      "frontend/src/utils/form.ts"
    ]
  },
  {
    "key": "feat/frontend-patients-flow",
    "files": [
      "frontend/src/components/DeletePatient/DeletePatient.css",
      "frontend/src/components/DeletePatient/DeletePatient.tsx",
      "frontend/src/components/DeletePatient/DeletePatient.types.ts",
      "frontend/src/components/PatientCharts/PatientCharts.css",
      "frontend/src/components/PatientCharts/PatientCharts.tsx",
      "frontend/src/components/PatientCharts/PatientCharts.types.ts",
      "frontend/src/components/PatientDocuments/PatientDocuments.css",
      "frontend/src/components/PatientDocuments/PatientDocuments.tsx",
      "frontend/src/components/PatientDocuments/PatientDocuments.types.ts",
      "frontend/src/components/Patients/CaseDetailsTable/CaseDetailsTable.css",
      "frontend/src/components/Patients/CaseDetailsTable/CaseDetailsTable.tsx",
      "frontend/src/components/Patients/CaseDetailsTable/CaseDetailsTable.types.ts",
      "frontend/src/components/Patients/CaseDetailsTable/CaseDetailsTable.utils.ts",
      "frontend/src/components/Patients/CaseDetailsTable/CaseDetailsTableCells.tsx",
      "frontend/src/components/Patients/CaseDetailsTable/TableUnEditableCellElement.tsx",
      "frontend/src/components/Patients/CaseDetailsTable/useCaseDetailsData.constants.ts",
      "frontend/src/components/Patients/CaseDetailsTable/useCaseDetailsData.tsx",
      "frontend/src/components/Patients/Patients.css",
      "frontend/src/components/Patients/Patients.tsx",
      "frontend/src/components/Patients/Patients.types.ts",
      "frontend/src/components/Patients/SavePatient/SavePatient.css",
      "frontend/src/components/Patients/SavePatient/SavePatient.tsx",
      "frontend/src/components/Patients/SavePatient/SavePatient.types.ts",
      "frontend/src/components/Patients/SavePatient/SavePatientModals.tsx",
      "frontend/src/components/Patients/SavePatient/SavePatientModals.types.ts",
      "frontend/src/components/Patients/SavePatient/save-patient.constants.ts",
      "frontend/src/components/Patients/SavePatient/useSavePatient.tsx",
      "frontend/src/components/Patients/patients.constants.ts",
      "frontend/src/components/Patients/usePatients.tsx",
      "frontend/src/components/ReleasePatient/ReleasePatient.css",
      "frontend/src/components/ReleasePatient/ReleasePatient.tsx",
      "frontend/src/components/ReleasePatient/ReleasePatient.types.ts",
      "frontend/src/components/ReleasePatient/useReleasePatient.tsx",
      "frontend/src/components/ReleasePatient/useReleasePatient.types.ts",
      "frontend/src/features/patients/patients.api.ts",
      "frontend/src/features/patients/usePatientApi.ts"
    ]
  },
  {
    "key": "feat/frontend-system-management",
    "files": [
      "frontend/src/components/SystemManagement/HistoryItemDetails/HistoryItemDetails.css",
      "frontend/src/components/SystemManagement/HistoryItemDetails/HistoryItemDetails.tsx",
      "frontend/src/components/SystemManagement/HistoryItemDetails/HistoryItemDetails.types.ts",
      "frontend/src/components/SystemManagement/HistoryTab/HistoryTab.tsx",
      "frontend/src/components/SystemManagement/SaveAnimalVitals/SaveAnimalVitals.css",
      "frontend/src/components/SystemManagement/SaveAnimalVitals/SaveAnimalVitals.tsx",
      "frontend/src/components/SystemManagement/SaveAnimalVitals/SaveAnimalVitals.types.ts",
      "frontend/src/components/SystemManagement/SaveMedicine/SaveMedicine.css",
      "frontend/src/components/SystemManagement/SaveMedicine/SaveMedicine.tsx",
      "frontend/src/components/SystemManagement/SaveMedicine/SaveMedicine.types.ts",
      "frontend/src/components/SystemManagement/SaveRaceType/SaveRaceType.css",
      "frontend/src/components/SystemManagement/SaveRaceType/SaveRaceType.tsx",
      "frontend/src/components/SystemManagement/SaveRaceType/SaveRaceType.types.ts",
      "frontend/src/components/SystemManagement/SaveUser/SaveUser.css",
      "frontend/src/components/SystemManagement/SaveUser/SaveUser.tsx",
      "frontend/src/components/SystemManagement/SaveUser/SaveUser.types.ts",
      "frontend/src/components/SystemManagement/SystemManagement.css",
      "frontend/src/components/SystemManagement/SystemManagement.tsx",
      "frontend/src/components/SystemManagement/SystemManagement.types.ts",
      "frontend/src/components/SystemManagement/SystemTypeForm/SystemTypeForm.config.ts",
      "frontend/src/components/SystemManagement/SystemTypeForm/SystemTypeForm.css",
      "frontend/src/components/SystemManagement/SystemTypeForm/SystemTypeForm.tsx",
      "frontend/src/components/SystemManagement/SystemTypeForm/SystemTypeForm.types.ts",
      "frontend/src/components/SystemManagement/SystemTypesData.ts",
      "frontend/src/components/SystemManagement/SystemTypesData.types.ts",
      "frontend/src/components/SystemManagement/SystemTypesTab/SystemTypesTab.tsx",
      "frontend/src/components/SystemManagement/SystemTypesTab/SystemTypesTab.types.ts",
      "frontend/src/components/SystemManagement/UsersTab/UsersTab.tsx",
      "frontend/src/features/system-management/hooks/useUserApi.ts",
      "frontend/src/features/system-management/hooks/userKeys.ts",
      "frontend/src/features/system-management/system-types.api.ts",
      "frontend/src/features/system-management/system-types.hooks.ts",
      "frontend/src/features/system-management/users.api.ts"
    ]
  },
  {
    "key": "refactor/frontend-api-router-and-types",
    "files": [
      "frontend/src/config/api-routes.ts",
      "frontend/src/config/app-routes.ts",
      "frontend/src/config/env.ts",
      "frontend/src/features/medicine/medicine.api.ts",
      "frontend/src/features/medicine/useMedicineApi.ts",
      "frontend/src/features/table/table.api.ts",
      "frontend/src/features/table/useTableApi.ts",
      "frontend/src/lib/api-client.ts",
      "frontend/src/lib/api-client.types.ts",
      "frontend/src/lib/query-client.ts",
      "frontend/src/types/api.types.ts",
      "frontend/src/types/auth.types.ts",
      "frontend/src/types/index.ts",
      "frontend/src/types/table.types.ts"
    ]
  },
  {
    "key": "refactor/frontend-ui-and-utils",
    "files": [
      "frontend/src/components/AnesthesiaProcedureForm/AnesthesiaProcedureForm.css",
      "frontend/src/components/AnesthesiaProcedureForm/AnesthesiaProcedureForm.tsx",
      "frontend/src/components/AnesthesiaProcedureForm/AnesthesiaProcedureForm.types.ts",
      "frontend/src/components/AppLineChart/AppLineChart.css",
      "frontend/src/components/AppLineChart/AppLineChart.tsx",
      "frontend/src/components/AppLineChart/AppLineChart.types.ts",
      "frontend/src/components/CatheterReplacement/CatheterReplacement.css",
      "frontend/src/components/CatheterReplacement/CatheterReplacement.tsx",
      "frontend/src/components/CatheterReplacement/CatheterReplacement.types.ts",
      "frontend/src/components/DailyPlan/DailyPlan.css",
      "frontend/src/components/DailyPlan/DailyPlan.tsx",
      "frontend/src/components/DailyPlan/DailyPlan.types.ts",
      "frontend/src/components/ErrorBoundary/ErrorBoundary.tsx",
      "frontend/src/components/ErrorBoundary/ErrorBoundary.types.ts",
      "frontend/src/components/Header/Header.css",
      "frontend/src/components/Header/Header.tsx",
      "frontend/src/components/Header/Header.types.ts",
      "frontend/src/components/MainPage/MainPage.css",
      "frontend/src/components/MainPage/MainPage.tsx",
      "frontend/src/components/MainPage/MainPage.types.ts",
      "frontend/src/components/MedicinePicker/MedicinePicker.css",
      "frontend/src/components/MedicinePicker/MedicinePicker.tsx",
      "frontend/src/components/MedicinePicker/MedicinePicker.types.ts",
      "frontend/src/components/MedicinePicker/useMedicinePicker.tsx",
      "frontend/src/components/SelectOptionsPicker/SelectOptionsPicker.css",
      "frontend/src/components/SelectOptionsPicker/SelectOptionsPicker.tsx",
      "frontend/src/components/SelectOptionsPicker/SelectOptionsPicker.types.ts",
      "frontend/src/utils/DatePicker/DatePicker.css",
      "frontend/src/utils/DatePicker/DatePicker.tsx",
      "frontend/src/utils/DatePicker/DatePicker.types.ts",
      "frontend/src/utils/DismissibleToast/DismissibleToast.css",
      "frontend/src/utils/DismissibleToast/DismissibleToast.tsx",
      "frontend/src/utils/FileUtils.ts",
      "frontend/src/utils/FileUtils.types.ts",
      "frontend/src/utils/Modal/Modal.css",
      "frontend/src/utils/Modal/Modal.tsx",
      "frontend/src/utils/Modal/Modal.types.ts",
      "frontend/src/utils/MyLoader/MyLoader.css",
      "frontend/src/utils/MyLoader/MyLoader.tsx",
      "frontend/src/utils/MyLoader/MyLoader.types.ts",
      "frontend/src/utils/Pagination/Pagination.css",
      "frontend/src/utils/Pagination/Pagination.tsx",
      "frontend/src/utils/Pagination/Pagination.types.ts",
      "frontend/src/utils/Pagination/Pagination.utils.ts",
      "frontend/src/utils/Pagination/usePagination.tsx",
      "frontend/src/utils/RangeSlider/RangeSlider.css",
      "frontend/src/utils/RangeSlider/RangeSlider.tsx",
      "frontend/src/utils/RangeSlider/RangeSlider.types.ts",
      "frontend/src/utils/SearchBar/SearchBar.css",
      "frontend/src/utils/SearchBar/SearchBar.tsx",
      "frontend/src/utils/SearchBar/SearchBar.types.ts",
      "frontend/src/utils/Table/Table.css",
      "frontend/src/utils/Table/Table.tsx",
      "frontend/src/utils/Table/Table.types.ts",
      "frontend/src/utils/TableGenerator/TableFormattingOptionsEnum.ts",
      "frontend/src/utils/TableGenerator/TableGenerator.css",
      "frontend/src/utils/TableGenerator/TableGenerator.tsx",
      "frontend/src/utils/TableGenerator/TableGenerator.types.ts",
      "frontend/src/utils/TableGenerator/TableGenerator.utils.ts",
      "frontend/src/utils/UploadFile/UploadFile.css",
      "frontend/src/utils/UploadFile/UploadFile.tsx",
      "frontend/src/utils/UploadFile/UploadFile.types.ts",
      "frontend/src/utils/constants.ts"
    ]
  },
  {
    "key": "chore/frontend-core-and-assets",
    "files": [
      "frontend/.gitignore",
      "frontend/README.md",
      "frontend/index.html",
      "frontend/public/assets/images/default-patient-image.jpg",
      "frontend/public/assets/images/logo_reversed.jpg",
      "frontend/public/assets/images/pet-ec_logo.jpg",
      "frontend/public/favicon.ico",
      "frontend/public/index.html",
      "frontend/public/manifest.json",
      "frontend/public/robots.txt",
      "frontend/public/vite.svg",
      "frontend/src/App.css",
      "frontend/src/App.tsx",
      "frontend/src/index.css",
      "frontend/src/index.tsx"
    ]
  },
  {
    "key": "chore/workspace-tooling-and-lockfiles",
    "files": [
      "gitignore",
      ".gitignore",
      "frontend/eslint.config.js",
      "frontend/package-lock.json",
      "frontend/package.json",
      "frontend/tsconfig.app.json",
      "frontend/tsconfig.json",
      "frontend/tsconfig.node.json",
      "frontend/vite.config.ts",
      "package-lock.json",
      "package.json",
      "packages/shared/package-lock.json",
      "packages/shared/package.json",
      "packages/shared/tsconfig.json",
      "packages/shared/tsup.config.ts"
    ]
  },
  {
    "key": "chore/seed-and-migrations",
    "files": [
      "petec-seed/PETEC-SCRIPT.pgsql",
      "petec-seed/README_CONVERTER.md",
      "petec-seed/petec_pgsql_to_mongo_seed.js"
    ]
  },
  {
    "key": "chore/repo-scripts",
    "files": [
      "frontend/capture_tsc.js",
      "frontend/fix_SavePatient.js",
      "scripts/build-explicit-manifest.cjs",
      "scripts/changed-files.txt",
      "scripts/commit-stacked-explicit.cjs",
      "scripts/explicit-branch-manifest.json",
      "scripts/list-changed-files-isogit.cjs",
      "scripts/stacked-branches-by-topic.cjs",
      "scripts/stacked-commit-plan.cmd"
    ]
  }
];

function resolveGitBinary() {
  if (userGitPath) return userGitPath;

  const candidates = [
    "git",
    "C:\\Program Files\\Git\\cmd\\git.exe",
    "C:\\Program Files\\Git\\bin\\git.exe",
    "C:\\Program Files (x86)\\Git\\cmd\\git.exe",
    `${process.env.LocalAppData || ""}\\Programs\\Git\\cmd\\git.exe`,
    `${process.env.USERPROFILE || ""}\\scoop\\apps\\git\\current\\cmd\\git.exe`,
    "C:\\ProgramData\\chocolatey\\bin\\git.exe",
  ].filter(Boolean);

  for (const candidate of candidates) {
    if (candidate === "git") {
      const probe = spawnSync(candidate, ["--version"], { encoding: "utf8" });
      if (probe.status === 0) return candidate;
      continue;
    }
    if (fs.existsSync(candidate)) return candidate;
  }
  return "";
}

const gitBin = resolveGitBinary();

function runGit(gitArgs, capture = false) {
  return spawnSync(gitBin, gitArgs, {
    encoding: "utf8",
    stdio: capture ? ["ignore", "pipe", "pipe"] : "inherit",
  });
}

function gitOut(gitArgs) {
  const res = runGit(gitArgs, true);
  if (res.status !== 0) {
    throw new Error((res.stderr || "").trim() || `git ${gitArgs.join(" ")} failed`);
  }
  return (res.stdout || "").trim();
}

function readLines(output) {
  return output
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => s.replace(/^"+|"+$/g, ""))
    .map((s) => s.replaceAll("\\", "/"));
}

function fail(message) {
  console.error(`ERROR: ${message}`);
  process.exit(1);
}

function branchNameFor(key) {
  return prefix ? `${prefix}/${key}` : key;
}

function splitIntoBatches(files) {
  const sorted = [...files].sort();
  let batchCount = 1;
  if (sorted.length >= 8) batchCount = 3;
  else if (sorted.length >= 2) batchCount = 2;
  const batches = Array.from({ length: batchCount }, () => []);
  for (let i = 0; i < sorted.length; i++) {
    batches[i % batchCount].push(sorted[i]);
  }
  return batches.filter((b) => b.length);
}

const branchCommitMessages = {
  "refactor/shared-dto-sorting": [
    "clean up DTO structure and ordering",
    "align shared DTO exports and naming",
    "final pass on shared DTO consistency",
  ],
  "refactor/shared-types-and-exports": [
    "extract shared types into clearer modules",
    "standardize shared constants and exports",
    "tighten shared utility typing",
  ],
  "refactor/server-model-types-extraction": [
    "split model type declarations from implementations",
    "align mapper typing with model changes",
    "remove remaining model typing duplication",
  ],
  "feat/server-validation": [
    "improve request payload validation flow",
    "tighten validation and sanitizer typing",
    "final validation edge-case cleanup",
  ],
  "feat/server-auth": [
    "refine auth middleware and token flow",
    "align auth service/controller contracts",
    "clean up auth route typing",
  ],
  "bugfix/server-errors-and-logging": [
    "fix error propagation through middleware",
    "improve request logging and tracing context",
    "polish logger/error utility behavior",
  ],
  "refactor/server-data-layer": [
    "refactor repository base behaviors",
    "align data repositories with current models",
    "clean up data access typing and structure",
  ],
  "feat/server-routes-and-services": [
    "update route handlers and controller wiring",
    "align service contracts with route changes",
    "final service/controller cleanup pass",
  ],
  "chore/server-bootstrap-and-utils": [
    "refresh server bootstrap and config wiring",
    "clean up server utility modules",
    "sync server package and tsconfig changes",
  ],
  "feat/frontend-auth": [
    "refine frontend auth provider flow",
    "update login/reset/forgot experiences",
    "final auth route and hook cleanup",
  ],
  "feat/frontend-validation-and-forms": [
    "improve shared form controls behavior",
    "align form field typing and interfaces",
    "final frontend form validation cleanup",
  ],
  "feat/frontend-patients-flow": [
    "update patients table and details flow",
    "refine save/release patient interactions",
    "final patients API and UI alignment",
  ],
  "feat/frontend-system-management": [
    "update system management screens and forms",
    "align system-management hooks and APIs",
    "final system management UI cleanup",
  ],
  "refactor/frontend-api-router-and-types": [
    "refactor frontend API client boundaries",
    "align route and config typing",
    "clean up shared frontend type modules",
  ],
  "refactor/frontend-ui-and-utils": [
    "refactor reusable UI components",
    "improve utility components and helpers",
    "final UI utility consistency pass",
  ],
  "chore/frontend-core-and-assets": [
    "sync frontend app shell and entry points",
    "refresh static assets and public files",
    "final frontend core cleanup",
  ],
  "chore/workspace-tooling-and-lockfiles": [
    "update workspace package metadata",
    "sync lockfiles and tooling configs",
    "final tooling consistency pass",
  ],
  "chore/seed-and-migrations": [
    "update seed conversion script",
    "refresh migration and seed docs",
    "final seed asset cleanup",
  ],
  "chore/repo-scripts": [
    "add explicit stacked commit workflow script",
    "adjust repository helper scripts",
    "final scripts cleanup pass",
  ],
};

const allManifestFiles = groups.flatMap((g) => g.files || []);
const uniqueManifestFiles = new Set(allManifestFiles);
if (uniqueManifestFiles.size !== allManifestFiles.length) {
  fail("Manifest contains duplicate file paths across groups.");
}

if (!gitBin) {
  fail(
    'git is not available. Install Git for Windows or run with --git="C:\\\\Program Files\\\\Git\\\\cmd\\\\git.exe".'
  );
}

const gitVersion = runGit(["--version"], true);
if (gitVersion.status !== 0) {
  fail(`Unable to execute git at: ${gitBin}`);
}

const baseBranch = gitOut(["branch", "--show-current"]);
if (!baseBranch) fail("Could not detect current branch.");
if (["main", "master", "dev"].includes(baseBranch)) {
  fail("Do not run this script from main/master/dev. Checkout a working branch first.");
}

const staged = gitOut(["diff", "--cached", "--name-only"]);
if (staged) fail("You have staged changes. Please unstage/commit/stash first.");

const changedTrackedUnstaged = readLines(gitOut(["diff", "--name-only"]));
const changedTrackedStaged = readLines(gitOut(["diff", "--name-only", "--cached"]));
const changedUntracked = readLines(gitOut(["ls-files", "--others", "--exclude-standard"]));
const changedNow = Array.from(
  new Set([...changedTrackedUnstaged, ...changedTrackedStaged, ...changedUntracked])
);
const changedSet = new Set(changedNow);

const missingFromGroups = changedNow.filter((f) => !uniqueManifestFiles.has(f));
if (missingFromGroups.length) {
  console.error("Missing paths:");
  for (const f of missingFromGroups) console.error(`- ${f}`);
  fail(
    `Current changed files include ${missingFromGroups.length} path(s) not in grouped lists. Update this script first.`
  );
}

if (planOnly) {
  console.log(`Base branch: ${baseBranch}`);
  console.log(`Prefix: ${prefix}`);
  console.log(`Grouped changed files: ${uniqueManifestFiles.size}`);
  for (const group of groups) {
    const branch = branchNameFor(group.key);
    const plannedFiles = group.files.filter((f) => changedSet.has(f));
    const plannedBatches = splitIntoBatches(plannedFiles);
    console.log(`\n${branch} (${plannedFiles.length} files, ${plannedBatches.length} commits)`);
    for (const f of group.files) console.log(`- ${f}`);
  }
  process.exit(0);
}

let prev = baseBranch;
for (const group of groups) {
  const branch = branchNameFor(group.key);

  const exists = runGit(["show-ref", "--verify", "--quiet", `refs/heads/${branch}`]);
  if (exists.status === 0) fail(`Branch already exists: ${branch}`);

  console.log(`\nCreating ${branch} from ${prev}`);
  if (runGit(["checkout", "-b", branch, prev]).status !== 0) {
    fail(`Failed to create branch: ${branch}`);
  }

  const filesToCommit = group.files.filter((f) => changedSet.has(f));
  const batches = splitIntoBatches(filesToCommit);
  const messages = branchCommitMessages[group.key] || [
    `start ${group.key} changes`,
    `continue ${group.key} updates`,
    `finish ${group.key} cleanup`,
  ];
  let commitsOnBranch = 0;

  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i];
    if (!batch.length) continue;
    if (runGit(["add", "-A", "--", ...batch]).status !== 0) {
      fail(`Failed to stage commit batch ${i + 1} for ${branch}`);
    }
    const hasDiff = runGit(["diff", "--cached", "--quiet"]).status === 1;
    if (!hasDiff) continue;
    const msg = messages[i] || `update ${group.key} part ${i + 1}`;
    if (runGit(["commit", "-m", msg]).status !== 0) {
      fail(`Commit failed on ${branch}, batch ${i + 1}`);
    }
    commitsOnBranch += 1;
  }

  if (commitsOnBranch === 0) {
    console.log("No matching changes for this branch; created branch without commit.");
  } else {
    console.log(`Committed ${filesToCommit.length} files in ${commitsOnBranch} commit(s).`);
  }

  prev = branch;
}

console.log("\nDone.");
console.log(`Final branch: ${prev}`);
