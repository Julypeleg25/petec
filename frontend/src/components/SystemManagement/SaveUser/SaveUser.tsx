import type { UserRowDTO } from "@petec/shared";
import { CreateUserForm } from "./components/CreateUserForm";
import { EditUserForm } from "./components/EditUserForm";

interface SaveUserProps {
  user?: UserRowDTO;
  onClose: () => void;
}

export default function SaveUser({ user, onClose }: SaveUserProps) {
  if (user) {
    return <EditUserForm user={user} onClose={onClose} />;
  }

  return <CreateUserForm onClose={onClose} />;
}
