import { Canvas, useFrame, useThree } from '@react-three/fiber';
import {
    useEffect,
    useLayoutEffect,
    useMemo,
    useRef,
    useState,
    type CSSProperties,
} from 'react';
import { createPortal } from 'react-dom';
import {
    Box3,
    BoxGeometry,
    MeshBasicMaterial,
    NoBlending,
    PerspectiveCamera,
    Scene,
    VSMShadowMap,
} from 'three';
import {
    CSS3DObject,
    CSS3DRenderer,
} from 'three/addons/renderers/CSS3DRenderer.js';
import ClosedBookMesh from '../books/closed-book-mesh';
import LeverArchDrawerContents from '../folders/lever-arch-drawer-contents';
import ClosedFolderMesh, {
    FOLDER_COVER_WIDTH,
} from '../folders/closed-folder-mesh';
import { filingCover } from '@/lib/filing-appearance';
import type {
    CabinetDrawer,
    CabinetFilingItem,
    FilingCabinet,
} from '@/types/filing';
import {
    cabinetDrawerInterior,
    createProceduralDrawer,
    disposeProceduralCabinet,
} from './procedural-cabinet-model';
import {
    DrawerLabels,
    StudioEnvironment,
    useCachedModelShadows,
} from './procedural-cabinet-preview';
import { batchProceduralCabinet } from './procedural-cabinet-rendering';
import {
    DRAWER_CSS_SCALE,
    createDrawerFolderMask,
    fitProceduralDrawerCamera,
    proceduralDrawerSlots,
    type DrawerItemSlot,
} from './procedural-drawer-layout';

type DrawerOverlay = {
    scene: Scene;
    renderer: CSS3DRenderer | null;
    invalidate: () => void;
};

function DrawerContents({
    slots,
    overlay,
    hoveredId,
    openedItemId,
    lift,
    onHover,
    onOpenItem,
}: {
    slots: DrawerItemSlot[];
    overlay: DrawerOverlay;
    hoveredId: string | null;
    openedItemId: string | null;
    lift: number;
    onHover: (id: string | null) => void;
    onOpenItem: (item: CabinetFilingItem) => void;
}) {
    'use no memo';
    const container = useRef<HTMLDivElement>(null);
    const objects = useMemo(
        () =>
            slots
                .filter((slot) => slot.item.kind !== 'lever_arch')
                .map((slot) => {
                    const element = document.createElement('div');
                    element.style.width = `${slot.width * DRAWER_CSS_SCALE}px`;
                    element.style.height = `${slot.height * DRAWER_CSS_SCALE}px`;
                    element.style.transformStyle = 'preserve-3d';
                    const object = new CSS3DObject(element);
                    object.scale.setScalar(1 / DRAWER_CSS_SCALE);
                    object.rotation.x = slot.rotationX;
                    return { slot, object };
                }),
        [slots],
    );

    useLayoutEffect(() => {
        const renderer = new CSS3DRenderer();
        renderer.domElement.style.pointerEvents = 'none';
        container.current?.appendChild(renderer.domElement);
        overlay.renderer = renderer;
        overlay.invalidate();
        return () => {
            overlay.renderer = null;
            renderer.domElement.remove();
        };
    }, [overlay]);
    useLayoutEffect(() => {
        objects.forEach(({ object }) => overlay.scene.add(object));
        overlay.invalidate();
        return () =>
            objects.forEach(({ object }) => overlay.scene.remove(object));
    }, [objects, overlay]);
    useLayoutEffect(() => {
        objects.forEach(({ slot, object }) => {
            object.position.set(
                slot.x,
                slot.y + (hoveredId === slot.item.id ? lift : 0),
                slot.frontZ,
            );
        });
        overlay.invalidate();
    }, [objects, overlay, hoveredId, openedItemId, lift]);

    return (
        <div
            ref={container}
            className="pointer-events-none absolute inset-0"
            aria-label="Drawer contents"
        >
            {objects.map(({ slot, object }) =>
                createPortal(
                    <button
                        type="button"
                        data-procedural-filing-item={slot.item.id}
                        aria-label={`Open ${slot.item.label}, ${slot.item.documentCount} documents`}
                        aria-hidden={openedItemId === slot.item.id || undefined}
                        tabIndex={openedItemId === slot.item.id ? -1 : 0}
                        className="relative block h-full w-full cursor-pointer border-0 bg-transparent p-0 text-left outline-none focus-visible:ring-4 focus-visible:ring-blue-500"
                        style={
                            {
                                transformStyle: 'preserve-3d',
                                '--cover-scale': Math.min(
                                    (slot.height * DRAWER_CSS_SCALE) / 440,
                                    (slot.depth * DRAWER_CSS_SCALE) / 595,
                                ),
                            } as CSSProperties
                        }
                        onFocus={() => onHover(slot.item.id)}
                        onBlur={() => onHover(null)}
                        onClick={() => onOpenItem(slot.item)}
                    >
                        <div
                            className="absolute inset-0"
                            style={{
                                transformStyle: 'preserve-3d',
                                visibility:
                                    openedItemId === slot.item.id
                                        ? 'hidden'
                                        : undefined,
                            }}
                        >
                            {slot.item.kind === 'folder' ? (
                                <ClosedFolderMesh
                                    detail="closed"
                                    label={slot.item.label}
                                    coverTitle={slot.item.coverTitle}
                                    coverScale={
                                        (slot.width * DRAWER_CSS_SCALE) /
                                        FOLDER_COVER_WIDTH
                                    }
                                    depth={slot.depth * DRAWER_CSS_SCALE}
                                    showLabel
                                />
                            ) : (
                                <ClosedBookMesh
                                    depth={slot.depth * DRAWER_CSS_SCALE}
                                    label={slot.item.label}
                                    coverTitle={slot.item.coverTitle}
                                    cover={filingCover(slot.item.kind)}
                                    documentCount={slot.item.documentCount}
                                    showTitle
                                    showCover
                                />
                            )}
                        </div>
                    </button>,
                    object.element,
                    slot.item.id,
                ),
            )}
        </div>
    );
}

