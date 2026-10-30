import { Form, Head } from '@inertiajs/react';
import { useState } from 'react';
import OcrSettingsController from '@/actions/App/Http/Controllers/Settings/OcrSettingsController';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
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

type Model = {
    value: string;
    label: string;
    description: string;
};

export default function Ocr({
    driver,
    model,
    optimize,
    drivers,
    models,
    levels,
    status,
}: {
    driver: string;
    model: string;
    optimize: number;
    drivers: Driver[];
    models: Model[];
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
                                <fieldset className="space-y-3">
                                    <legend className="text-sm font-medium">
                                        Paddle model
                                    </legend>
                                    <p className="text-sm text-muted-foreground">
                                        The service address and token stay on
                                        the server. Choose which model reads
                                        the scan.
                                    </p>
                                    {models.map((option) => (
                                        <label
                                            key={option.value}
                                            className={cn(
                                                'flex cursor-pointer gap-3 border border-border p-3 has-checked:border-foreground',
                                            )}
                                        >
                                            <input
                                                type="radio"
                                                name="model"
                                                value={option.value}
                                                defaultChecked={
                                                    option.value === model
                                                }
                                                required
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
                                    <InputError message={errors.model} />
                                </fieldset>
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
