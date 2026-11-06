import {
    createContext,
    useCallback,
    useContext,
    useMemo,
    useRef,
    useState,
    type ReactNode,
} from 'react';

type FilingItemPortalValue = {
    host: HTMLElement | null;
    setHost: (element: HTMLElement | null) => void;
    registerSlot: (id: string, element: HTMLElement | null) => void;
    getSlot: (id: string) => HTMLElement | null;
};

const FilingItemPortalContext = createContext<FilingItemPortalValue | null>(
    null,
);

export function FilingItemPortalProvider({
    children,
}: {
    children: ReactNode;
}) {
    const [host, setHostState] = useState<HTMLElement | null>(null);
    const slots = useRef(new Map<string, HTMLElement>());

    const setHost = useCallback((element: HTMLElement | null) => {
        setHostState(element);
    }, []);

    const registerSlot = useCallback(
        (id: string, element: HTMLElement | null) => {
            if (element) {
                slots.current.set(id, element);
                return;
            }

            slots.current.delete(id);
        },
        [],
    );

    const getSlot = useCallback((id: string) => {
        return slots.current.get(id) ?? null;
    }, []);

    const value = useMemo<FilingItemPortalValue>(
        () => ({
            host,
            setHost,
            registerSlot,
            getSlot,
        }),
        [host, setHost, registerSlot, getSlot],
    );

    return (
        <FilingItemPortalContext.Provider value={value}>
            {children}
        </FilingItemPortalContext.Provider>
    );
}

export function useFilingItemPortal(): FilingItemPortalValue | null {
    return useContext(FilingItemPortalContext);
}
