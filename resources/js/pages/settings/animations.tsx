import { Head } from '@inertiajs/react';
import { useReducedMotion } from 'motion/react';
import { useState } from 'react';
import Heading from '@/components/heading';
import {
    useArchiveAnimations,
    type ArchiveAnimationKey,
} from '@/hooks/use-archive-animations';
import { edit } from '@/routes/animations';

const groups: {
    title: string;
    fields: { key: ArchiveAnimationKey; title: string }[];
}[] = [
    {
        title: 'Books',
        fields: [
            { key: 'bookPickup', title: 'Pickup' },
            { key: 'bookReturn', title: 'Return' },
        ],
    },
    {
        title: 'Folders',
        fields: [
            { key: 'folderPickup', title: 'Pickup' },
            { key: 'folderReturn', title: 'Return' },
        ],
    },
];

export default function Animations() {
    const { animations, updateAnimation } = useArchiveAnimations();
    const reducedMotion = useReducedMotion();
    const [error, setError] = useState(false);

    return (
        <>
            <Head title="Animation settings" />
            <h1 className="sr-only">Animation settings</h1>
            <div className="space-y-8">
                <Heading
                    variant="small"
                    title="Animation settings"
                    description="Choose how books and folders move between the drawer and reading view."
                />
                <p className="text-sm text-muted-foreground">
                    Full animation moves the item to and from the drawer. Fade
                    pickup pauses before opening the cover; fade return closes
                    the view in place.
                </p>
                {groups.map((group) => (
                    <section
                        key={group.title}
                        aria-labelledby={`animation-${group.title.toLowerCase()}`}
                    >
                        <h2
                            id={`animation-${group.title.toLowerCase()}`}
                            className="border-b pb-3 text-sm font-semibold"
                        >
                            {group.title}
                        </h2>
                        <div className="divide-y">
                            {group.fields.map((field) => (
                                <fieldset
                                    key={field.key}
                                    className="flex min-w-0 flex-wrap items-center justify-between gap-x-6 gap-y-2 py-4"
                                    aria-label={`${group.title} ${field.title.toLowerCase()}`}
                                >
                                    <legend className="sr-only">
                                        {group.title}{' '}
                                        {field.title.toLowerCase()}
                                    </legend>
                                    <span
                                        aria-hidden="true"
                                        className="text-sm font-medium"
                                    >
                                        {field.title}
                                    </span>
                                    <div className="flex items-center gap-4">
                                        {(['full', 'fade'] as const).map(
                                            (mode) => (
                                                <label
                                                    key={mode}
                                                    className="flex min-h-10 cursor-pointer items-center gap-2 text-sm"
                                                >
                                                    <input
                                                        type="radio"
                                                        name={field.key}
                                                        value={mode}
                                                        checked={
                                                            animations[
                                                                field.key
                                                            ] === mode
                                                        }
                                                        onChange={() =>
                                                            setError(
                                                                !updateAnimation(
                                                                    field.key,
                                                                    mode,
                                                                ),
                                                            )
                                                        }
                                                        className="size-4 accent-sidebar-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                                                    />
                                                    {mode === 'full'
                                                        ? 'Full animation'
                                                        : 'Fade'}
                                                </label>
                                            ),
                                        )}
                                    </div>
                                </fieldset>
                            ))}
                        </div>
                    </section>
                ))}
                <div className="space-y-2 text-sm text-muted-foreground">
                    <p>
                        Saved automatically in this browser. Changes apply the
                        next time you open a book or folder.
                    </p>
                    <p role={reducedMotion ? 'status' : undefined}>
                        {reducedMotion
                            ? 'Reduced motion is enabled on your device. A short fade is used for all four settings.'
                            : 'Your device’s reduced-motion preference takes priority over these settings.'}
                    </p>
                    {error && (
                        <p role="alert" className="text-destructive">
                            Could not save your preference. Allow browser
                            storage and try again.
                        </p>
                    )}
                </div>
            </div>
        </>
    );
}

Animations.layout = {
    breadcrumbs: [{ title: 'Animation settings', href: edit() }],
};
