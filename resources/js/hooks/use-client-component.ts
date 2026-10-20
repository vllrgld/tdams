import { useEffect, useState, type ComponentType } from 'react';

const resolvedComponents = new WeakMap<
    () => Promise<{ default: ComponentType<object> }>,
    ComponentType<object>
>();

export function useClientComponent<P extends object>(
    loader: () => Promise<{ default: ComponentType<P> }>,
): ComponentType<P> | null {
    const [Component, setComponent] = useState<ComponentType<P> | null>(
        () =>
            (resolvedComponents.get(
                loader as () => Promise<{ default: ComponentType<object> }>,
            ) as ComponentType<P> | undefined) ?? null,
    );

    useEffect(() => {
        const cached = resolvedComponents.get(
            loader as () => Promise<{ default: ComponentType<object> }>,
        ) as ComponentType<P> | undefined;

        if (cached) {
            setComponent(() => cached);
            return;
        }

        let cancelled = false;

        void loader().then((mod) => {
            resolvedComponents.set(
                loader as () => Promise<{ default: ComponentType<object> }>,
                mod.default as ComponentType<object>,
            );

            if (!cancelled) {
                setComponent(() => mod.default);
            }
        });

        return () => {
            cancelled = true;
        };
    }, [loader]);

    return Component;
}
