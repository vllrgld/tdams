import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { ZoomIn } from 'lucide-react';
import {
    useEffect,
    useRef,
    useState,
    type ComponentProps,
    type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { useClientComponent } from '@/hooks/use-client-component';
import { filingCover, filingName } from '@/lib/filing-appearance';
import type { ArchiveCabinetProps } from './archive-cabinet';
import ProceduralCabinetPreview, {
    ModelBoundary,
} from './procedural-cabinet-preview';
import type ProceduralDrawerView from './procedural-drawer-view';

function loadDrawerView() {
    return import('./procedural-drawer-view');
}

function DrawerView({
    zoomed,
    ...props
}: ComponentProps<typeof ProceduralDrawerView> & { zoomed: boolean }) {
    const [View, error] = useClientComponent(loadDrawerView);
    const [ready, setReady] = useState(false);
    if (error) throw new Error(error);
    return (
        <div className="relative h-full">
            {!ready && (
                <div
                    role="status"
                    className="absolute inset-0 flex items-center justify-center gap-2 text-sm text-slate-200"
                >
                    <Spinner /> Loading drawer…
                </div>
            )}
            {View && (
                <motion.div
                    className="h-full"
                    initial={
                        props.reduceMotion
                            ? false
                            : { opacity: 0, transform: 'scale(0.8)' }
                    }
                    animate={{
                        opacity: ready && zoomed ? 1 : 0,
                        transform:
                            props.reduceMotion || (ready && zoomed)
                                ? 'scale(1)'
                                : 'scale(0.8)',
                    }}
                    transition={
                        props.reduceMotion
                            ? { duration: 0 }
                            : {
                                  opacity: {
                                      duration: 0.45,
                                      ease: [0.22, 1, 0.36, 1],
                                  },
                                  transform: {
                                      type: 'spring',
                                      stiffness: 110,
                                      damping: 26,
                                  },
                              }
                    }
                >
                    <View {...props} onReady={() => setReady(true)} />
                </motion.div>
            )}
        </div>
    );
}

export default function ProceduralFilingCabinet({
    cabinet,
    openDrawerId,
    zoomed,
    onOpenDrawerChange,
    onZoomChange,
    openedItemId,
    onOpenItem,
    fallback,
    active,
    resident = active,
    onReady,
}: ArchiveCabinetProps & {
    fallback: ReactNode;
    active: boolean;
    resident?: boolean;
    onReady?: () => void;
}) {
    const reduceMotion = useReducedMotion() === true;
    const region = useRef<HTMLDivElement>(null);
    const selected = cabinet.drawers.find(
        (drawer) => drawer.id === openDrawerId,
    );
    const [cachedDrawerId, setCachedDrawerId] = useState<string | null>(null);
    const [drawerSuspended, setDrawerSuspended] = useState(true);
    useEffect(() => {
        setCachedDrawerId((cached) =>
            zoomed
                ? (selected?.id ?? null)
                : cached === selected?.id
                  ? cached
                  : null,
        );
    }, [zoomed, selected?.id]);
    useEffect(() => {
        if (!zoomed) return;
        const previous = document.activeElement;
        const timer = window.setTimeout(() => {
            const target =
                region.current?.querySelector<HTMLElement>('button') ??
                document.querySelector<HTMLElement>(
                    '[data-archive-drawer-controls] button',
                );
            target?.focus({ preventScroll: true });
        }, 0);
        return () => {
            window.clearTimeout(timer);
            if (previous instanceof HTMLElement && previous.isConnected)
                previous.focus({ preventScroll: true });
        };
    }, [zoomed]);

    return (
        <ModelBoundary fallback={fallback}>
            <div
                id={`cabinet-${cabinet.id}`}
                role="group"
                aria-label={cabinet.name}
                className="relative w-full min-w-0"
            >
                <ProceduralCabinetPreview
                    cabinet={cabinet}
                    openDrawerId={openDrawerId}
                    fallback={fallback}
                    compact
                    active={active && !zoomed}
                    resident={resident}
                    onOpenDrawerChange={onOpenDrawerChange}
                    onViewDrawer={() => onZoomChange(true)}
                    onReady={onReady}
                />
                {cabinet.location && cabinet.location !== cabinet.name && (
                    <p
                        className="mt-1 truncate text-center text-xs text-muted-foreground"
                        title={cabinet.location}
                    >
                        {cabinet.location}
                    </p>
                )}
                <div
                    className="mt-3 grid grid-cols-2 gap-2 px-3"
                    role="group"
                    aria-label={`Drawers in ${cabinet.name}`}
                >
                    {cabinet.drawers.map((drawer) => (
                        <Button
                            key={drawer.id}
                            type="button"
                            variant={
                                openDrawerId === drawer.id
                                    ? 'secondary'
                                    : 'outline'
                            }
                            size="sm"
                            aria-expanded={openDrawerId === drawer.id}
                            className="min-w-0 justify-between gap-2 rounded-lg"
                            onClick={() =>
                                onOpenDrawerChange(
                                    openDrawerId === drawer.id
                                        ? null
                                        : drawer.id,
                                )
                            }
                        >
                            <span className="truncate">{drawer.label}</span>
                            <span className="text-xs font-normal text-muted-foreground tabular-nums">
                                {drawer.books.length}
                            </span>
                        </Button>
                    ))}
                </div>
                {selected && (
                    <div className="mt-2 flex justify-center px-3">
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="max-w-full rounded-lg"
                            onClick={() => onZoomChange(true)}
                        >
                            <ZoomIn aria-hidden="true" />
                            <span className="truncate">
                                View inside {selected.label}
                            </span>
                        </Button>
                    </div>
                )}
                {typeof document !== 'undefined' &&
                    createPortal(
                        <AnimatePresence>
                            {selected &&
                                (zoomed || cachedDrawerId === selected.id) && (
                                    <motion.div
                                        key={selected.id}
                                        className="pointer-events-none fixed inset-0 z-50 flex flex-col items-center justify-center px-2 pt-20 pb-4 sm:px-6"
                                        inert={!zoomed}
                                        aria-hidden={!zoomed || undefined}
                                        style={{
                                            visibility:
                                                zoomed || !drawerSuspended
                                                    ? 'visible'
                                                    : 'hidden',
                                        }}
                                        initial={
                                            reduceMotion
                                                ? false
                                                : { opacity: 0 }
                                        }
                                        animate={{ opacity: zoomed ? 1 : 0 }}
                                        exit={{ opacity: 0 }}
                                        onAnimationComplete={() =>
                                            setDrawerSuspended(!zoomed)
                                        }
                                        transition={{
                                            duration: reduceMotion ? 0 : 0.45,
                                            ease: [0.22, 1, 0.36, 1],
                                        }}
                                    >
                                        <div
                                            ref={region}
                                            role="region"
                                            aria-label={`${cabinet.name}, ${selected.label}`}
                                            className="flex h-[min(80dvh,48rem)] w-full max-w-6xl flex-col"
                                        >
                                            <div className="shrink-0 px-4 pb-2 text-center text-white">
                                                <h2 className="text-lg font-semibold">
                                                    {selected.label}
                                                </h2>
                                                <p className="mt-1 text-sm text-slate-200">
                                                    {cabinet.name}
                                                    {' · '}
                                                    {selected.books.length}{' '}
                                                    {filingName(
                                                        selected.books[0]?.kind,
                                                        true,
                                                    )}
                                                </p>
                                            </div>
                                            <div className="pointer-events-auto min-h-0 flex-1">
                                                <DrawerView
                                                    zoomed={zoomed}
                                                    active={
                                                        zoomed ||
                                                        !drawerSuspended
                                                    }
                                                    cabinet={cabinet}
                                                    drawer={selected}
                                                    openedItemId={openedItemId}
                                                    reduceMotion={reduceMotion}
                                                    onDismiss={() => {
                                                        if (
                                                            zoomed &&
                                                            !openedItemId
                                                        )
                                                            onZoomChange(false);
                                                    }}
                                                    onOpenItem={(item) =>
                                                        onOpenItem(
                                                            item,
                                                            filingCover(
                                                                item.kind,
                                                            ),
                                                            selected.label,
                                                            null,
                                                        )
                                                    }
                                                />
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                        </AnimatePresence>,
                        document.body,
                    )}
            </div>
        </ModelBoundary>
    );
}
