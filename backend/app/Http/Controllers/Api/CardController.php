    <?php
    namespace App\Http\Controllers\Api;
    use App\Http\Controllers\Controller;
    use App\Models\Card;
    use Illuminate\Http\Request;
    use Illuminate\Support\Facades\Storage;

    class CardController extends Controller
    {
        // ── PUBLIC: Flutter app fetches this ─────────────────────────────────────
        // GET /api/cards
        // Returns all active cards ordered by sort_order then created_at
        public function index()
        {
            $cards = Card::where('is_active', true)
                ->orderBy('sort_order', 'asc')
                ->orderBy('created_at', 'asc')
                ->get()
                ->map(fn($card) => [
                    'id'         => $card->id,
                    'title'      => $card->title,
                    'image_url'  => $card->image_url,   // full URL returned
                    'price'      => number_format($card->price, 0),
                    'price_raw'  => (float) $card->price,
                    'is_active'  => (bool) $card->is_active,
                    'available_months' => $card->available_months, // null = always available
                ]);

            return response()->json([
                'success' => true,
                'data'    => $cards,
            ]);
        }

        // ── ADMIN: Get all cards including inactive ───────────────────────────────
        // GET /api/admin/cards
        public function adminIndex()
        {
            $cards = Card::orderBy('sort_order', 'asc')
                ->orderBy('created_at', 'asc')
                ->get();

            return response()->json(['success' => true, 'data' => $cards]);
        }

        // ── ADMIN: Create new card ────────────────────────────────────────────────
        // POST /api/admin/cards
        public function store(Request $request)
        {
            $request->validate([
                'title'            => 'required|string|max:100',
                'price'            => 'required|numeric|min:0',
                'image'            => 'nullable|image|mimes:jpg,jpeg,png,webp|max:4096',
                'is_active'        => 'boolean',
                'sort_order'       => 'integer',
                'available_months' => 'nullable|string', // e.g. "2" or "3,4,5"
            ]);

            $imageUrl = null;
            if ($request->hasFile('image')) {
                $path     = $request->file('image')->store('cards', 'public');
                $imageUrl = Storage::url($path);           // /storage/cards/xxx.png
                // Prepend your full domain so the app gets a ready-to-use URL
                $imageUrl = config('app.url') . $imageUrl;
            }

            $card = Card::create([
                'title'            => $request->title,
                'price'            => $request->price,
                'image'            => $imageUrl ?? 'cards/default.png',
                'is_active'        => $request->boolean('is_active', true),
                'sort_order'       => $request->integer('sort_order', 0),
                'available_months' => $request->available_months,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Card created successfully.',
                'data'    => $card,
            ], 201);
        }

        // ── ADMIN: Update card (price, title, image, availability) ───────────────
        // POST /api/admin/cards/{id}   (use POST with _method=PUT for multipart)
        public function update(Request $request, $id)
        {
            $card = Card::findOrFail($id);

            $request->validate([
                'title'            => 'sometimes|string|max:100',
                'price'            => 'sometimes|numeric|min:0',
                'image'            => 'nullable|image|mimes:jpg,jpeg,png,webp|max:4096',
                'is_active'        => 'boolean',
                'sort_order'       => 'integer',
                'available_months' => 'nullable|string',
            ]);

            // Replace image if a new one is uploaded
            if ($request->hasFile('image')) {
                $path     = $request->file('image')->store('cards', 'public');
                $imageUrl = config('app.url') . Storage::url($path);
                $card->image = $imageUrl;
            }

            $card->fill($request->only([
                'title', 'price', 'is_active', 'sort_order', 'available_months',
            ]));
            $card->save();

            return response()->json([
                'success' => true,
                'message' => 'Card updated successfully.',
                'data'    => $card,
            ]);
        }

        // ── ADMIN: Toggle active/inactive ────────────────────────────────────────
        // PATCH /api/admin/cards/{id}/toggle
        public function toggle($id)
        {
            $card            = Card::findOrFail($id);
            $card->is_active = !$card->is_active;
            $card->save();

            return response()->json([
                'success'   => true,
                'message'   => 'Card ' . ($card->is_active ? 'activated' : 'deactivated') . '.',
                'is_active' => $card->is_active,
            ]);
        }

        // ── ADMIN: Delete card ────────────────────────────────────────────────────
        // DELETE /api/admin/cards/{id}
        public function destroy($id)
        {
            $card = Card::findOrFail($id);
            $card->delete();

            return response()->json([
                'success' => true,
                'message' => 'Card deleted.',
            ]);
        }
    }