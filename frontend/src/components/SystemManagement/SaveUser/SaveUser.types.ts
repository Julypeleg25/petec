import { UserRowDTO } from "@petec/shared";

export interface SaveUserProps {
    user?: UserRowDTO;
    onClose: () => void;
}
