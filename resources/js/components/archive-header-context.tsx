import { createContext, useContext, useState } from 'react';
import type { Dispatch, ReactNode, SetStateAction } from 'react';

export type ArchiveHeaderItem = {
    title: string;
    onSelect?: () => void;
};

const TrailContext = createContext<ArchiveHeaderItem[]>([]);
const SetTrailContext = createContext<Dispatch<
    SetStateAction<ArchiveHeaderItem[]>
> | null>(null);

export function ArchiveHeaderProvider({ children }: { children: ReactNode }) {
    const [trail, setTrail] = useState<ArchiveHeaderItem[]>([]);

    return (
        <SetTrailContext value={setTrail}>
            <TrailContext value={trail}>{children}</TrailContext>
        </SetTrailContext>
    );
}

export function useArchiveHeaderTrail() {
    return useContext(TrailContext);
}

export function useSetArchiveHeaderTrail() {
    return useContext(SetTrailContext);
}
