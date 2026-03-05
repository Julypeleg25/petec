
export const AppRoutes = {
    Login: "/login",
    ForgotPassword: "/forgot-password",
    ResetPassword: {
        path: "/reset-password/:token",
        build: (token: string) => `/reset-password/${token}`,
    },

    Patients: {
        List: "/patients/patientsList",
        Details: {
            path: "/patients/patientCase/:masterId/:caseId",
            build: (masterId: string, caseId: string) => `/patients/patientCase/${masterId}/${caseId}`,
        },
        Archive: "/patients/archive",
        NewPatient: "/patients/newPatient",
        DailyPlan: "/patients/dailyPlan",
    },

    SystemManagement: {
        History: "/systemManagement/history",
        SystemTypes: "/systemManagement/systemTypes",
        Users: "/systemManagement/users",
    }
} as const;
