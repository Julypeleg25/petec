import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { usersApi } from "../users.api";
import { userKeys } from "./userKeys";
import type { RegisterDTO, UpdateUserDTO } from "@petec/shared";

export const useUserApi = () => {
    const qc = useQueryClient();

    const usersQuery = useQuery({
        queryKey: userKeys.list(),
        queryFn: usersApi.getUsers,
    });

    const rolesQuery = useQuery({
        queryKey: userKeys.roles(),
        queryFn: usersApi.getRoles,
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
        mutationFn: ({ id, dto }: { id: string; dto: UpdateUserDTO }) =>
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
        rolesQuery,
        doctorsQuery,
        nursesQuery,
        createUser: createUserMutation,
        updateUser: updateUserMutation,
        deleteUser: deleteUserMutation,
    };
};
