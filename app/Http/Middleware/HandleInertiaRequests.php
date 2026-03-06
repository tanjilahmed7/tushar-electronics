<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Inertia\Middleware;
use Symfony\Component\HttpFoundation\Response;

class HandleInertiaRequests extends Middleware
{
    /**
     * Route names that display SIM balance or transaction data; responses must not be cached
     * so balance updates are always visible after navigation.
     *
     * @var list<string>
     */
    private const NO_CACHE_ROUTES = [
        'dashboard',
        'sims.index',
        'sims.create',
        'sims.show',
        'sims.edit',
        'transactions.index',
        'transactions.create',
        'transactions.edit',
        'commission.index',
    ];

    public function handle(Request $request, \Closure $next): Response
    {
        $response = parent::handle($request, $next);

        if (
            $response instanceof Response
            && $response->getStatusCode() === 200
            && $request->route()
            && in_array($request->route()->getName(), self::NO_CACHE_ROUTES, true)
        ) {
            $response->headers->set('Cache-Control', 'no-store, no-cache, must-revalidate');
            $response->headers->set('Pragma', 'no-cache');
        }

        return $response;
    }

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
        return [
            ...parent::share($request),
            'name' => config('app.name'),
            'auth' => [
                'user' => $request->user(),
            ],
            'sidebarOpen' => ! $request->hasCookie('sidebar_state') || $request->cookie('sidebar_state') === 'true',
            'flash' => [
                'status' => $request->session()->get('status'),
            ],
        ];
    }
}
