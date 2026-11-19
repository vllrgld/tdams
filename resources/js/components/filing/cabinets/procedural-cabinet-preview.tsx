import {
    Canvas,
    useFrame,
    useThree,
    type ThreeEvent,
} from '@react-three/fiber';
import { ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react';
import { useReducedMotion } from 'motion/react';
import {
    Component,
    useCallback,
    useEffect,
    useLayoutEffect,
    useMemo,
    useRef,
    useState,
    type ReactNode,
    type RefObject,
} from 'react';
import {
    Box3,
    CanvasTexture,
    DataTexture,
    MathUtils,
    PerspectiveCamera,
    PMREMGenerator,
    SRGBColorSpace,
    RGBAFormat,
    PCFShadowMap,
    type Group,
    type Mesh,
    type Object3D,
} from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { Button } from '@/components/ui/button';
import type { CabinetColor } from '@/lib/cabinet-colors';
import {
    CABINET_DRAWER_TRAVEL,
    CABINET_WIDTH,
    CABINET_DEPTH,
    cabinetDrawerEase,
    cabinetDrawerInterior,
    moveCabinetDrawer,
    setProceduralCabinetColor,
    type CabinetModelDrawer,
    type ProceduralCabinetModel,
} from './procedural-cabinet-model';
import {
    cabinetRotationTarget,
    fitProceduralCabinetBounds,
    fitProceduralCabinetCamera,
} from './procedural-cabinet-layout';
import {
    acquireProceduralCabinet,
    releaseProceduralCabinet,
} from './procedural-cabinet-rendering';

export function useCachedModelShadows(model: ProceduralCabinetModel) {
    const shadowMap = useThree((state) => state.gl.shadowMap);
    const invalidate = useThree((state) => state.invalidate);
    useEffect(() => {
        const previous = shadowMap.autoUpdate;
        shadowMap.autoUpdate = false;
        shadowMap.needsUpdate = true;
        invalidate();
        return () => {
            shadowMap.autoUpdate = previous;
            shadowMap.needsUpdate = true;
        };
    }, [model, shadowMap, invalidate]);
    return shadowMap;
}

export class ModelBoundary extends Component<
    { children: ReactNode; fallback: ReactNode },
    { failed: boolean }
> {
    state = { failed: false };

    static getDerivedStateFromError() {
        return { failed: true };
    }

    render() {
        return this.state.failed ? this.props.fallback : this.props.children;
    }
}

type CabinetMotion = { model: boolean; camera: boolean };

function CabinetSnapshot({
    capture,
    onSnapshot,
}: {
    capture: RefObject<(() => void) | null>;
    onSnapshot: (image: HTMLCanvasElement) => void;
}) {
    const { gl, scene, camera } = useThree();
    useLayoutEffect(() => {
        capture.current = () => {
            if (gl.info.render.calls === 0 || gl.getContext().isContextLost())
                return;
            gl.render(scene, camera);
            const image = document.createElement('canvas');
            image.width = gl.domElement.width;
            image.height = gl.domElement.height;
            const context = image.getContext('2d');
            if (!context) return;
            context.drawImage(gl.domElement, 0, 0);
            onSnapshot(image);
        };
        return () => {
            capture.current = null;
        };
    }, [capture, onSnapshot, gl, scene, camera]);
    return null;
}

function CameraFit({
    model,
    reduceMotion,
    motion,
}: {
    model: ProceduralCabinetModel;
    reduceMotion: boolean;
    motion: RefObject<CabinetMotion>;
}) {
    const { camera, size, invalidate } = useThree();
    const bounds = useMemo(() => new Box3(), []);
    const height = model.height;
    useEffect(() => {
        if (!(camera instanceof PerspectiveCamera)) return;
        fitProceduralCabinetCamera(
            camera,
            {
                height,
                width: CABINET_WIDTH,
                depth: CABINET_DEPTH,
                drawerTravel: CABINET_DRAWER_TRAVEL,
            },
            size,
        );
        invalidate();
    }, [camera, size.width, size.height, height, invalidate]);
    useFrame((_, delta) => {
        if (!(camera instanceof PerspectiveCamera)) return;
        bounds.setFromObject(model.root);
        const moving = fitProceduralCabinetBounds(
            camera,
            bounds,
            reduceMotion ? 1 : 1 - Math.exp(-8 * Math.min(delta, 0.05)),
        );
        motion.current.camera = moving;
        if (moving) invalidate();
    }, -0.5);
    return null;
}

export function StudioEnvironment() {
    const { gl, scene, invalidate } = useThree();
    useEffect(() => {
        const room = new RoomEnvironment();
        const generator = new PMREMGenerator(gl);
        const environment = generator.fromScene(room, 0.04);
        const previous = scene.environment;
        const previousIntensity = scene.environmentIntensity;
        scene.environment = environment.texture;
        scene.environmentIntensity = 0.65;
        room.dispose();
        generator.dispose();
        invalidate();
        return () => {
            scene.environment = previous;
            scene.environmentIntensity = previousIntensity;
            environment.dispose();
        };
    }, [gl, scene, invalidate]);
    return null;
}

function GroundContact({ model }: { model: ProceduralCabinetModel }) {
    const mesh = useRef<Mesh>(null);
    useFrame(() => {
        if (mesh.current) mesh.current.rotation.z = model.root.rotation.y;
    });
    const width = CABINET_WIDTH + 1.5;
    const depth = CABINET_DEPTH + 1.5;
    const texture = useMemo(() => {
        const size = 96;
        const data = new Uint8Array(size * size * 4);
        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                const dx = Math.max(
                    0,
                    Math.abs((x / (size - 1) - 0.5) * width) -
                        CABINET_WIDTH / 2 +
                        0.02,
                );
                const dz = Math.max(
                    0,
                    Math.abs((y / (size - 1) - 0.5) * depth) -
                        CABINET_DEPTH / 2 +
                        0.02,
                );
                data[(y * size + x) * 4 + 3] = Math.round(
                    255 * Math.exp(-(dx * dx + dz * dz) / 0.055),
                );
            }
        }
        const map = new DataTexture(data, size, size, RGBAFormat);
        map.needsUpdate = true;
        return map;
    }, [width, depth]);
    useEffect(() => () => texture.dispose(), [texture]);
    return (
        <mesh
            ref={mesh}
            rotation={[-Math.PI / 2, 0, 0]}
            position={[0, -0.002, 0]}
        >
            <planeGeometry args={[width, depth]} />
            <meshBasicMaterial
                map={texture}
                transparent
                opacity={0.19}
                depthWrite={false}
            />
        </mesh>
    );
}

