import {
    useEffect,
    useCallback,
    useRef,
    useState,
    type ComponentProps,
    type ReactNode,
} from 'react';
import { useClientComponent } from '@/hooks/use-client-component';
import FilingCabinet from './filing-cabinet';
import { scheduleCabinetStartup } from './cabinet-startup';
import { cabinetViewCache } from './cabinet-view-cache';
import type { CabinetView } from './cabinet-view-switch';
import type {
    CabinetFilingItem,
    FilingItemCover,
    FilingItemOrigin,
} from '@/types/filing';

export type ArchiveCabinetProps = Omit<
    ComponentProps<typeof FilingCabinet>,
    'onOpenItem'
> & {
    onOpenItem: (
        item: CabinetFilingItem,
        cover: FilingItemCover,
        drawerLabel: string,
        origin: FilingItemOrigin | null,
    ) => void;
};

function loadProceduralCabinet() {
    return import('./procedural-filing-cabinet');
}

function ModelCabinet({
    fallback,
    ...props
}: ArchiveCabinetProps & { fallback: ReactNode }) {
    const [Model, error] = useClientComponent(loadProceduralCabinet);
    const host = useRef<HTMLDivElement>(null);
    const [visible, setVisible] = useState(false);
    const [nearby, setNearby] = useState(false);
    const [retained, setRetained] = useState(false);
    const [started, setStarted] = useState(false);
    const startedRef = useRef(false);
    const cacheEntry = useRef<ReturnType<
        typeof cabinetViewCache.register
    > | null>(null);
    const startupReady = useRef<(() => void) | null>(null);
    const onReady = useCallback(() => startupReady.current?.(), []);
    useEffect(() => {
        const entry = cabinetViewCache.register(setRetained);
        cacheEntry.current = entry;
        return () => {
            cacheEntry.current = null;
            entry.release();
        };
    }, []);
    useEffect(
        () => cacheEntry.current?.update(visible, nearby),
        [visible, nearby],
    );
    useEffect(() => {
        if (!host.current) return;
        const observer = new IntersectionObserver(([entry]) =>
            setVisible(entry.isIntersecting),
        );
        const preloadObserver = new IntersectionObserver(
            ([entry]) => setNearby(entry.isIntersecting),
            { rootMargin: '400px 0px' },
        );
        observer.observe(host.current);
        preloadObserver.observe(host.current);
        return () => {
            observer.disconnect();
            preloadObserver.disconnect();
        };
    }, [Model]);
    useEffect(() => {
        if (!retained) {
            startedRef.current = false;
            setStarted(false);
            return;
        }
        if (
            !Model ||
            props.zoomed ||
            startedRef.current ||
            (!nearby && !visible)
        )
            return;
        let timeout: number | undefined;
        const cancel = scheduleCabinetStartup(
            (ready) => {
                startupReady.current = () => {
                    window.clearTimeout(timeout);
                    startupReady.current = null;
                    ready();
                };
                // A failed WebGL context must not hold up the other cabinets.
                timeout = window.setTimeout(onReady, 2000);
                startedRef.current = true;
                setStarted(true);
            },
            visible ? 1 : 0,
        );
        return () => {
            window.clearTimeout(timeout);
            startupReady.current = null;
            cancel();
        };
    }, [retained, visible, nearby, props.zoomed, onReady, Model]);
    if (error || !Model) return fallback;
    return (
        <div ref={host} className="w-full max-w-[22rem] min-w-0">
            <Model
                {...props}
                active={started && visible}
                resident={started}
                onReady={onReady}
                fallback={fallback}
            />
        </div>
    );
}

export default function ArchiveCabinet({
    view,
    ...props
}: ArchiveCabinetProps & { view: CabinetView }) {
    const current = <FilingCabinet {...props} />;
    return view === 'current' ? (
        current
    ) : (
        <ModelCabinet {...props} fallback={current} />
    );
}
