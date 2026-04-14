<?php

namespace App\Http\Controllers\Api;

use App\Helpers\AuditHelper;
use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Sale;
use App\Models\UserCard;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Exception;

class CustomerController extends Controller
{
    /**
     * GET /api/customers
     * Paginated list of customer-role users with order/card info.
     */
    public function index(Request $request)
    {
        try {
            $perPage = min((int) ($request->query('per_page', 20)), 50);
            $search  = $request->query('search', '');
            $status  = $request->query('status', 'all');   // all | active | inactive
            $card    = $request->query('card', 'all');     // all | with_card | no_card
            $sort    = $request->query('sort', 'newest');  // newest | oldest | most_orders | top_spender

            $query = User::where('role', 'customer')
                ->select('users.*')
                ->selectRaw('(SELECT COUNT(*) FROM sales WHERE sales.user_id = users.id AND sales.status != ?) as order_count', ['cancelled'])
                ->selectRaw('(SELECT COALESCE(SUM(total_amount), 0) FROM sales WHERE sales.user_id = users.id AND sales.status != ?) as total_spent', ['cancelled']);

            // Search
            if ($search) {
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                      ->orWhere('email', 'like', "%{$search}%");
                });
            }

            // Status filter
            if ($status !== 'all') {
                $query->where('status', strtoupper($status));
            }

            // Card filter
            if ($card === 'with_card') {
                $query->whereHas('activeCard');
            } elseif ($card === 'no_card') {
                $query->whereDoesntHave('activeCard');
            }

            // Sorting
            switch ($sort) {
                case 'oldest':
                    $query->orderBy('created_at', 'asc');
                    break;
                case 'most_orders':
                    $query->orderByRaw('order_count DESC');
                    break;
                case 'top_spender':
                    $query->orderByRaw('total_spent DESC');
                    break;
                default: // newest
                    $query->orderBy('created_at', 'desc');
                    break;
            }

            $paginated = $query->paginate($perPage);

            // Eager load card info for the current page
            $userIds   = $paginated->pluck('id')->toArray();
            $cardMap   = UserCard::whereIn('user_id', $userIds)
                ->where('status', 'active')
                ->join('cards', 'user_cards.card_id', '=', 'cards.id')
                ->select('user_cards.user_id', 'cards.title as card_title', 'user_cards.created_at as purchase_date', 'user_cards.expiry_date')
                ->get()
                ->keyBy('user_id');

            $data = $paginated->map(function ($user) use ($cardMap) {
                $card = $cardMap->get($user->id);
                return [
                    'id'           => $user->id,
                    'name'         => $user->name,
                    'email'        => $user->email,
                    'status'       => $user->status,
                    'order_count'  => (int) $user->order_count,
                    'total_spent'  => (float) $user->total_spent,
                    'has_card'     => (bool) $card,
                    'card_title'   => $card->card_title ?? null,
                    'created_at'   => $user->created_at?->toIso8601String(),
                ];
            });

            return response()->json([
                'success' => true,
                'data'    => $data,
                'meta'    => [
                    'current_page' => $paginated->currentPage(),
                    'last_page'    => $paginated->lastPage(),
                    'per_page'     => $paginated->perPage(),
                    'total'        => $paginated->total(),
                ],
            ]);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve customers',
                'error'   => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * GET /api/customers/stats
     * Summary statistics for customer accounts.
     */
    public function stats()
    {
        try {
            $totalCustomers = User::where('role', 'customer')->count();
            $activeCustomers = User::where('role', 'customer')->where('status', 'ACTIVE')->count();

            $newThisMonth = User::where('role', 'customer')
                ->where('created_at', '>=', now()->startOfMonth())
                ->count();

            $withCards = UserCard::where('status', 'active')
                ->distinct('user_id')
                ->count('user_id');

            $totalRevenue = Sale::whereHas('user', function ($q) {
                    $q->where('role', 'customer');
                })
                ->where('status', '!=', 'cancelled')
                ->sum('total_amount');

            $avgOrderValue = Sale::whereHas('user', function ($q) {
                    $q->where('role', 'customer');
                })
                ->where('status', '!=', 'cancelled')
                ->avg('total_amount');

            return response()->json([
                'success' => true,
                'data'    => [
                    'total'           => $totalCustomers,
                    'active'          => $activeCustomers,
                    'new_this_month'  => $newThisMonth,
                    'with_cards'      => $withCards,
                    'total_revenue'   => round((float) $totalRevenue, 2),
                    'avg_order_value' => round((float) ($avgOrderValue ?? 0), 2),
                ],
            ]);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve customer stats',
                'error'   => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * GET /api/customers/{id}
     * Detailed customer profile with recent orders.
     */
    public function show($id)
    {
        try {
            $user = User::where('role', 'customer')->findOrFail($id);

            // Recent orders (last 20)
            $orders = Sale::where('user_id', $user->id)
                ->orderBy('created_at', 'desc')
                ->limit(20)
                ->select('id', 'invoice_number', 'total_amount', 'status', 'order_type', 'created_at')
                ->get()
                ->map(function ($sale) {
                    return [
                        'id'             => $sale->id,
                        'invoice_number' => $sale->invoice_number,
                        'total_amount'   => (float) $sale->total_amount,
                        'status'         => $sale->status,
                        'order_type'     => $sale->order_type,
                        'created_at'     => $sale->created_at?->toIso8601String(),
                    ];
                });

            // Card info
            $card = UserCard::where('user_id', $user->id)
                ->where('status', 'active')
                ->join('cards', 'user_cards.card_id', '=', 'cards.id')
                ->select('cards.title', 'cards.price', 'user_cards.created_at as purchase_date', 'user_cards.expiry_date', 'user_cards.status')
                ->first();

            // Aggregate stats
            $orderStats = Sale::where('user_id', $user->id)
                ->where('status', '!=', 'cancelled')
                ->selectRaw('COUNT(*) as total_orders, COALESCE(SUM(total_amount), 0) as total_spent')
                ->first();

            return response()->json([
                'success' => true,
                'data'    => [
                    'id'            => $user->id,
                    'name'          => $user->name,
                    'email'         => $user->email,
                    'status'        => $user->status,
                    'created_at'    => $user->created_at?->toIso8601String(),
                    'total_orders'  => (int) ($orderStats->total_orders ?? 0),
                    'total_spent'   => (float) ($orderStats->total_spent ?? 0),
                    'card'          => $card ? [
                        'title'         => $card->title,
                        'price'         => (float) $card->price,
                        'purchase_date' => $card->purchase_date,
                        'expiry_date'   => $card->expiry_date,
                        'status'        => $card->status,
                    ] : null,
                    'recent_orders' => $orders,
                ],
            ]);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Customer not found',
                'error'   => $e->getMessage(),
            ], 404);
        }
    }

    /**
     * PATCH /api/customers/{id}/toggle-status
     * Toggle active/inactive status for a customer.
     */
    public function toggleStatus($id)
    {
        try {
            $user = User::where('role', 'customer')->findOrFail($id);

            $user->status = $user->status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
            $user->save();

            AuditHelper::log('customer', "Toggled customer status: {$user->name}", "New status: {$user->status}");

            return response()->json([
                'success' => true,
                'data'    => [
                    'id'     => $user->id,
                    'status' => $user->status,
                ],
                'message' => "Customer status updated to {$user->status}",
            ]);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to toggle customer status',
                'error'   => $e->getMessage(),
            ], 500);
        }
    }
}