export function DrawerLabels({
    model,
    drawers,
}: {
    model: ProceduralCabinetModel;
    drawers: readonly CabinetModelDrawer[];
}) {
    const invalidate = useThree((state) => state.invalidate);
    const gl = useThree((state) => state.gl);
    useEffect(() => {
        const textures: CanvasTexture[] = [];
        for (const drawer of drawers) {
            const mesh = model.labels.get(drawer.id);
            if (!mesh || !model.drawers.get(drawer.id)?.visible) continue;
            const canvas = document.createElement('canvas');
            canvas.width = 768;
            canvas.height = 96;
            const context = canvas.getContext('2d');
            if (!context) continue;
            context.fillStyle = '#27343e';
            context.font = '500 58px Arial, sans-serif';
            context.textAlign = 'center';
            context.textBaseline = 'middle';
            context.fillText(
                drawer.label,
                canvas.width / 2,
                canvas.height / 2,
                canvas.width - 32,
            );
            const texture = new CanvasTexture(canvas);
            texture.colorSpace = SRGBColorSpace;
            texture.anisotropy = Math.min(
                gl.capabilities.getMaxAnisotropy(),
                8,
            );
            mesh.material.map = texture;
            mesh.material.color.set('#ffffff');
            mesh.material.opacity = 1;
            mesh.material.needsUpdate = true;
            textures.push(texture);
        }
        invalidate();
        return () => {
            model.labels.forEach((mesh) => {
                mesh.material.map = null;
                mesh.material.opacity = 0;
            });
            textures.forEach((texture) => texture.dispose());
        };
    }, [model, drawers, invalidate, gl]);
    return null;
}

