<?php

namespace App\Http\Resources\Shops;

use App\Services\DateService;
use App\Support\ProductSupport;
use App\Support\CloudImageStorage;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;

class ProductResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @param \Illuminate\Http\Request $request
     *
     * @return array
     */
    public function toArray($request)
    {
        // Storefront catalog reads explicitly pass web_visible=1. Keep staff/POS
        // product reads unchanged while withholding every sell price on the website.
        $hasPriceVisibility = Schema::connection($this->getConnectionName())->hasColumn('products', 'price_visible');
        $priceVisible = !$hasPriceVisibility || (bool) ($this->price_visible ?? true);
        $hidePrice = $request->boolean('web_visible') && !$priceVisible;
        $totalStock = $this->getTotalStock();
        $branchId = data_get($request, 'token_payload.branch_id') ?? (auth()->user()->branch_id ?? null);
        
        // Status logic: in_stock / low / out (from stock_amount and alarming_stock)
        $alarming = $this->alarming_stock ?? 0;
        $stockStatus = 'out';
        if ($totalStock > $alarming) {
            $stockStatus = 'in_stock';
        } elseif ($totalStock > 0 && $totalStock <= $alarming) {
            $stockStatus = 'low';
        }

        // Clean display name (without size appended)
        $cleanName = $this->name;
        if ($this->size) {
            $cleanName = trim(preg_replace('/(?:\s*-\s*|\s+)' . preg_quote($this->size, '/') . '$/i', '', $this->name));
        }

        $data = [
            'id'                => $this->id,
            'name'              => $this->name,
            'display_name'      => $cleanName, // Shared
            'model'             => $this->model,
            'size'              => $this->size,
            'unit_id'           => $this->unit_id,
            'company_id'        => $this->company_id,
            'category_id'       => $this->category_id,
            'barcode'           => $this->barcode,
            'description'       => $this->description,
            'created_at'        => DateService::getDate($this->created_at),
            'avg_buy_price'     => empty($this->avg_buy_price) ? 0 : $this->avg_buy_price,
            'last_buy_price'    => empty($this->last_buy_price) ? 0 : $this->last_buy_price,
            'status'            => $this->status,
            'web_visible'       => (bool) ($this->web_visible ?? 1), // Shared
            'price_visible'     => $priceVisible,
            'can_add_to_cart'   => $priceVisible,
            'is_service'        => $this->is_service,
            'has_serial_no'     => $this->has_serial_no,
            'has_vat'           => $this->has_vat,
            'vat_percentage'    => $this->vat_percentage,
            'has_discount'      => $this->has_discount,
            'discount_type'     => $this->discount_type,
            'discount_value'    => $this->discount_value,
            'cover_image'       => $this->cover_image,
            'cover_image_url'   => $this->getCoverImageUrl(),
            'feature_images'    => $this->getFeatureImageNames(),
            'feature_image_urls' => $this->getFeatureImageUrls(),
            'color_image_urls'  => $this->getColorImageUrls(),
            'pack_per_box'      => empty($this->pack_per_box) ? 0 : $this->pack_per_box,
            'pice_per_pack'     => empty($this->pice_per_pack) ? 0 : $this->pice_per_pack,
            'warranty'          => ProductSupport::getWarranty($this->warranty_duration),
            'warranty_duration' => $this->warranty_duration,
            'alarming_stock'    => $alarming,
            'mrp'               => $hidePrice ? null : (empty($this->mrp) ? 0 : $this->mrp),
            'whole_sale_price'  => $hidePrice ? null : (empty($this->whole_sale_price) ? 0 : $this->whole_sale_price),
            'shop_price'        => $hidePrice ? null : (empty($this->shop_price) ? 0 : $this->shop_price),
            
            // Rating and Reviews (Shared)
            'rating'            => (float) ($this->rating ?? 0),
            'review_count'      => (int) ($this->review_count ?? 0),
            
            // AVENOR Only Fields
            'gender_id'         => $this->gender_id ?? null,
            'gender'            => $this->gender ?? null,
            'material'          => $this->material ?? null,
            'fit'               => $this->fit ?? null,
            'care'              => $this->care ?? null,
            
            // FRESHLY Only Fields
            'sub_category_id'   => $this->sub_category_id ?? null,
            'kind'              => $this->kind ?? null, // weight / piece
            'subscribable'      => (bool) ($this->subscribable ?? 0),
            'fallback_icon'     => $this->fallback_icon ?? null,
            'colour_tint'       => $this->colour_tint ?? null,
            'near_expiry_status'=> $this->getNearExpiryStatus(),
            'sold_today'        => (int) ($this->sold_today ?? 0),
            'sold_total'        => (int) ($this->sold_total ?? 0),

            'category'          => [
                'id'   => $this->category->id ?? '',
                'name' => $this->category->name ?? '',
            ],
            'company' => [
                'id'   => $this->company->id ?? '',
                'name' => $this->company->name ?? '',
                'logo' => $this->company->logo ?? null, // AVENOR: Brand Logo
            ],
            'unit' => [
                'id'   => $this->unit->id ?? '',
                'name' => $this->unit->name ?? '',
                'short_name' => $this->unit->short_name ?? null, // FRESHLY short unit (kg / pc)
            ],
            'stock' => [
                'stock_amount' => (float) $totalStock,
                'status'       => $stockStatus, // Shared status (in_stock/low/out)
            ],
            'batch_enabled'     => $this->batch_enabled,
            'stock_flow'        => $this->stock_flow ?? 'fifo',
            'running_batch_no'  => $this->running_batch_no,
            'expiry_enabled'    => $this->expiry_enabled,
            'expiry_date'       => $this->expiry_date ? $this->expiry_date->format('Y-m-d') : null,
            'is_size'           => (bool) $this->is_size,
            'is_colour'         => (bool) $this->is_colour,
            'variant_status'    => (int) $this->variant_status,
            
            // Serial Nos (Original)
            'serial_nos'        => $this->has_serial_no
                ? ($this->relationLoaded('serial_nos') && $this->serial_nos
                    ? $this->serial_nos->map(function($sn) {
                        return [
                            'serial_no' => $sn->serial_no,
                            'id'        => $sn->id,
                            'status'    => $sn->status,
                            'branch_id' => $sn->branch_id,
                            'stock_id'  => $sn->stock_id,
                        ];
                    })->values()->toArray()
                    : [])
                : [],
        ];

        // Active sizes only
        if ($this->relationLoaded('sizes') && $this->sizes) {
            $data['sizes'] = $this->sizes->where('status', 1)->map(function($size) {
                return [
                    'id'     => $size->id,
                    'size'   => $size->size,
                ];
            })->values()->toArray();
        } else {
            $data['sizes'] = [];
        }

        // Active colours only + colour hex (AVENOR)
        if ($this->relationLoaded('colours') && $this->colours) {
            $data['colours'] = $this->colours->where('status', 1)->map(function($colour) {
                return [
                    'id'      => $colour->id,
                    'colour'  => $colour->colour,
                    'hex'     => $colour->hex ?? null, // AVENOR
                ];
            })->values()->toArray();
        } else {
            $data['colours'] = [];
        }

        // Variants with stock
        if ($this->relationLoaded('variants') && $this->variants) {
            $data['variants'] = $this->variants->where('status', 1)->map(function($variant) use ($branchId, $hidePrice) {
                $variantStock = 0;
                if ($variant->id) {
                    $stockQuery = \App\Models\Shops\Stock::on($this->getConnectionName())
                        ->where('product_id', $this->id)
                        ->where('variant_id', $variant->id)
                        ->whereNull('deleted_at');
                    if ($branchId) {
                        $stockQuery->where('branch_id', $branchId);
                    }
                    $variantStock = $stockQuery->sum('stock_amount');
                }

                return [
                    'id'                => $variant->id,
                    'size_id'           => $variant->size_id,
                    'colour_id'         => $variant->colour_id,
                    'name'              => $variant->name,
                    'size'              => $variant->size->size ?? null,
                    'colour'            => $variant->colour->colour ?? null,
                    'avg_buy_price'     => (float) $variant->avg_buy_price,
                    'last_buy_price'    => (float) $variant->last_buy_price,
                    'mrp'               => $hidePrice ? null : (float) $variant->mrp,
                    'whole_sale_price'  => $hidePrice ? null : (float) $variant->whole_sale_price,
                    'shop_price'        => $hidePrice ? null : (float) $variant->shop_price,
                    'barcode'           => $variant->barcode,
                    'status'            => (bool) $variant->status,
                    'total_stock'       => (float) $variantStock,
                ];
            })->values()->toArray();
        } else {
            $data['variants'] = [];
        }
        
        // Include batch_infos if loaded (Original)
        if ($this->relationLoaded('batch_infos') && $this->batch_infos) {
            $data['batch_infos'] = $this->batch_infos->map(function($batch) use ($hidePrice) {
                return [
                    'id'                  => $batch->id,
                    'batch_no'            => $batch->batch_no,
                    'variant_id'          => $batch->variant_id,
                    'variant_name'        => $batch->variant ? $batch->variant->name : null,
                    'size'                => $batch->variant && $batch->variant->size ? $batch->variant->size->size : null,
                    'colour'              => $batch->variant && $batch->variant->colour ? $batch->variant->colour->colour : null,
                    'size_id'             => $batch->size_id,
                    'colour_id'           => $batch->colour_id,
                    'supplier_id'         => $batch->supplier_id,
                    'purchased_from'      => $batch->purchased_from,
                    'avg_buy_price'       => $batch->avg_buy_price,
                    'last_buy_price'      => $batch->last_buy_price,
                    'mrp'                 => $hidePrice ? null : $batch->mrp,
                    'whole_sale_price'    => $hidePrice ? null : $batch->whole_sale_price,
                    'shop_price'          => $hidePrice ? null : $batch->shop_price,
                    'expiry_date'         => $batch->expiry_date ? $batch->expiry_date->format('Y-m-d') : null,
                    'purchase_date'       => $batch->purchase_date ? $batch->purchase_date->format('Y-m-d') : null,
                    'purchase_quantity'   => $batch->purchase_quantity,
                    'available_quantity'  => $batch->available_quantity,
                    'status'              => $batch->status,
                ];
            })->values()->toArray();
        }

        return $data;
    }

    /**
     * Calculate total stock across all batches for this product
     */
    private function getTotalStock(): float
    {
        $branchId = data_get(request(), 'token_payload.branch_id') ?? (auth()->user()->branch_id ?? null);
        $query = \App\Models\Shops\Stock::on($this->getConnectionName())
            ->where('product_id', $this->id)
            ->whereNull('deleted_at');
        if ($branchId) {
            $query->where('branch_id', $branchId);
        }
        return (float) $query->sum('stock_amount');
    }

    /** Return the nearest active batch's expiry state (30 day warning window). */
    private function getNearExpiryStatus(): ?string
    {
        $expiryDates = collect();
        if ($this->relationLoaded('batch_infos')) {
            $expiryDates = $this->batch_infos
                ->where('status', 1)
                ->where('available_quantity', '>', 0)
                ->pluck('expiry_date')
                ->filter();
        }

        $expiryDate = $expiryDates->sort()->first();
        if (!$expiryDate && $this->expiry_date) {
            $expiryDate = $this->expiry_date;
        }
        if (!$expiryDate) {
            return null;
        }

        $daysRemaining = now()->startOfDay()->diffInDays(\Illuminate\Support\Carbon::parse($expiryDate)->startOfDay(), false);
        if ($daysRemaining < 0) {
            return 'expired';
        }
        return $daysRemaining <= 30 ? 'near_expiry' : 'normal';
    }

    /**
     * Get the full GCS URL for the cover image
     */
    private function getCoverImageUrl(): ?string
    {
        return self::coverUrl($this->cover_image, $this->shop_id);
    }

    /**
     * Same cover-image URL rules as getCoverImageUrl(), usable without building a whole resource
     * (the storefront "related products" list needs the real URL, not the raw stored file name).
     */
    public static function coverUrl($coverImage, $shopId): ?string
    {
        if (!$coverImage) {
            return null;
        }

        if (filter_var($coverImage, FILTER_VALIDATE_URL)) {
            return $coverImage;
        }

        if (strpos($coverImage, 'local:') === 0) {
            return Storage::disk('public')->url(substr($coverImage, 6));
        }

        if (!$shopId) {
            return null;
        }

        return CloudImageStorage::url('shops/' . $shopId . '/products/cover/' . $coverImage);
    }

    private function getFeatureImageEntries(): array
    {
        $images = $this->feature_images;
        if (is_string($images)) $images = json_decode($images, true);
        return is_array($images) ? $images : [];
    }

    private function resolveFeatureImageUrl($path): ?string
    {
        if (!is_string($path) || $path === '') {
            return null;
        }
        if (filter_var($path, FILTER_VALIDATE_URL)) {
            return $path;
        }
        if (strpos($path, 'local:') === 0) {
            return Storage::disk('public')->url(substr($path, 6));
        }
        if (!$this->shop_id) {
            return null;
        }

        return CloudImageStorage::url('shops/' . $this->shop_id . '/products/feature/' . $path);
    }

    private function getFeatureImageNames(): array
    {
        return array_values(array_filter(array_map(function ($image) {
            return is_array($image) ? ($image['image'] ?? null) : $image;
        }, $this->getFeatureImageEntries())));
    }

    private function getFeatureImageUrls(): array
    {
        return array_values(array_filter(array_map(function ($image) {
            $path = is_array($image) ? ($image['image'] ?? null) : $image;
            return $this->resolveFeatureImageUrl($path);
        }, $this->getFeatureImageEntries())));
    }

    private function getColorImageUrls(): array
    {
        $mapped = [];
        foreach ($this->getFeatureImageEntries() as $image) {
            if (!is_array($image) || empty($image['color']) || empty($image['image'])) continue;
            $url = $this->resolveFeatureImageUrl($image['image']);
            if ($url) $mapped[trim($image['color'])][] = $url;
        }
        return $mapped;
    }
    /**
     * Check if an image exists in GCS
     */
    private function imageExists(string $imageName, string $type = 'cover'): bool
    {
        if (!$this->shop_id) {
            return false;
        }

        $path = 'shops/' . $this->shop_id . '/products/' . $type . '/' . $imageName;

        try {
            return Storage::disk('gcs')->exists($path);
        } catch (\Exception $e) {
            return false;
        }
    }
}
