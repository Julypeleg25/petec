import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { usersApi } from "../users.api";
import { userKeys } from "./users.keys";
import type { RegisterDTO, UpdateUserDTO } from "@petec/shared";

export type UpdateUserMutationInput = {
    id: string;
    dto: UpdateUserDTO;
};

export type UseUserApiOptions = {
    includeUsersQuery?: boolean;
};

const DEFAULT_USE_USER_API_OPTIONS: Required<UseUserApiOptions> = {
    includeUsersQuery: true,
};

export const useUserApi = (options: UseUserApiOptions = DEFAULT_USE_USER_API_OPTIONS) => {
    const {
        includeUsersQuery,
    } = { ...DEFAULT_USE_USER_API_OPTIONS, ...options };

    const qc = useQueryClient();

    const usersQuery = useQuery({
        queryKey: userKeys.list(),
        queryFn: usersApi.getUsers,
        enabled: includeUsersQuery,
    });

    const doctorsQuery = useQuery({
        queryKey: userKeys.doctors(),
        queryFn: usersApi.getDoctors,
    });

    const nursesQuery = useQuery({
        queryKey: userKeys.nurses(),
        queryFn: usersApi.getNurses,
    });

    const createUserMutation = useMutation({
        mutationFn: (dto: RegisterDTO) => usersApi.createUser(dto),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: userKeys.all });
            toast.success("המשתמש נוסף בהצלחה");
        },
    });

    const updateUserMutation = useMutation({
        mutationFn: ({ id, dto }: UpdateUserMutationInput) =>
            usersApi.updateUser(id, dto),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: userKeys.all });
            toast.success("המשתמש עודכן בהצלחה");
        },
    });

    const deleteUserMutation = useMutation({
        mutationFn: (id: string) => usersApi.deleteUser(id),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: userKeys.all });
            toast.success("המשתמש נמחק");
        },
    });

    return {
        usersQuery,
        doctorsQuery,
        nursesQuery,
        createUser: createUserMutation,
        updateUser: updateUserMutation,
        deleteUser: deleteUserMutation,
    };
};
