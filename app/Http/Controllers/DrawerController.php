<?php

namespace App\Http\Controllers;

use App\Models\Drawer;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class DrawerController extends Controller
{
    public function update(Request $request, Drawer $drawer): RedirectResponse
    {
        $validated = $request->validate([
            'label' => ['required', 'string', 'max:100'],
        ]);

        $drawer->update([
            'label' => $validated['label'],
        ]);

        return back();
    }
}
