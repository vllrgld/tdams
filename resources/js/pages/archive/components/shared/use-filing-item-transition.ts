import { useReducedMotion } from 'motion/react';
import {
    useCallback,
    useEffect,
    useRef,
    useState,
    type RefObject,
} from 'react';
import { useArchiveAnimations } from '@/hooks/use-archive-animations';

// Allow the 200 ms fade to finish, then hold the closed cover briefly.
export const FADE_PICKUP_HOLD_MS = 450;

/** Snapshot choices for one reading session, so changing tabs cannot interrupt a flight. */
export function useFilingItemTransition({
    kind,
    dialogRef,
    onClose,
    getActor,
}: {
    kind: 'book' | 'folder';
    dialogRef: RefObject<HTMLDivElement | null>;
    onClose: () => void;
    getActor: () => HTMLElement | null;
}) {
    const { animations } = useArchiveAnimations();
    const reducedMotion = useReducedMotion();
    const [choices] = useState(() => ({
        pickup: animations[kind === 'book' ? 'bookPickup' : 'folderPickup'],
        return: animations[kind === 'book' ? 'bookReturn' : 'folderReturn'],
    }));
    const [fadingOut, setFadingOut] = useState(false);
    const fadingOutRef = useRef(false);
    const callbacks = useRef({ onClose, getActor });
    callbacks.current = { onClose, getActor };
    const duration = reducedMotion ? 0.12 : 0.2;
    const closeWithFade = useCallback(() => {
        if (fadingOutRef.current) return;
        fadingOutRef.current = true;
        setFadingOut(true);
    }, []);

    useEffect(() => {
        if (!fadingOut) return;
        const root = dialogRef.current;
        const actor = callbacks.current.getActor();
        const targets = [
            root,
            actor && !root?.contains(actor) ? actor : null,
        ].filter((element): element is HTMLElement => Boolean(element));
        let finished = false;
        const finish = () => {
            if (finished) return;
            finished = true;
            callbacks.current.onClose();
        };
        const effects = targets.map((element) => {
            element
                .getAnimations({ subtree: true })
                .forEach((animation) => animation.pause());
            return element.animate(
                [
                    { opacity: getComputedStyle(element).opacity },
                    { opacity: 0 },
                ],
                {
                    duration: duration * 1000,
                    easing: 'ease-out',
                    fill: 'forwards',
                },
            );
        });
        void Promise.all(effects.map((effect) => effect.finished)).then(
            finish,
            () => {},
        );
        // An interrupted browser animation must still release the reading view.
        const timer = window.setTimeout(finish, duration * 1000 + 150);
        return () => {
            finished = true;
            window.clearTimeout(timer);
            effects.forEach((effect) => effect.cancel());
        };
    }, [dialogRef, duration, fadingOut]);

    return {
        pickup: reducedMotion ? 'fade' : choices.pickup,
        returnAnimation: reducedMotion ? 'fade' : choices.return,
        duration,
        fadingOut,
        fadingOutRef,
        closeWithFade,
    };
}
