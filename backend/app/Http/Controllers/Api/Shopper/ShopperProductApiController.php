<?php

namespace App\Http\Controllers\Api\Shopper;

use App\Http\Controllers\Controller;
use App\Http\Resources\Shops\ProductResource;
use App\Models\Shops\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/** Shopper-facing product actions listed in API sheets 2 and 3. */
class ShopperProductApiController extends Controller
{
    public function related(Request $request, $productId)
    {
        $request->validate(['limit' => 'sometimes|integer|min:1|max:50']);
        $shopper = $request->attributes->get('shopper');
        $shopId = $shopper->shop_id ?? data_get($request->input('token_payload'), 'shop_id');
        $product = Product::on('tenant')->where('shop_id', $shopId)->find($productId);
        if (!$product) return response()->json(['message' => 'Product not found.'], 404);

        $query = Product::on('tenant')->where('shop_id', $shopId)
            ->where('id', '<>', $product->id)->where('status', 1);
        if (Schema::connection('tenant')->hasColumn('products', 'web_visible')) $query->where('web_visible', 1);
        if (Schema::connection('tenant')->hasColumn('companies', 'web_visible')) {
            $query->where(function ($brandQuery) {
                $brandQuery->whereNull('company_id')->orWhereHas('company', function ($company) {
                    $company->where('web_visible', 1);
                });
            });
        }
        $query->where(function ($q) use ($product) {
            $q->where('category_id', $product->category_id);
            if ($product->company_id) $q->orWhere('company_id', $product->company_id);
        })->orderBy('id')->limit((int) $request->input('limit', 12));

        $items = $query->get();
        return response()->json(['product_id' => (int) $product->id, 'products' => $items->map(function ($item) {
            $priceVisible = !Schema::connection('tenant')->hasColumn('products', 'price_visible') || (bool) ($item->price_visible ?? true);
            return ['id' => (int) $item->id, 'name' => $item->name, 'display_name' => $item->name,
                'cover_image' => $item->cover_image, 'cover_image_url' => ProductResource::coverUrl($item->cover_image, $item->shop_id), 'price_visible' => $priceVisible, 'can_add_to_cart' => $priceVisible,
                'mrp' => $priceVisible ? $item->mrp : null,
                'shop_price' => $priceVisible ? $item->shop_price : null,
                'whole_sale_price' => $priceVisible ? $item->whole_sale_price : null,
                'category_id' => $item->category_id, 'company_id' => $item->company_id];
        })->values()]);
    }

    public function helpful(Request $request, $productId, $reviewId = null)
    {
        $shopper = $request->attributes->get('shopper');
        $request->validate(['helpful' => 'sometimes|boolean']);
        $reviewId = $reviewId ?: $productId;
        if (!Schema::connection('tenant')->hasTable('review_helpful_votes')) {
            return response()->json(['message' => 'Review helpful-vote storage is not installed for this tenant.'], 503);
        }
        $review = DB::connection('tenant')->table('product_reviews')->where('id', $reviewId)
            ->where('shop_id', $shopper->shop_id)->first();
        if ($review && func_num_args() >= 3 && (int) $review->product_id !== (int) $productId) $review = null;
        if (!$review) return response()->json(['message' => 'Review not found.'], 404);

        $votes = DB::connection('tenant')->table('review_helpful_votes');
        $existing = (clone $votes)->where('review_id', $reviewId)->where('shopper_id', $shopper->id)->first();
        $helpful = $request->has('helpful') ? $request->boolean('helpful') : !$existing;
        if ($helpful && !$existing) {
            $votes->insert(['shop_id' => $shopper->shop_id, 'review_id' => $reviewId,
                'shopper_id' => $shopper->id, 'created_at' => now(), 'updated_at' => now()]);
        } elseif (!$helpful && $existing) {
            $votes->where('review_id', $reviewId)->where('shopper_id', $shopper->id)->delete();
        }
        $count = (clone $votes)->where('review_id', $reviewId)->count();
        DB::connection('tenant')->table('product_reviews')->where('id', $reviewId)->update(['helpful_count' => $count]);
        return response()->json(['review_id' => (int) $reviewId, 'helpful' => $helpful, 'helpful_count' => $count]);
    }

    public function deleteReview(Request $request, $reviewId)
    {
        $shopper = $request->attributes->get('shopper');
        if (!Schema::connection('tenant')->hasTable('product_reviews')) return response()->json(['message' => 'Review storage is not installed for this tenant.'], 503);
        $deleted = DB::connection('tenant')->table('product_reviews')->where('id', $reviewId)
            ->where('shop_id', $shopper->shop_id)->where('shopper_id', $shopper->id)->delete();
        if (!$deleted) return response()->json(['message' => 'Review not found or does not belong to you.'], 404);
        if (Schema::connection('tenant')->hasTable('review_helpful_votes')) DB::connection('tenant')->table('review_helpful_votes')->where('review_id', $reviewId)->delete();
        return response()->json(['message' => 'Review deleted successfully.']);
    }