function DrawerInteriorTarget({
    model,
    drawerId,
    drawerCount,
    onView,
}: {
    model: ProceduralCabinetModel;
    drawerId: string;
    drawerCount: number;
    onView: (id: string) => void;
}) {
    const target = useRef<Group>(null);
    const ready = useRef(false);
    const [hovered, setHovered] = useState(false);
    const gl = useThree((state) => state.gl);
    const interior = cabinetDrawerInterior(drawerCount);
    const depth = interior.frontZ - interior.backZ;

    useEffect(
        () => () => {
            gl.domElement.style.cursor = 'pointer';
        },
        [gl],
    );
    useFrame(() => {
        const drawer = model.drawers.get(drawerId);
        if (!target.current || !drawer) return;
        target.current.position.set(
            0,
            drawer.position.y + interior.topY + 0.006,
            drawer.position.z + (interior.frontZ + interior.backZ) / 2,
        );
        target.current.rotation.y = model.root.rotation.y;
        target.current.position.applyAxisAngle(
            model.root.up,
            model.root.rotation.y,
        );
        ready.current = drawer.position.z >= CABINET_DRAWER_TRAVEL - 0.001;
        target.current.visible = ready.current;
    });

    return (
        <group
            ref={target}
            name="drawer-interior-target"
            onPointerOver={(event) => {
                if (!ready.current || event.pointerType === 'touch') return;
                event.stopPropagation();
                setHovered(true);
                gl.domElement.style.cursor = 'zoom-in';
            }}
            onPointerOut={() => {
                setHovered(false);
                gl.domElement.style.cursor = 'pointer';
            }}
            onClick={(event) => {
                event.stopPropagation();
                if (ready.current) onView(drawerId);
            }}
        >
            <group rotation={[-Math.PI / 2, 0, 0]}>
                <mesh name="drawer-interior-fill">
                    <planeGeometry args={[interior.width, depth]} />
                    <meshBasicMaterial
                        color="#2563eb"
                        transparent
                        opacity={hovered ? 0.4 : 0}
                        depthWrite={false}
                    />
                </mesh>
                {[-1, 1].map((side) => (
                    <group key={side}>
                        <mesh position={[0, (side * depth) / 2, 0.001]}>
                            <planeGeometry args={[interior.width, 0.012]} />
                            <meshBasicMaterial
                                color="#1e40af"
                                transparent
                                opacity={hovered ? 0.5 : 0}
                                depthWrite={false}
                            />
                        </mesh>
                        <mesh
                            position={[(side * interior.width) / 2, 0, 0.001]}
                        >
                            <planeGeometry args={[0.012, depth]} />
                            <meshBasicMaterial
                                color="#1e40af"
                                transparent
                                opacity={hovered ? 0.5 : 0}
                                depthWrite={false}
                            />
                        </mesh>
                    </group>
                ))}
            </group>
        </group>
    );
}

type CabinetSceneProps = {
    drawers: readonly CabinetModelDrawer[];
    color?: CabinetColor;
    openDrawerId: string | null;
    rotation: number;
    active: boolean;
    reduceMotion: boolean;
    onOpenDrawerChange?: (drawerId: string | null) => void;
    onViewDrawer?: (drawerId: string) => void;
    onReady?: () => void;
    onIdle?: () => void;
};

function CabinetScene(props: CabinetSceneProps) {
    const [model, setModel] = useState<ProceduralCabinetModel | null>(null);
    useLayoutEffect(() => {
        const acquired = acquireProceduralCabinet(props.drawers);
        setModel(acquired);
        return () => releaseProceduralCabinet(acquired);
    }, [props.drawers]);
    return model ? <CabinetModelScene {...props} model={model} /> : null;
}