function DrawerScene({
    cabinet,
    drawer,
    slots,
    overlay,
    hoveredId,
    openedItemId,
    lift,
    onHover,
    onOpenItem,
    onReady,
}: {
    cabinet: FilingCabinet;
    drawer: CabinetDrawer;
    slots: DrawerItemSlot[];
    overlay: DrawerOverlay;
    hoveredId: string | null;
    openedItemId: string | null;
    lift: number;
    onHover: (id: string | null) => void;
    onOpenItem: (item: CabinetFilingItem) => void;
    onReady?: () => void;
}) {
    const { camera, size, invalidate, gl } = useThree();
    const model = useMemo(
        () =>
            batchProceduralCabinet(
                createProceduralDrawer(
                    cabinet.drawers,
                    drawer.id,
                    cabinet.color,
                ),
            ),
        [cabinet.drawers, drawer.id, cabinet.color],
    );
    useCachedModelShadows(model);
    const masks = useMemo(
        () =>
            slots
                .filter((slot) => slot.item.kind !== 'lever_arch')
                .map((slot) => ({
                    slot,
                    geometry:
                        slot.item.kind === 'folder'
                            ? createDrawerFolderMask(
                                  slot.width,
                                  slot.height,
                                  slot.depth,
                              )
                            : new BoxGeometry(
                                  slot.width,
                                  slot.height,
                                  slot.depth,
                              ).translate(0, 0, -slot.depth / 2),
                })),
        [slots],
    );
    const maskMaterial = useMemo(
        () =>
            new MeshBasicMaterial({
                color: 'black',
                transparent: true,
                opacity: 0,
                blending: NoBlending,
                depthWrite: true,
            }),
        [],
    );
    useEffect(
        () => () => masks.forEach(({ geometry }) => geometry.dispose()),
        [masks],
    );
    useEffect(() => () => maskMaterial.dispose(), [maskMaterial]);
    useEffect(() => () => disposeProceduralCabinet(model), [model]);
    useEffect(() => {
        overlay.invalidate = invalidate;
        invalidate();
        return () => {
            overlay.invalidate = () => undefined;
        };
    }, [overlay, invalidate]);
    useEffect(() => {
        if (!(camera instanceof PerspectiveCamera)) return;
        const bounds = new Box3().setFromObject(model.drawers.get(drawer.id)!);
        fitProceduralDrawerCamera(camera, bounds, size);
        invalidate();
    }, [camera, size.width, size.height, model, drawer.id, invalidate]);
    useEffect(() => {
        invalidate();
    }, [hoveredId, openedItemId, invalidate]);
    useEffect(
        () => () => {
            gl.domElement.style.cursor = '';
        },
        [gl],
    );
    useLayoutEffect(() => {
        overlay.renderer?.setSize(size.width, size.height);
        invalidate();
    }, [overlay, size.width, size.height, invalidate]);
    const ready = useRef(false);
    useFrame(() => {
        overlay.renderer?.render(overlay.scene, camera);
        if (!ready.current) {
            ready.current = true;
            onReady?.();
        }
    });

    return (
        <>
            <StudioEnvironment />
            <hemisphereLight args={['#f6f8fa', '#747a7e', 0.7]} />
            <directionalLight
                position={[-3, 8, 6]}
                intensity={2.4}
                castShadow
                shadow-mapSize={[1024, 1024]}
                shadow-camera-left={-3}
                shadow-camera-right={3}
                shadow-camera-top={4}
                shadow-camera-bottom={-4}
                shadow-normalBias={0.01}
                shadow-bias={-0.0001}
                shadow-radius={3}
            />
            <directionalLight
                position={[4, 4, -3]}
                intensity={0.8}
                color="#e3eaf0"
            />
            <primitive
                object={model.root}
                dispose={null}
                onClick={(event: { stopPropagation: () => void }) =>
                    event.stopPropagation()
                }
            />
            <DrawerLabels model={model} drawers={cabinet.drawers} />
            {slots[0]?.item.kind === 'lever_arch' && (
                <LeverArchDrawerContents
                    {...{
                        slots,
                        hoveredId,
                        openedItemId,
                        lift,
                        onHover,
                        onOpenItem,
                    }}
                />
            )}
            {masks
                .filter(({ slot }) => slot.item.id !== openedItemId)
                .map(({ slot, geometry }) => {
                    return (
                        <mesh
                            key={slot.item.id}
                            geometry={geometry}
                            material={maskMaterial}
                            dispose={null}
                            rotation={[slot.rotationX, 0, 0]}
                            position={[
                                slot.x,
                                slot.y +
                                    (hoveredId === slot.item.id ? lift : 0),
                                slot.frontZ,
                            ]}
                            onClick={(event) => {
                                event.stopPropagation();
                                onOpenItem(slot.item);
                            }}
                            onPointerOver={(event) => {
                                event.stopPropagation();
                                gl.domElement.style.cursor = 'pointer';
                                onHover(slot.item.id);
                            }}
                            onPointerOut={() => {
                                gl.domElement.style.cursor = '';
                                onHover(null);
                            }}
                        />
                    );
                })}
        </>
    );
}

