import { Head, useForm } from '@inertiajs/react';
import type { FormEvent } from 'react';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { assign, edit, update } from '@/routes/tracking-codes';

export default function TrackingCodes({
    prefix,
    year,
    missingCount,
}: {
    prefix: string;
    year: string;
    missingCount: number;
}) {
    const form = useForm({ prefix });
    const assignment = useForm({});
    function save(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        form.put(update.url(), { preserveScroll: true });
    }
    return (
        <>
            <Head title="Tracking codes" />
            <main className="min-h-full flex-1 bg-background p-4 sm:p-6 xl:p-8">
                <div className="mx-auto w-full max-w-xl space-y-8">
                    <Heading
                        variant="small"
                        title="Tracking codes"
                        description="Identify routed documents when receiving and releasing them between offices."
                    />
                    <form onSubmit={save} className="grid gap-5">
                        <div className="grid gap-2">
                            <Label htmlFor="tracking-prefix">Code prefix</Label>
                            <Input
                                id="tracking-prefix"
                                value={form.data.prefix}
                                onChange={(event) =>
                                    form.setData(
                                        'prefix',
                                        event.target.value.toUpperCase(),
                                    )
                                }
                                minLength={2}
                                maxLength={10}
                                required
                                pattern="[A-Z][A-Z0-9]{1,9}"
                                autoComplete="off"
                                className="max-w-56 rounded-none"
                                aria-describedby="tracking-prefix-help"
                            />
                            <p
                                id="tracking-prefix-help"
                                className="text-xs leading-5 text-muted-foreground"
                            >
                                Use 2 to 10 letters or numbers, starting with a
                                letter. Changes apply to new codes only.
                            </p>
                            <InputError message={form.errors.prefix} />
                        </div>
                        <div className="border border-border bg-muted/30 p-4">
                            <p className="mb-2 text-xs text-muted-foreground">
                                Example format
                            </p>
                            <p className="text-base font-medium tracking-wide tabular-nums">
                                {form.data.prefix || 'DTMS'}-{year}-7K9M-4R2X
                            </p>
                            <p className="mt-2 text-xs leading-5 text-muted-foreground">
                                Prefix, year, and a random identifier. Each code
                                is unique and stays with the document across
                                offices.
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            <Button
                                type="submit"
                                disabled={form.processing || !form.isDirty}
                                className="rounded-none bg-blue-900 text-white hover:bg-blue-800 dark:bg-blue-900 dark:hover:bg-blue-800"
                            >
                                {form.processing ? 'Saving…' : 'Save changes'}
                            </Button>
                            {form.recentlySuccessful && (
                                <p
                                    role="status"
                                    className="text-sm text-muted-foreground"
                                >
                                    Saved
                                </p>
                            )}
                        </div>
                    </form>
                    <section className="grid gap-3 border-t border-border pt-6">
                        <h2 className="text-sm font-medium">
                            Automatic assignment
                        </h2>
                        <p className="text-sm leading-6 text-muted-foreground">
                            Routed documents get a code automatically. Documents
                            uploaded directly to the archive get a code only if
                            they are later released to another office.
                        </p>
                        <p className="text-sm text-muted-foreground">
                            {missingCount === 0
                                ? 'All routed documents have tracking codes.'
                                : `${missingCount} routed ${missingCount === 1 ? 'document needs' : 'documents need'} a tracking code.`}
                        </p>
                        <Button
                            type="button"
                            variant="outline"
                            disabled={
                                missingCount === 0 || assignment.processing
                            }
                            className="w-fit rounded-none"
                            onClick={() =>
                                assignment.post(assign.url(), {
                                    preserveScroll: true,
                                })
                            }
                        >
                            {assignment.processing
                                ? 'Assigning…'
                                : 'Assign missing codes'}
                        </Button>
                        {assignment.recentlySuccessful && (
                            <p
                                role="status"
                                className="text-sm text-muted-foreground"
                            >
                                Missing codes assigned.
                            </p>
                        )}
                    </section>
                </div>
            </main>
        </>
    );
}
TrackingCodes.layout = {
    breadcrumbs: [{ title: 'Tracking codes', href: edit() }],
};
