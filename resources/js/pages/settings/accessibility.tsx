import { Head, useForm } from '@inertiajs/react';
import type { FormEvent } from 'react';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import {
    useArchiveAnimations,
    type ArchiveAnimationKey,
} from '@/hooks/use-archive-animations';
import { edit, update } from '@/routes/accessibility';

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

export default function Accessibility() {
    const { animations } = useArchiveAnimations();
    const {
        data,
        setData,
        put,
        processing,
        errors,
        recentlySuccessful,
        isDirty,
        setDefaults,
    } = useForm({ animations });
    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        put(update.url(), {
            preserveScroll: true,
            onSuccess: () => setDefaults(data),
        });
    };

    return (
        <>
            <Head title="Accessibility settings" />
            <h1 className="sr-only">Accessibility settings</h1>
            <form onSubmit={submit} className="space-y-8">
                <Heading
                    variant="small"
                    title="Accessibility settings"
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
                                                        name={`animations[${field.key}]`}
                                                        value={mode}
                                                        checked={
                                                            data.animations[
                                                                field.key
                                                            ] === mode
                                                        }
                                                        onChange={() =>
                                                            setData(
                                                                'animations',
                                                                {
                                                                    ...data.animations,
                                                                    [field.key]:
                                                                        mode,
                                                                },
                                                            )
                                                        }
                                                        disabled={processing}
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
                {Object.keys(errors).length > 0 && (
                    <div role="alert" className="space-y-2">
                        {Object.entries(errors).map(([key, message]) => (
                            <InputError key={key} message={message} />
                        ))}
                    </div>
                )}
                <div className="flex items-center gap-4">
                    <Button type="submit" disabled={processing || !isDirty}>
                        {processing ? 'Saving…' : 'Save preferences'}
                    </Button>
                    {recentlySuccessful && (
                        <p
                            role="status"
                            className="text-sm text-muted-foreground"
                        >
                            Saved.
                        </p>
                    )}
                </div>
            </form>
        </>
    );
}

Accessibility.layout = {
    breadcrumbs: [{ title: 'Accessibility settings', href: edit() }],
};