function CabinetModelScene({
    model,
    drawers,
    color,
    openDrawerId,
    rotation,
    active,
    reduceMotion,
    onOpenDrawerChange,
    onViewDrawer,
    onReady,
    onIdle,
}: CabinetSceneProps & { model: ProceduralCabinetModel }) {
    const motion = useRef<CabinetMotion>({ model: true, camera: true });
    const ready = useRef(false);
    useFrame(() => {
        if (!ready.current) {
            ready.current = true;
            onReady?.();
        }
        if (!motion.current.model && !motion.current.camera) onIdle?.();
    });
    const shadowMap = useCachedModelShadows(model);
    const [hoveredDrawerId, setHoveredDrawerId] = useState<string | null>(null);
    useEffect(() => {
        if (!active) setHoveredDrawerId(null);
    }, [active]);
    const movements = useRef(
        new Map<
            string,
            { from: number; to: number; elapsed: number; duration: number }
        >(),
    );
    const invalidate = useThree((state) => state.invalidate);
    useLayoutEffect(() => {
        setProceduralCabinetColor(model, color);
        invalidate();
    }, [model, color, invalidate]);
    useEffect(() => {
        ready.current = false;
        movements.current.clear();
    }, [model]);
    useEffect(() => {
        model.drawers.forEach((drawer, id) => {
            const target =
                id === openDrawerId
                    ? CABINET_DRAWER_TRAVEL
                    : id === hoveredDrawerId
                      ? CABINET_DRAWER_TRAVEL * 0.14
                      : 0;
            if (movements.current.get(id)?.to === target) return;
            movements.current.set(id, {
                from: drawer.position.z,
                to: target,
                elapsed: 0,
                duration:
                    target === CABINET_DRAWER_TRAVEL
                        ? 0.78
                        : drawer.position.z > CABINET_DRAWER_TRAVEL * 0.5
                          ? 0.62
                          : 0.24,
            });
        });
        invalidate();
    }, [
        openDrawerId,
        hoveredDrawerId,
        rotation,
        reduceMotion,
        model,
        invalidate,
    ]);

    useFrame((_, delta) => {
        let moving = false;
        let shadowsChanged = false;
        function nextPosition(current: number, target: number) {
            if (reduceMotion || Math.abs(current - target) < 0.001)
                return target;
            moving = true;
            return MathUtils.damp(current, target, 7, Math.min(delta, 0.05));
        }
        const previousRotation = model.root.rotation.y;
        model.root.rotation.y = nextPosition(
            model.root.rotation.y,
            cabinetRotationTarget(model.root.rotation.y, rotation),
        );
        shadowsChanged = previousRotation !== model.root.rotation.y;
        model.drawers.forEach((drawer, id) => {
            const movement = movements.current.get(id);
            if (movement) {
                const previousPosition = drawer.position.z;
                movement.elapsed = reduceMotion
                    ? 1
                    : Math.min(
                          1,
                          movement.elapsed +
                              Math.min(
                                  delta,
                                  movement.elapsed === 0 ? 0.016 : 0.25,
                              ) /
                                  movement.duration,
                      );
                moveCabinetDrawer(
                    model,
                    id,
                    MathUtils.lerp(
                        movement.from,
                        movement.to,
                        cabinetDrawerEase(movement.elapsed),
                    ),
                );
                if (movement.elapsed < 1 && movement.from !== movement.to)
                    moving = true;
                if (previousPosition !== drawer.position.z)
                    shadowsChanged = true;
                if (movement.elapsed === 1) movements.current.delete(id);
            }
            const highlight = model.highlights.get(id);
            if (highlight) {
                const wasVisible = highlight.visible;
                highlight.visible =
                    Boolean(onOpenDrawerChange) &&
                    id === openDrawerId &&
                    !onViewDrawer;
                if (wasVisible !== highlight.visible) shadowsChanged = true;
            }
        });
        if (shadowsChanged) shadowMap.needsUpdate = true;
        motion.current.model = moving;
        if (moving) invalidate();
    }, -1);

    function drawerIdForObject(hit: Object3D) {
        let object: Object3D | null = hit;
        while (object && typeof object.userData.drawerId !== 'string') {
            object = object.parent;
        }
        return (object?.userData.drawerId as string | undefined) ?? null;
    }

    function hoverDrawer(event: ThreeEvent<PointerEvent>) {
        if (!onOpenDrawerChange || event.pointerType === 'touch') return;
        event.stopPropagation();
        setHoveredDrawerId(drawerIdForObject(event.object));
    }

    function selectDrawer(event: ThreeEvent<MouseEvent>) {
        if (!onOpenDrawerChange) return;
        const id = drawerIdForObject(event.object);
        if (!id) return;
        event.stopPropagation();
        setHoveredDrawerId(null);
        onOpenDrawerChange(id === openDrawerId ? null : id);
    }

    return (
        <>
            <CameraFit
                model={model}
                reduceMotion={reduceMotion}
                motion={motion}
            />
            <StudioEnvironment />
            <GroundContact model={model} />
            <hemisphereLight args={['#f6f8fa', '#747a7e', 0.6]} />
            <directionalLight
                position={[-3, 8, 6]}
                intensity={2.4}
                castShadow
                shadow-mapSize={[2048, 2048]}
                shadow-camera-left={-4}
                shadow-camera-right={4}
                shadow-camera-top={8}
                shadow-camera-bottom={-2}
                shadow-normalBias={0.004}
                shadow-bias={-0.00005}
            />
            <directionalLight
                position={[4, 4, -3]}
                intensity={0.8}
                color="#e3eaf0"
            />
            <primitive
                object={model.root}
                dispose={null}
                onClick={selectDrawer}
                onPointerOver={hoverDrawer}
                onPointerOut={() => setHoveredDrawerId(null)}
            />
            {openDrawerId && onViewDrawer && (
                <DrawerInteriorTarget
                    key={openDrawerId}
                    model={model}
                    drawerId={openDrawerId}
                    drawerCount={drawers.length}
                    onView={onViewDrawer}
                />
            )}
            <DrawerLabels model={model} drawers={drawers} />
        </>
    );
}