    public function createAlert(Request $request, $productId)
    {
        $shopper = $request->attributes->get('shopper');
        $request->validate(['target_price' => 'required|numeric|min:0']);
        if (Schema::connection('tenant')->hasTable('storefront_settings')) {
            $toggleValue = DB::connection('tenant')->table('storefront_settings')
                ->where('shop_id', $shopper->shop_id)->where('setting_key', 'feature_toggles')->value('setting_value');
            $toggles = is_string($toggleValue) ? json_decode($toggleValue, true) : $toggleValue;
            if (is_array($toggles) && array_key_exists('price_drop_alerts', $toggles) && !$toggles['price_drop_alerts']) {
                return response()->json(['message' => 'Wishlist price alerts are disabled for this shop.'], 403);
            }
        }
        $product = Product::on('tenant')->where('shop_id', $shopper->shop_id)->find($productId);
        if (!$product) return response()->json(['message' => 'Product not found.'], 404);
        if (!Schema::connection('tenant')->hasTable('alerts')) return response()->json(['message' => 'Alert storage is not installed for this tenant.'], 503);
        $price = $product->shop_price ?: $product->mrp;
        $table = DB::connection('tenant')->table('alerts');
        $row = ['shop_id' => $shopper->shop_id, 'shopper_id' => $shopper->id, 'product_id' => $product->id,
            'type' => 'price_drop', 'target_price' => $request->target_price, 'status' => 1,
            'created_at' => now(), 'updated_at' => now()];
        $hasReferencePrice = Schema::connection('tenant')->hasColumn('alerts', 'reference_price');
        if ($hasReferencePrice) $row['reference_price'] = $price;
        $updates = ['target_price' => $request->target_price, 'status' => 1, 'updated_at' => now()];
        if ($hasReferencePrice) $updates['reference_price'] = $price;
        $existing = (clone $table)->where('shop_id', $shopper->shop_id)->where('shopper_id', $shopper->id)
            ->where('product_id', $product->id)->where('type', 'price_drop')->first();
        if ($existing) {
            $table->where('id', $existing->id)->update($updates);
            $id = $existing->id;
        } else $id = $table->insertGetId($row);
        return response()->json(['message' => 'Price alert saved.', 'id' => (int) $id, 'product_id' => (int) $product->id,
            'target_price' => (float) $request->target_price, 'reference_price' => (float) $price], $existing ? 200 : 201);
    }

    public function notify(Request $request, $productId)
    {
        $shopper = $request->attributes->get('shopper');
        if (!$shopper->email || !filter_var($shopper->email, FILTER_VALIDATE_EMAIL)) {
            return response()->json(['message' => 'Add a valid email to your account to receive back-in-stock alerts.'], 422);
        }
        if (Schema::connection('tenant')->hasTable('storefront_settings')) {
            $raw = DB::connection('tenant')->table('storefront_settings')->where('shop_id', $shopper->shop_id)->where('setting_key', 'feature_toggles')->value('setting_value');
            $toggles = is_string($raw) ? json_decode($raw, true) : $raw;
            if (is_array($toggles) && array_key_exists('price_drop_alerts', $toggles) && !$toggles['price_drop_alerts']) return response()->json(['message' => 'Wishlist alerts are disabled for this shop.'], 403);
        }
        $product = Product::on('tenant')->where('shop_id', $shopper->shop_id)->find($productId);
        if (!$product) return response()->json(['message' => 'Product not found.'], 404);
        if (!Schema::connection('tenant')->hasTable('alerts')) return response()->json(['message' => 'Alert storage is not installed for this tenant.'], 503);
        $stock = DB::connection('tenant')->table('stocks')->where('shop_id', $shopper->shop_id)->where('product_id', $product->id)->sum('stock_amount');
        if ($stock > 0) return response()->json(['message' => 'This product is already in stock.', 'in_stock' => true], 409);
        $table = DB::connection('tenant')->table('alerts');
        $existing = (clone $table)->where('shop_id', $shopper->shop_id)->where('shopper_id', $shopper->id)
            ->where('product_id', $product->id)->where('type', 'back_in_stock')->where('status', 1)->first();
        if (!$existing) $id = $table->insertGetId(['shop_id' => $shopper->shop_id, 'shopper_id' => $shopper->id,
            'product_id' => $product->id, 'type' => 'back_in_stock', 'target_price' => null,
            'status' => 1, 'created_at' => now(), 'updated_at' => now()]);
        else $id = $existing->id;
        return response()->json(['message' => 'Back-in-stock notification saved.', 'id' => (int) $id,
            'product_id' => (int) $product->id, 'already_subscribed' => (bool) $existing], $existing ? 200 : 201);
    }

    public function deleteProductAlert(Request $request, $productId)
    {
        $shopper = $request->attributes->get('shopper');
        $deleted = $this->deleteAlerts($shopper, ['product_id' => $productId, 'type' => 'price_drop']);
        return $deleted ? response()->json(['message' => 'Price alert deleted.']) : response()->json(['message' => 'Price alert not found.'], 404);
    }

    public function deleteNotify(Request $request, $productId)
    {
        $shopper = $request->attributes->get('shopper');
        $deleted = $this->deleteAlerts($shopper, ['product_id' => $productId, 'type' => 'back_in_stock']);
        return $deleted ? response()->json(['message' => 'Back-in-stock notification deleted.']) : response()->json(['message' => 'Notification not found.'], 404);
    }

    public function deleteAlert(Request $request, $alertId)
    {
        $shopper = $request->attributes->get('shopper');
        $deleted = $this->deleteAlerts($shopper, ['id' => $alertId]);
        return $deleted ? response()->json(['message' => 'Alert deleted.']) : response()->json(['message' => 'Alert not found.'], 404);
    }

    private function deleteAlerts($shopper, array $where): int
    {
        if (!Schema::connection('tenant')->hasTable('alerts')) return 0;
        return DB::connection('tenant')->table('alerts')->where('shop_id', $shopper->shop_id)
            ->where('shopper_id', $shopper->id)->where($where)->delete();
    }
}
