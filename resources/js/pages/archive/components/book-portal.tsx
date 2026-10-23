import {
    createContext,
    useCallback,
    useContext,
    useMemo,
    useRef,
    useState,
    type ReactNode,
} from 'react';

type BookPortalValue = {
    host: HTMLElement | null;
    setHost: (element: HTMLElement | null) => void;
    registerSlot: (id: string, element: HTMLElement | null) => void;
    getSlot: (id: string) => HTMLElement | null;
};

const BookPortalContext = createContext<BookPortalValue | null>(null);

export function BookPortalProvider({ children }: { children: ReactNode }) {
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

    const value = useMemo<BookPortalValue>(
        () => ({
            host,
            setHost,
            registerSlot,
            getSlot,
        }),
        [host, setHost, registerSlot, getSlot],
    );

    return (
        <BookPortalContext.Provider value={value}>
            {children}
        </BookPortalContext.Provider>
    );
}

export function useBookPortal(): BookPortalValue | null {
    return useContext(BookPortalContext);
}
