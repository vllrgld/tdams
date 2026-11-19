<?php

namespace Tests;

use App\Models\DocumentType;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Testing\TestCase as BaseTestCase;
use Laravel\Fortify\Features;
use LogicException;

abstract class TestCase extends BaseTestCase
{
    public function createApplication(): Application
    {
        $app = parent::createApplication();

        if (! $app->environment('testing') || config('database.default') !== 'sqlite' || config('database.connections.sqlite.database') !== ':memory:') {
            throw new LogicException('Tests require the isolated SQLite in-memory database. Refusing to run with another database configuration.');
        }

        return $app;
    }

    protected function skipUnlessFortifyHas(string $feature, ?string $message = null): void
    {
        if (! Features::enabled($feature)) {
            $this->markTestSkipped($message ?? "Fortify feature [{$feature}] is not enabled.");
        }
    }

    /**
     * @param  array<string, mixed>  $query
     */
    protected function taxDocumentsIndex(array $query = []): string
    {
        return route('documents.index', [
            'type' => DocumentType::taxDeclaration()->id,
            ...$query,
        ]);
    }
}
