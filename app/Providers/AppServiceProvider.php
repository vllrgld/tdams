<?php

namespace App\Providers;

use App\Models\Book;
use App\Models\Cabinet;
use App\Models\Document;
use App\Models\Drawer;
use App\Services\Offices\CurrentOffice;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\Date;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\ServiceProvider;
use Illuminate\Validation\Rules\Password;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        $this->configureDefaults();
        $this->syncViteHotFile();
        $this->constrainDocumentBinding();
        $this->constrainArchiveBindings();
    }

    protected function constrainArchiveBindings(): void
    {
        Route::bind('cabinet', fn (string $value): Cabinet => Cabinet::query()
            ->forOffice(app(CurrentOffice::class)->ensure()?->id)->findOrFail($value));
        Route::bind('drawer', fn (string $value): Drawer => Drawer::query()
            ->forOffice(app(CurrentOffice::class)->ensure()?->id)->findOrFail($value));
        Route::bind('book', fn (string $value): Book => Book::query()
            ->forOffice(app(CurrentOffice::class)->ensure()?->id)->findOrFail($value));
    }

    protected function constrainDocumentBinding(): void
    {
        Route::bind('document', function (string $value): Document {
            $query = Document::query();

            if (auth()->check()) {
                $officeId = app(CurrentOffice::class)->ensure()?->id;
                abort_if($officeId === null, 404);
                $query->forOffice($officeId);
            }

            return $query->findOrFail($value);
        });
    }

    /**
     * Configure default behaviors for production-ready applications.
     */
    protected function configureDefaults(): void
    {
        Date::use(CarbonImmutable::class);

        DB::prohibitDestructiveCommands(
            app()->isProduction(),
        );

        Password::defaults(fn (): ?Password => app()->isProduction()
            ? Password::min(12)
                ->mixedCase()
                ->letters()
                ->numbers()
                ->symbols()
                ->uncompromised()
            : null,
        );
    }

    /**
     * Prefer Vite HMR while the dev server is up; use public/build otherwise.
     */
    protected function syncViteHotFile(): void
    {
        if (! app()->isLocal() || app()->runningInConsole()) {
            return;
        }

        $hotFile = public_path('hot');

        if ($this->viteDevServerIsRunning()) {
            if (! is_file($hotFile)) {
                file_put_contents($hotFile, 'http://127.0.0.1:5173');
            }

            return;
        }

        if (is_file($hotFile)) {
            @unlink($hotFile);
        }
    }

    protected function viteDevServerIsRunning(): bool
    {
        $connection = @fsockopen('127.0.0.1', 5173, $errno, $errstr, 0.2);

        if (! is_resource($connection)) {
            return false;
        }

        fclose($connection);

        return true;
    }
}