export default function ProceduralDrawerView({
    active = true,
    cabinet,
    drawer,
    openedItemId = null,
    reduceMotion,
    onOpenItem,
    onDismiss,
    onReady,
}: {
    active?: boolean;
    cabinet: FilingCabinet;
    drawer: CabinetDrawer;
    openedItemId?: string | null;
    reduceMotion: boolean;
    onOpenItem: (item: CabinetFilingItem) => void;
    onDismiss: () => void;
    onReady?: () => void;
}) {
    const [hoveredId, setHoveredId] = useState<string | null>(null);
    const [overlay] = useState<DrawerOverlay>(() => ({
        scene: new Scene(),
        renderer: null,
        invalidate: () => undefined,
    }));
    useEffect(() => {
        if (active) overlay.invalidate();
        else setHoveredId(null);
    }, [active, overlay]);
    const slots = useMemo(
        () =>
            proceduralDrawerSlots(
                cabinetDrawerInterior(cabinet.drawers.length),
                drawer.books,
            ),
        [cabinet.drawers.length, drawer.books],
    );
    const lift = reduceMotion ? 0 : 0.06;
    const hoveredItem = drawer.books.find((item) => item.id === hoveredId);
    const shared = {
        slots,
        overlay,
        hoveredId,
        openedItemId,
        lift,
        onHover: setHoveredId,
        onOpenItem,
    };
    return (
        <div
            className="relative isolate h-full min-h-72 w-full overflow-hidden"
            data-procedural-drawer-view={active ? drawer.id : undefined}
            data-procedural-drawer-cache={drawer.id}
        >
            <DrawerContents {...shared} />
            {slots[0]?.item.kind === 'lever_arch' && (
                <div
                    className="sr-only"
                    aria-label="Lever arch files in drawer"
                >
                    {slots.map(({ item }) => (
                        <button
                            type="button"
                            key={item.id}
                            data-procedural-filing-item={item.id}
                            disabled={item.id === openedItemId}
                            onFocus={() => setHoveredId(item.id)}
                            onBlur={() => setHoveredId(null)}
                            onClick={() => onOpenItem(item)}
                        >
                            Open {item.label}, {item.documentCount} documents
                        </button>
                    ))}
                </div>
            )}
            <Canvas
                className="relative z-10"
                shadows={{ type: VSMShadowMap }}
                frameloop={active ? 'demand' : 'never'}
                dpr={[1, 2]}
                resize={{ offsetSize: true }}
                onPointerMissed={(event) => {
                    if (active && !openedItemId && event.button === 0)
                        onDismiss();
                }}
                camera={{
                    position: [0, 3, 4],
                    fov: 50,
                    near: 0.1,
                    far: 50,
                }}
                gl={{
                    antialias: true,
                    alpha: true,
                    powerPreference: 'low-power',
                }}
                aria-hidden="true"
            >
                <DrawerScene
                    {...shared}
                    cabinet={cabinet}
                    drawer={drawer}
                    onReady={onReady}
                />
            </Canvas>
            {(hoveredItem || drawer.books.length === 0) && (
                <p
                    role="status"
                    className="pointer-events-none absolute inset-x-4 bottom-4 z-20 text-center text-sm text-slate-200"
                >
                    {hoveredItem
                        ? `${hoveredItem.label} · ${hoveredItem.documentCount} ${hoveredItem.documentCount === 1 ? 'document' : 'documents'}`
                        : 'This drawer is empty.'}
                </p>
            )}
        </div>
    );
}
