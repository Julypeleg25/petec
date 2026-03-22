"use strict";

const BASE_BRANCH = "main";

const PLAN = [
  {
    branch: "stack/workspace-and-shared-foundation",
    commits: [
      {
        message: "chore(scripts): add stacked branch plan helpers",
        items: [
          "new file: scripts/apply-stacked-branch-plan.cjs",
          "new file: scripts/print-stacked-branch-plan.cjs",
          "new file: scripts/stacked-branch-plan.data.cjs",
        ],
      },
      {
        message: "chore(workspace): align repo ignore rules and workspace manifests",
        items: [
          "modified: .gitignore",
          "modified: package.json",
          "modified: package-lock.json",
        ],
      },
      {
        message: "chore(shared): clean shared build config and browser-safe error handling",
        items: [
          "modified: packages/shared/package.json",
          "modified: packages/shared/src/errors/app-error.ts",
          "new file: packages/shared/tsconfig.build.json",
          "modified: packages/shared/tsconfig.json",
          "modified: packages/shared/tsup.config.ts",
        ],
      },
    ],
  },
  {
    branch: "stack/backend-config-and-serialization",
    commits: [
      {
        message: "refactor(backend): align backend package and config for shared integration",
        items: [
          "modified: backend/package.json",
          "modified: backend/src/config/config.json",
          "modified: backend/src/config/config.ts",
          "modified: backend/tsconfig.json",
        ],
      },
      {
        message: "fix(backend): normalize shared id serialization in backend mappers",
        items: [
          "modified: backend/src/mappers/medicine/medicine.mappers.ts",
          "modified: backend/src/mappers/patient/patient.response.mappers.ts",
          "modified: backend/src/mappers/table/table.mappers.ts",
          "modified: backend/src/mappers/user/user.mappers.utils.ts",
        ],
      },
    ],
  },
  {
    branch: "stack/frontend-vite-migration",
    commits: [
      {
        message: "build(frontend): migrate frontend app shell from cra to vite",
        items: [
          "modified: frontend/.env.example",
          "modified: frontend/.gitignore",
          "modified: frontend/README.md",
          "renamed: frontend/public/index.html -> frontend/index.html",
          "modified: frontend/package.json",
          "deleted: frontend/src/config/config.json",
          "renamed: frontend/src/index.tsx -> frontend/src/main.tsx",
          "new file: frontend/src/vite-env.d.ts",
          "modified: frontend/tsconfig.json",
          "new file: frontend/tsconfig.node.json",
          "new file: frontend/vercel.json",
          "new file: frontend/vite.config.ts",
        ],
      },
      {
        message: "refactor(frontend): align env, api client, and system hooks after vite migration",
        items: [
          "modified: frontend/src/components/ErrorBoundary/ErrorBoundary.tsx",
          "modified: frontend/src/components/SystemManagement/SystemTypesTab/SystemTypesTab.constants.ts",
          "modified: frontend/src/config/config.ts",
          "modified: frontend/src/features/system-management/hooks/useSystemTypes.tsx",
          "modified: frontend/src/lib/apiClient.ts",
          "modified: frontend/src/utils/TableGenerator/TableGenerator.types.ts",
        ],
      },
    ],
  },
  {
    branch: "stack/patient-documents-and-save-flow",
    commits: [
      {
        message: "feat(patient-documents): restore explicit document upload flow and save-form wiring",
        items: [
          "modified: backend/src/services/patient/patientService.ts",
          "modified: frontend/src/components/PatientDocuments/PatientDocuments.css",
          "modified: frontend/src/components/PatientDocuments/PatientDocuments.tsx",
          "modified: frontend/src/components/PatientDocuments/PatientDocuments.utils.ts",
          "modified: frontend/src/components/Patients/SavePatient/SavePatient.tsx",
          "modified: frontend/src/components/Patients/SavePatient/hooks/useSavePatient.tsx",
          "modified: frontend/src/components/Patients/SavePatient/sections/SavePatientPatientInfo.section.tsx",
          "modified: frontend/src/utils/FormUploadImage/FormUploadImage.tsx",
          "modified: frontend/src/utils/FormUploadImage/FormUploadImage.types.ts",
        ],
      },
    ],
  },
];

module.exports = {
  BASE_BRANCH,
  PLAN,
};
