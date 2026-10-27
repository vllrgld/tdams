import { Form, Head } from '@inertiajs/react';
import { useState } from 'react';
import OcrSettingsController from '@/actions/App/Http/Controllers/Settings/OcrSettingsController';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { edit } from '@/routes/ocr';

type Driver = {
    value: string;
    label: string;
    description: string;
};

type Level = {
    value: number;
    label: string;
    description: string;
};

export default function Ocr({
    driver,
    jobUrl,
    model,
    hasToken,
    optimize,
    drivers,
    levels,
    status,
}: {
    driver: string;
    jobUrl: string;
    model: string;
    hasToken: boolean;
    optimize: number;
    drivers: Driver[];
    levels: Level[];
    status?: string;
}) {
    const [selectedDriver, setSelectedDriver] = useState(driver);

    return (
        <>
            <Head title="OCR settings" />

            <h1 className="sr-only">OCR settings</h1>

            <div className="space-y-6">
                <Heading
                    variant="small"
                    title="OCR"
                    description="Choose which OCR engine processes uploaded documents. You can switch at any time."
                />

                <Form
                    {...OcrSettingsController.update.form()}
                    options={{
                        preserveScroll: true,
                    }}
                    className="space-y-8"
                >
                    {({ processing, errors }) => (
                        <>
                            <fieldset className="space-y-3">
                                <legend className="text-sm font-medium">
                                    Engine
                                </legend>
                                {drivers.map((option) => (
                                    <label
                                        key={option.value}
                                        className={cn(
                                            'flex cursor-pointer gap-3 border border-border p-3 has-checked:border-foreground',
                                        )}
                                    >
                                        <input
                                            type="radio"
                                            name="driver"
                                            value={option.value}
                                            defaultChecked={
                                                option.value === driver
                                            }
                                            onChange={() =>
                                                setSelectedDriver(option.value)
                                            }
                                            className="mt-1"
                                        />
                                        <span>
                                            <span className="block text-sm font-medium">
                                                {option.label}
                                            </span>
                                            <span className="mt-1 block text-sm text-muted-foreground">
                                                {option.description}
                                            </span>
                                        </span>
                                    </label>
                                ))}
                            </fieldset>

                            <InputError message={errors.driver} />

                            {selectedDriver === 'paddle' && (
                                <div className="space-y-4">
                                    <Heading
                                        variant="small"
                                        title="PaddleOCR"
                                        description="Defaults come from PADDLE_OCR_JOB_URL, PADDLE_OCR_TOKEN, and PADDLE_OCR_MODEL in .env. Save here to override."
                                    />

                                    <div className="grid gap-2">
                                        <Label htmlFor="job_url">Job URL</Label>
                                        <Input
                                            id="job_url"
                                            name="job_url"
                                            type="url"
                                            defaultValue={jobUrl}
                                            required
                                            autoComplete="off"
                                        />
                                        <InputError message={errors.job_url} />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="token">Token</Label>
                                        <Input
                                            id="token"
                                            name="token"
                                            type="password"
                                            autoComplete="off"
                                            placeholder={
                                                hasToken
                                                    ? 'Saved — leave blank to keep'
                                                    : 'Bearer token'
                                            }
                                        />
                                        <InputError message={errors.token} />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="model">Model</Label>
                                        <Input
                                            id="model"
                                            name="model"
                                            defaultValue={model}
                                            required
                                            autoComplete="off"
                                        />
                                        <InputError message={errors.model} />
                                    </div>
                                </div>
                            )}

                            <fieldset className="space-y-3">
                                <legend className="text-sm font-medium">
                                    Preview PDF compression
                                </legend>
                                <p className="text-sm text-muted-foreground">
                                    Applies after OCR for every engine. The original upload is sent to OCRmyPDF, which converts it to PDF and compresses it with Ghostscript.
                                </p>
                                {levels.map((level) => (
                                    <label
                                        key={level.value}
                                        className={cn(
                                            'flex cursor-pointer gap-3 border border-border p-3 has-checked:border-foreground',
                                        )}
                                    >
                                        <input
                                            type="radio"
                                            name="optimize"
                                            value={level.value}
                                            defaultChecked={
                                                level.value === optimize
                                            }
                                            className="mt-1"
                                        />
                                        <span>
                                            <span className="block text-sm font-medium">
                                                {level.label}
                                            </span>
                                            <span className="mt-1 block text-sm text-muted-foreground">
                                                {level.description}
                                            </span>
                                        </span>
                                    </label>
                                ))}
                            </fieldset>

                            <InputError message={errors.optimize} />

                            <div className="flex items-center gap-4">
                                <Button
                                    type="submit"
                                    disabled={processing}
                                    data-test="update-ocr-button"
                                >
                                    Save
                                </Button>
                                {status === 'ocr-saved' && (
                                    <p className="text-sm text-muted-foreground">
                                        Saved
                                    </p>
                                )}
                            </div>
                        </>
                    )}
                </Form>
            </div>
        </>
    );
}

Ocr.layout = {
    breadcrumbs: [
        {
            title: 'OCR settings',
            href: edit(),
        },
    ],
};
