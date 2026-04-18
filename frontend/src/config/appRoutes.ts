export const AppRoutes = {
    Root: "/",
    Login: "/login",
    Unauthorized: "/unauthorized",
    CatchAll: "*",
    ForgotPassword: "/forgot-password",
    ResetPassword: {
        path: "/reset-password/:token",
        build: (token: string) => `/reset-password/${token}`,
    },

    Patients: {
        List: "/patients/patientsList",
        Details: {
            path: "/patients/patientCase/:masterCaseId/:caseId",
            build: (masterCaseId: string, caseId: string) =>
                `/patients/patientCase/${masterCaseId}/${caseId}`,
        },
        Archive: "/patients/archive",
        NewPatient: "/patients/newPatient",
        DailyPlan: "/patients/dailyPlan",
        Calendar: "/patients/calendar",
    },

    SystemManagement: {
        History: "/systemManagement/history",
        SystemTypes: "/systemManagement/systemTypes",
        Users: "/systemManagement/users",
    }
} as const;
