<?php

namespace App\Http\Middleware;

use App\Models\Office;
use App\Services\Offices\CurrentOffice;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $user = $request->user();
        $office = $user === null ? null : app(CurrentOffice::class)->office();

        return [
            ...parent::share($request),
            'name' => config('app.name'),
            'auth' => [
                'user' => $user,
            ],
            'sidebarOpen' => ! $request->hasCookie('sidebar_state') || $request->cookie('sidebar_state') === 'true',
            'canResetData' => app()->environment(['local', 'testing']),
            'officeName' => $office?->name,
            'officeId' => $office?->id,
            'officePermissions' => [
                'canManageRouting' => $office->can_manage_routing ?? false,
                'canRouteDocuments' => $office->can_route_documents ?? false,
                'canUploadToReceiving' => $office->can_upload_to_receiving ?? false,
                'canManageDocumentTypes' => $office->can_manage_document_types ?? false,
            ],
            'offices' => $user === null
                ? []
                : Office::query()
                    ->orderBy('name')
                    ->get(['id', 'name'])
                    ->map(fn (Office $item): array => [
                        'id' => $item->id,
                        'name' => $item->name,
                    ])
                    ->values()
                    ->all(),
        ];
    }
}
