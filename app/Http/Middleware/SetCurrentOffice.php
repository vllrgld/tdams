<?php

namespace App\Http\Middleware;

use App\Services\Offices\CurrentOffice;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class SetCurrentOffice
{
    public function __construct(private CurrentOffice $currentOffice) {}

    /**
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        if ($request->user() !== null && $request->hasSession()) {
            $this->currentOffice->ensure();
        }

        return $next($request);
    }
}
