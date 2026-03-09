import { useEffect } from "react";
import type { SelectOptionObj } from "../../../../utils/FormSelect/FormSelect.types";

export const useMappedSelectOptions = <T,>(
    data: ReadonlyArray<T> | undefined,
    mapper: (items: ReadonlyArray<T>) => SelectOptionObj[],
    setter: React.Dispatch<React.SetStateAction<SelectOptionObj[]>>,
): void => {
    useEffect(() => {
        if (!data) {
            return;
        }
        setter(mapper(data));
    }, [data, mapper, setter]);
};
