import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useReducedMotion } from 'motion/react';
import { Group, MathUtils, PerspectiveCamera } from 'three';
import { StudioEnvironment } from '../cabinets/procedural-cabinet-preview';
import {
    createLeverArchFile,
    createLeverArchLabel,
    disposeLeverArchFile,
    fitLeverArchCamera,
} from './lever-arch-model';

function FileScene({
    label,
    coverTitle,
    rotation,
    open,
    reduceMotion,
}: {
    label: string;
    coverTitle: string;
    rotation: { x: number; y: number };
    open: boolean;
    reduceMotion: boolean;
}) {
    const invalidate = useThree((s) => s.invalidate);
    const { camera, size } = useThree();
    const file = useMemo(() => createLeverArchFile(), []);
    const group = useRef<Group>(null);
    useEffect(() => () => disposeLeverArchFile(file.root), [file]);
    useEffect(() => {
        const card = createLeverArchLabel(label, coverTitle);
        file.root.add(card);
        invalidate();
        return () => {
            file.root.remove(card);
            card.geometry.dispose();
            card.material.map?.dispose();
            card.material.dispose();
        };
    }, [file, label, coverTitle, invalidate]);
    useEffect(() => {
        invalidate();
    }, [rotation, open, invalidate]);
    useFrame((_, delta) => {
        if (!group.current) return;
        let moving = false;
        const approach = (from: number, to: number) =>
            Math.abs(from - to) < 0.001
                ? to
                : reduceMotion
                  ? to
                  : MathUtils.damp(from, to, 9, Math.min(delta, 0.05));
        for (const axis of ['x', 'y'] as const) {
            const target = MathUtils.degToRad(
                rotation[axis] + (open ? (axis === 'x' ? -36 : -32) : 0),
            );
            const next = approach(group.current.rotation[axis], target);
            moving ||= next !== target;
            group.current.rotation[axis] = next;
        }
        const target = open ? -2.9 : 0;
        file.cover.rotation.y = approach(file.cover.rotation.y, target);
        moving ||= file.cover.rotation.y !== target;
        if (camera instanceof PerspectiveCamera)
            fitLeverArchCamera(camera, group.current, size);
        if (moving) invalidate();
    });
    return (
        <>
            <StudioEnvironment />
            <hemisphereLight args={['#ffffff', '#8a919c', 1.6]} />
            <directionalLight position={[-2, 4, 5]} intensity={3} />
            <directionalLight position={[3, 2, -4]} intensity={1.5} />
            <group ref={group}>
                <primitive object={file.root} dispose={null} />
            </group>
        </>
    );
}

export default function LeverArchPreview({
    label,
    coverTitle,
    compact = false,
}: {
    label: string;
    coverTitle: string;
    compact?: boolean;
}) {
    const [rotation, setRotation] = useState({ x: 8, y: 32 }),
        [open, setOpen] = useState(false);
    const reduceMotion = useReducedMotion() === true;
    const drag = useRef<{
        id: number;
        x: number;
        y: number;
        rx: number;
        ry: number;
    } | null>(null);
    return (
        <div
            className="flex w-full min-w-0 flex-col items-center gap-2"
            data-lever-arch-preview
        >
            <div
                role="group"
                aria-label={`${label} lever arch file preview`}
                tabIndex={0}
                className="w-full cursor-grab touch-none outline-offset-4 focus-visible:outline-2 focus-visible:outline-blue-900 active:cursor-grabbing dark:focus-visible:outline-blue-200"
                style={{ height: compact ? 300 : 380 }}
                onPointerDown={(e) => {
                    if (e.button !== 0) return;
                    e.currentTarget.setPointerCapture(e.pointerId);
                    drag.current = {
                        id: e.pointerId,
                        x: e.clientX,
                        y: e.clientY,
                        rx: rotation.x,
                        ry: rotation.y,
                    };
                }}
                onPointerMove={(e) => {
                    const d = drag.current;
                    if (!d || d.id !== e.pointerId) return;
                    setRotation({
                        x: MathUtils.clamp(
                            d.rx - (e.clientY - d.y) * 0.35,
                            -65,
                            65,
                        ),
                        y: d.ry + (e.clientX - d.x) * 0.4,
                    });
                }}
                onPointerUp={(e) => {
                    drag.current = null;
                    if (e.currentTarget.hasPointerCapture(e.pointerId))
                        e.currentTarget.releasePointerCapture(e.pointerId);
                }}
                onPointerCancel={() => {
                    drag.current = null;
                }}
                onLostPointerCapture={() => {
                    drag.current = null;
                }}
                onKeyDown={(e) => {
                    if (
                        ![
                            'ArrowLeft',
                            'ArrowRight',
                            'ArrowUp',
                            'ArrowDown',
                            'Home',
                        ].includes(e.key)
                    )
                        return;
                    e.preventDefault();
                    if (e.key === 'Home') setRotation({ x: 8, y: 32 });
                    else
                        setRotation((r) => ({
                            x: MathUtils.clamp(
                                r.x +
                                    (e.key === 'ArrowUp'
                                        ? 5
                                        : e.key === 'ArrowDown'
                                          ? -5
                                          : 0),
                                -65,
                                65,
                            ),
                            y:
                                r.y +
                                (e.key === 'ArrowLeft'
                                    ? -15
                                    : e.key === 'ArrowRight'
                                      ? 15
                                      : 0),
                        }));
                }}
            >
                <Canvas
                    frameloop="demand"
                    dpr={[1, 2]}
                    camera={{
                        position: [0, 0.02, 1.1],
                        fov: 25,
                        near: 0.01,
                        far: 10,
                    }}
                    gl={{
                        antialias: true,
                        alpha: true,
                        powerPreference: 'low-power',
                    }}
                    aria-hidden="true"
                >
                    <FileScene
                        {...{ label, coverTitle, rotation, open, reduceMotion }}
                    />
                </Canvas>
            </div>
            <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 text-xs text-slate-600 dark:text-neutral-400">
                <span>Drag or use arrow keys to rotate.</span>
                <button
                    type="button"
                    className="rounded-sm underline-offset-2 hover:underline focus-visible:outline-2"
                    onClick={() => setRotation({ x: 8, y: 32 })}
                >
                    Reset view
                </button>
                <button
                    type="button"
                    aria-pressed={open}
                    className="rounded-sm underline-offset-2 hover:underline focus-visible:outline-2"
                    onClick={() => setOpen((v) => !v)}
                >
                    {open ? 'Close cover' : 'Open cover'}
                </button>
            </div>
        </div>
    );
}
