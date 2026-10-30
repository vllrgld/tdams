import { useEffect, useState, type ComponentType } from 'react';

const resolvedComponents = new WeakMap<
    () => Promise<{ default: ComponentType<object> }>,
    ComponentType<object>
>();

export function useClientComponent<P extends object>(
    loader: () => Promise<{ default: ComponentType<P> }>,
): readonly [ComponentType<P> | null, string | null] {
    'use no memo';

    const key = loader as () => Promise<{ default: ComponentType<object> }>;
    const [revision, setRevision] = useState(0);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (resolvedComponents.has(key)) {
            return;
        }

        let active = true;

        loader()
            .then((mod) => {
                resolvedComponents.set(
                    key,
                    mod.default as ComponentType<object>,
                );

                if (active) {
                    setRevision((value) => value + 1);
                }
            })
            .catch((exception: unknown) => {
                if (!active) {
                    return;
                }

                setError(
                    exception instanceof Error
                        ? exception.message
                        : 'The PDF viewer could not be loaded.',
                );
            });

        return () => {
            active = false;
        };
    }, [key, loader]);

    // `revision` is only a re-render signal. The component stays in the
    // map so a function is never passed to useState.
    const Component =
        revision < 0
            ? null
            : ((resolvedComponents.get(key) as ComponentType<P> | undefined) ??
              null);

    return [Component, error] as const;
}
