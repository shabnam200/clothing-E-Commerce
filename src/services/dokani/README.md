# Dokani Cloud adapter (products first)

**Server only.** Never import `services/dokani/*` from a `"use client"` file: it holds the shop login.
The browser only ever receives ready-made AVENOR products, never a Dokani token or password.

## What it does today
`DOKANI_*` in `.env.local` -> the website's products come from the IT lab shop in Dokani Cloud:

```
Dokani Cloud  --(login + Bearer token, kept on the server)-->  client.js
   GET /shops/products , GET /shops/category                     catalog.js  (1 min cache, paging)
                                                                  mapper.js   (Dokani product -> AVENOR product)
                                                                  lib/v2/catalogSource.js -> layout, Shop, Home, Product pages
```
Cart, checkout, orders, wishlist, accounts etc. are still the browser mock (`services/mockApi.js`). While Dokani products are shown, `V2StoreProvider`
tells the mock about them (`registerCatalog`), so the mock cart prices and stock-checks the real Dokani products.

## Which shop? (multi-shop platform)
Every Dokani shop is its own database and has its own login. **The token you get from logging in already belongs to that shop**, so no `shop_id` is sent with API calls.
`DOKANI_SHOP_ID` is a safety check: every Dokani row carries `shop_id`; if it differs from `DOKANI_SHOP_ID` the adapter refuses to serve anything ("Wrong Dokani shop").
IT lab = shop **552**, branch **494** (branch is needed later, when sales are created).

## Setup
1. `.env.local` in the project root (never commit it, never use the `NEXT_PUBLIC_` prefix):
   ```
   DOKANI_BASE_URL=https://app.dokani.cloud/api
   DOKANI_LOGIN=<the IT lab shop admin login>
   DOKANI_PASSWORD=<its password>
   DOKANI_SHOP_ID=552
   DOKANI_BRANCH_ID=494
   ```
2. Restart `next dev` (env files are read at start).
3. Open **http://localhost:3000/api/dokani/health**. It lists the shop it logged in to, the products it sees, stock, photos and any problems in plain words.
4. Open the website: the Shop page shows the Dokani products. If it is empty, look at the terminal running `next dev` (`[catalog] ... failed: <reason>`).

## How a Dokani product becomes an AVENOR product
| AVENOR field | From Dokani |
|---|---|
| `name`, `description`, `sku` | `name`, `description`, `barcode` |
| `price` / `mrp` | `shop_price` / `mrp` (a Dokani discount lowers `price`; `mrp` only shown when higher) |
| `stock` | `stock.stock_amount` (sum of `variants[]` stock when variants are used) |
| `sizes` | `sizes[]` when `is_size`, else the product's single `size` text (`Free` -> `ONE`) |
| `colors` | `colours[]` when `is_colour` |
| `image` / `images` | `cover_image_url` + `feature_image_urls`; none -> a category picture that ships with the site |
| `tags` | `sale` when `mrp > price`; `new` when created in the last 30 days |
| `category` | product name rules, then the Dokani category name (see `config.js`) |
| `genders` | words like men's / women / kids in the category or name; else Men + Women |
| `rating`, `reviews` | none in Dokani (0). Reviews will come from AVENOR's own review API. |

All the guess-lists (category words, gender words) are at the top of `config.js`: edit them when the shop adds new kinds of products.
Inactive products (`status` 0) and services (`is_service`) are hidden.

## Things to know
* **Stock.** A product with no Purchase in Dokani has stock 0 and shows as out of stock. Add a Purchase to test the cart.
* **Photos.** Upload photos in the Dokani product page. Their URLs are on another host, so add it to `next.config.js` -> `images.remotePatterns` (e.g. `app.dokani.cloud`).
* **Variants.** Dokani already has `is_size`, `is_colour`, `sizes[]`, `colours[]`, `variants[]` on a product. They are empty until a product is saved with variants. The mapper reads them leniently (strings or objects with name/size/colour + hex) but the real shape is **unconfirmed**: create one product with sizes and colours in the Dokani panel, open `GET /shops/products` and compare with `mapper.js` -> `variantsOf`.
* **Cache.** Products are cached 60 s per server process (`CATALOG_TTL_MS`). A change in Dokani appears within a minute.
* **Token.** About 22 h in the sample. The adapter logs in on first use, reuses the token and logs in again after a `401`.

## Next phases (not built yet)
1. Customers: mirror a registered shopper to `POST /api/customers`.
2. Checkout: save the order in AVENOR's own database, then create the Dokani sale in one server call (`temporary/sales/new` -> add-product loop -> `check-stock` -> `POST /api/sales`) using `DOKANI_BRANCH_ID`.
3. Orders list / cancel / returns (sale-return flow).

## Tests
`node --import ./src/services/tests/register.mjs src/services/tests/dokani.test.mjs` (39 checks, fake Dokani server with the real response shapes, no network).
