<?php

namespace App\Http\Controllers;

use App\Models\DocumentRoute;
use App\Models\DocumentRouteStep;
use App\Models\Office;
use App\Services\Offices\CurrentOffice;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class DocumentRouteController extends Controller
{
    public function index(CurrentOffice $currentOffice): Response
    {
        abort_unless($currentOffice->office()?->can_manage_routing, 403, 'Your office cannot manage routing.');
        $routes = DocumentRoute::query()
            ->with('steps')
            ->withCount([
                'documents' => fn (Builder $documents) => $currentOffice->constrain($documents),
            ])
            ->orderBy('name')
            ->get()
            ->map(fn (DocumentRoute $route): array => [
                ...$route->toOptionArray(),
                'officeSteps' => $route->steps->map(fn (DocumentRouteStep $step): array => [
                    'office_id' => $step->office_id,
                    'can_take_action' => $step->can_take_action,
                    'needs_endorsement' => $step->needs_endorsement,
                ])->values()->all(),
                'documentCount' => (int) $route->documents_count,
            ])
            ->values();

        return Inertia::render('manage/document-routes/index', [
            'routes' => $routes,
            'offices' => Office::query()->orderBy('name')->get(['id', 'name']),
        ]);
    }

    public function store(Request $request, CurrentOffice $currentOffice): RedirectResponse
    {
        abort_unless($currentOffice->office()?->can_manage_routing, 403, 'Your office cannot manage routing.');
        [$name, $steps] = $this->validatedRoute($request);

        DB::transaction(function () use ($name, $steps): void {
            $route = DocumentRoute::query()->create([
                'name' => $name,
            ]);

            $this->replaceSteps($route, $steps);
        });

        return to_route('manage.document-routes.index');
    }

    public function update(Request $request, DocumentRoute $documentRoute, CurrentOffice $currentOffice): RedirectResponse
    {
        abort_unless($currentOffice->office()?->can_manage_routing, 403, 'Your office cannot manage routing.');
        [$name, $steps] = $this->validatedRoute($request, $documentRoute);

        DB::transaction(function () use ($documentRoute, $name, $steps): void {
            $documentRoute = DocumentRoute::query()->whereKey($documentRoute->id)->lockForUpdate()->firstOrFail();
            $previous = $documentRoute->steps->map(fn (DocumentRouteStep $step): array => [
                'office_id' => $step->office_id,
                'can_take_action' => $step->can_take_action,
                'needs_endorsement' => $step->needs_endorsement,
            ])->values()->all();
            $changed = $previous !== $steps;
            if ($changed && $documentRoute->documents()->exists()) {
                throw ValidationException::withMessages(['steps' => 'This routing is assigned to documents. Create new routing to change its offices or requirements.']);
            }
            $documentRoute->update([
                'name' => $name,
            ]);

            if ($changed) {
                $this->replaceSteps($documentRoute, $steps);
            }
        });

        return to_route('manage.document-routes.index');
    }

    /**
     * @return array{0: string, 1: list<array{office_id: int, can_take_action: bool, needs_endorsement: bool}>}
     */
    private function validatedRoute(Request $request, ?DocumentRoute $documentRoute = null): array
    {
        $validated = $request->validate([
            'name' => [
                'required',
                'string',
                'max:100',
                Rule::unique('document_routes', 'name')->ignore($documentRoute),
            ],
            'steps' => ['required', 'array', 'min:2', 'max:12'],
            'steps.*' => ['required', 'array:office_id,can_take_action,needs_endorsement'],
            'steps.*.office_id' => ['required', 'integer', 'distinct', Rule::exists('offices', 'id')],
            'steps.*.can_take_action' => ['required', 'boolean'],
            'steps.*.needs_endorsement' => ['required', 'boolean'],
        ], [
            'steps.*.office_id.required' => 'Select an office for each routing step.',
            'steps.*.office_id.exists' => 'Select an available office.',
            'steps.*.office_id.distinct' => 'Each office can only appear once in the routing.',
        ]);

        $steps = [];

        foreach ($validated['steps'] as $step) {
            $steps[] = [
                'office_id' => (int) $step['office_id'],
                'can_take_action' => (bool) $step['can_take_action'],
                'needs_endorsement' => (bool) $step['needs_endorsement'],
            ];
        }

        return [trim($validated['name']), $steps];
    }

    /**
     * @param  list<array{office_id: int, can_take_action: bool, needs_endorsement: bool}>  $steps
     */
    private function replaceSteps(DocumentRoute $documentRoute, array $steps): void
    {
        $offices = Office::query()->whereIn('id', array_column($steps, 'office_id'))->sharedLock()->get()->keyBy('id');

        if ($offices->count() !== count($steps)) {
            throw ValidationException::withMessages(['steps' => 'An office is no longer available. Select another office.']);
        }

        $documentRoute->steps()->delete();

        foreach ($steps as $index => $step) {
            $documentRoute->steps()->create([
                ...$step,
                'name' => $offices[$step['office_id']]->name,
                'position' => $index + 1,
            ]);
        }
    }
}
