import {
    motion,
    useMotionValue,
    type MotionValue,
    type Transition,
} from 'motion/react';
import {
    useEffect,
    useLayoutEffect,
    useMemo,
    useRef,
    type ReactNode,
    type RefObject,
} from 'react';
import { createPortal } from 'react-dom';
import {
    measureSlotPose,
    type FilingItemPose,
} from '../shared/filing-item-pose';
import { folderMotionTransform } from './folder-motion';

/** Keep drawer movement in its depth-sorted scene, and viewing in the overlay. */
export default function FolderActor({
    actorRef,
    motionRef,
    drawerSlot,
    initialPose,
    size,
    phase,
    target,
    transition,
    interactive,
    onComplete,
    children,
}: {
    actorRef: RefObject<HTMLDivElement | null>;
    motionRef: RefObject<MotionValue<string> | null>;
    drawerSlot: HTMLElement | null;
    initialPose: FilingItemPose;
    size: Pick<FilingItemPose, 'width' | 'height' | 'depth'>;
    phase: string;
    target: string | string[];
    transition: Transition;
    interactive: boolean;
    onComplete: () => void;
    children: ReactNode;
}) {
    const inverseFrame = useMemo(
        () =>
            drawerSlot
                ? new DOMMatrix(
                      measureSlotPose(drawerSlot, size.depth).transform,
                  ).inverse()
                : null,
        [drawerSlot, size.depth, initialPose],
    );
    const inFrame = (transform: string) =>
        folderMotionTransform(
            inverseFrame
                ? inverseFrame.multiply(new DOMMatrix(transform)).toString()
                : transform,
            size,
        );
    const transform = useMotionValue(inFrame(initialPose.transform));
    const animateTransform = Array.isArray(target)
        ? target.map(inFrame)
        : inFrame(target);
    const targetKey = `${phase}:${JSON.stringify(animateTransform)}`;
    const latestTarget = useRef(targetKey);
    latestTarget.current = targetKey;
    const completionFrame = useRef<number | null>(null);

    useLayoutEffect(() => {
        motionRef.current = transform;
        return () => {
            if (motionRef.current === transform) motionRef.current = null;
        };
    }, [motionRef, transform]);

    useEffect(
        () => () => {
            if (completionFrame.current !== null)
                cancelAnimationFrame(completionFrame.current);
        },
        [],
    );

    const actor = (
        <motion.div
            ref={actorRef}
            data-folder-actor
            data-folder-flight-space={drawerSlot ? 'drawer' : 'overlay'}
            inert={!interactive || undefined}
            className="absolute top-0 left-0"
            style={{
                width: size.width,
                height: size.height,
                transformStyle: 'preserve-3d',
                pointerEvents: interactive ? 'auto' : 'none',
                transformOrigin: '0px 0px 0px',
                willChange: phase === 'open' ? 'auto' : 'transform',
                transform,
            }}
            initial={{ transform: inFrame(initialPose.transform) }}
            animate={{ transform: animateTransform }}
            transition={transition}
            onAnimationComplete={(definition) => {
                if (
                    typeof definition !== 'object' ||
                    !('transform' in definition) ||
                    JSON.stringify(definition.transform) !==
                        JSON.stringify(animateTransform)
                )
                    return;
                // Wait for Motion's final style write before measuring a handoff.
                completionFrame.current = requestAnimationFrame(() => {
                    completionFrame.current = null;
                    if (latestTarget.current === targetKey) onComplete();
                });
            }}
        >
            {children}
        </motion.div>
    );

    return drawerSlot ? createPortal(actor, drawerSlot) : actor;
}