export default function ProceduralCabinetPreview({
    cabinet,
    openDrawerId,
    fallback,
    compact = false,
    presentationOnly = false,
    active = true,
    resident = active,
    onOpenDrawerChange,
    onViewDrawer,
    onReady,
}: {
    cabinet: {
        name: string;
        color?: CabinetColor;
        drawers: readonly CabinetModelDrawer[];
    };
    openDrawerId: string | null;
    fallback: ReactNode;
    compact?: boolean;
    presentationOnly?: boolean;
    active?: boolean;
    resident?: boolean;
    onOpenDrawerChange?: (drawerId: string | null) => void;
    onViewDrawer?: (drawerId: string) => void;
    onReady?: () => void;
}) {
    const [rotation, setRotation] = useState(0);
    const [mounted, setMounted] = useState(resident);
    const [rendered, setRendered] = useState(false);
    const [paused, setPaused] = useState(false);
    const [snapshot, setSnapshot] = useState<string>();
    const capture = useRef<(() => void) | null>(null);
    const snapshotUrl = useRef<string | null>(null);
    const snapshotVersion = useRef(0);
    const alive = useRef(true);
    const onSnapshot = useCallback((image: HTMLCanvasElement) => {
        const version = ++snapshotVersion.current;
        image.toBlob((blob) => {
            if (!blob || !alive.current || version !== snapshotVersion.current)
                return;
            const url = URL.createObjectURL(blob);
            if (snapshotUrl.current) URL.revokeObjectURL(snapshotUrl.current);
            snapshotUrl.current = url;
            setSnapshot(url);
        });
    }, []);
    useEffect(() => {
        alive.current = true;
        return () => {
            alive.current = false;
            if (snapshotUrl.current) URL.revokeObjectURL(snapshotUrl.current);
            snapshotUrl.current = null;
        };
    }, []);
    useEffect(() => {
        if (resident) {
            setMounted(true);
        } else {
            capture.current?.();
            setMounted(false);
            setRendered(false);
        }
    }, [resident]);
    useEffect(
        () => setPaused(false),
        [
            active,
            resident,
            rotation,
            openDrawerId,
            cabinet.drawers,
            cabinet.color,
        ],
    );
    const reduceMotion = useReducedMotion() === true;
    const selectedDrawer = cabinet.drawers.find(
        (drawer) => drawer.id === openDrawerId,
    );

    return (
        <ModelBoundary fallback={fallback}>
            <div
                className={`flex w-full min-w-0 flex-col items-center gap-2 ${presentationOnly ? 'h-full' : ''}`}
            >
                {!presentationOnly && (
                    <p
                        className="w-full truncate px-2 text-center text-sm font-semibold"
                        title={cabinet.name}
                    >
                        {cabinet.name}
                    </p>
                )}
                <div
                    className={
                        presentationOnly
                            ? 'relative h-full w-full'
                            : compact
                              ? 'relative h-112 w-full'
                              : 'relative h-96 w-full sm:h-[clamp(22rem,50dvh,30rem)]'
                    }
                    aria-hidden="true"
                >
                    {snapshot && (
                        <img
                            src={snapshot}
                            alt=""
                            data-cabinet-snapshot
                            className="pointer-events-none absolute inset-0 h-full w-full"
                            style={{
                                visibility:
                                    mounted && rendered ? 'hidden' : 'visible',
                            }}
                        />
                    )}
                    {mounted && (
                        <Canvas
                            shadows={{ type: PCFShadowMap }}
                            frameloop={paused ? 'never' : 'demand'}
                            dpr={[1.5, 2]}
                            camera={{
                                position: [-5.2, 5, 7.5],
                                fov: 20,
                                near: 0.1,
                                far: 80,
                            }}
                            gl={{
                                antialias: true,
                                alpha: true,
                                powerPreference: 'low-power',
                            }}
                            style={{
                                opacity: rendered ? 1 : 0,
                                cursor: onOpenDrawerChange
                                    ? 'pointer'
                                    : undefined,
                            }}
                        >
                            <CabinetScene
                                drawers={cabinet.drawers}
                                color={cabinet.color}
                                openDrawerId={openDrawerId}
                                rotation={rotation}
                                active={active}
                                reduceMotion={reduceMotion}
                                onOpenDrawerChange={onOpenDrawerChange}
                                onViewDrawer={onViewDrawer}
                                onReady={() => {
                                    if (!snapshot) setRendered(true);
                                    onReady?.();
                                }}
                                onIdle={() => {
                                    setRendered(true);
                                    if (!active) setPaused(true);
                                }}
                            />
                            <CabinetSnapshot
                                capture={capture}
                                onSnapshot={onSnapshot}
                            />
                        </Canvas>
                    )}
                </div>
                {!presentationOnly && (
                    <>
                        <p
                            role="status"
                            className="max-w-full truncate px-2 text-center text-sm font-medium text-muted-foreground"
                            title={selectedDrawer?.label}
                        >
                            {selectedDrawer
                                ? `${selectedDrawer.label} open`
                                : 'Drawers closed'}
                        </p>
                        <div
                            role="group"
                            aria-label="Cabinet viewing angle"
                            className="flex items-center gap-1"
                        >
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="rounded-lg"
                                aria-label="Rotate cabinet left"
                                onClick={() =>
                                    setRotation((value) => value - Math.PI / 6)
                                }
                            >
                                <ChevronLeft aria-hidden="true" />
                            </Button>
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="rounded-lg text-xs"
                                onClick={() => setRotation(0)}
                            >
                                <RotateCcw
                                    aria-hidden="true"
                                    className="size-3.5"
                                />{' '}
                                Reset view
                            </Button>
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="rounded-lg"
                                aria-label="Rotate cabinet right"
                                onClick={() =>
                                    setRotation((value) => value + Math.PI / 6)
                                }
                            >
                                <ChevronRight aria-hidden="true" />
                            </Button>
                        </div>
                    </>
                )}
            </div>
        </ModelBoundary>
    );
}
