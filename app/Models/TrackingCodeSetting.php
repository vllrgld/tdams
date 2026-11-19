<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

/** @property string $prefix */
#[Fillable(['prefix'])]
class TrackingCodeSetting extends Model
{
    public static function current(): self
    {
        return static::query()->findOrFail(1);
    }
}
