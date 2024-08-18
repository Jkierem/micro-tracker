import { Option } from "effect";
import { useCallback, useState } from "react";

export const useOptional = <T>(init?: T): [Option.Option<T>, (data?: T) => void] => {
    const [current, setCurrent] = useState<Option.Option<T>>(Option.fromNullable(init));

    const wrapper = useCallback(
        (data?: T) => setCurrent(Option.fromNullable(data)), 
        [setCurrent]
    );

    return [current, wrapper];
}