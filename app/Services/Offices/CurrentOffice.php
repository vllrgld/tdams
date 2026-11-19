<?php

namespace App\Services\Offices;

use App\Models\Document;
use App\Models\Office;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;

class CurrentOffice
{
    public const SESSION_KEY = 'current_office_id';

    public function __construct(private Request $request) {}

    public function id(): ?int
    {
        if (! $this->request->hasSession()) {
            return null;
        }

        $id = $this->request->session()->get(self::SESSION_KEY);

        return is_numeric($id) ? (int) $id : null;
    }

    public function office(): ?Office
    {
        $id = $this->id();

        if ($id === null) {
            return null;
        }

        $office = Office::query()->find($id);

        return $office instanceof Office ? $office : null;
    }

    public function ensure(): ?Office
    {
        if (! $this->request->hasSession()) {
            return null;
        }

        $office = $this->office() ?? Office::query()->orderBy('id')->first();

        if (! $office instanceof Office) {
            return null;
        }

        $this->request->session()->put(self::SESSION_KEY, $office->id);

        return $office;
    }

    public function switch(Office $office): void
    {
        $this->request->session()->put(self::SESSION_KEY, $office->id);
    }

    /**
     * @template TModel of Model
     *
     * @param  Builder<TModel>  $query
     */
    public function constrain(Builder $query): void
    {
        $id = $this->id();

        if ($id !== null) {
            $query->where($query->getModel()->qualifyColumn('office_id'), $id);
            if ($query->getModel() instanceof Document) {
                $query->whereDoesntHave('pendingTransfer');
            }
        }
    }
}
