# AVENOR services layer (backend connection)

Every screen gets its data through ONE object: `import { api } from "@/services"`.
Nothing else in the app calls `fetch` or `localStorage` for shop data.

```
UI components / pages
        |
   lib/v2/catalogSource.js, lib/v2/settings.js, V2StoreProvider ...
        |
   services/index.js  ->  api  ──┬──  mockApi.js  (fake server in the browser, default)
                                 └──  httpApi.js  (real Laravel API, when NEXT_PUBLIC_API_URL is set)
                                          |
                                     http.js (fetch, Bearer token, Accept-Language, timeout, errors)
                                     adapters.js (server JSON  <->  UI shapes)
```

## 1. Switching between mock and real

| `NEXT_PUBLIC_API_URL` | Mode |
|---|---|
| empty / not set | **Mock.** A fake server in the browser (`localStorage` key `avenor:mock:db:v1`). No backend needed. |
| `https://api.example.com/api` | **Real.** All calls go to the Laravel API. |

Restart `next dev` after changing `.env.local` (copy `services/.env.example`).
To reset the mock data: `localStorage.removeItem("avenor:mock:db:v1")` in the browser console.

The mock behaves like the real server: it validates input (422), enforces stock / max quantity / the 7-day return window,
calculates prices and totals itself, creates orders, and tracks referral rewards. It answers with the same snake_case JSON
as the real API and goes through the same `adapters.js`, so the UI cannot tell the difference.
A new mock account gets two sample past orders; orders you place move pending -> processing (1 min) -> shipped (5 min) -> delivered (10 min).

## 2. Connecting the supervisor's API (checklist)

1. Set `NEXT_PUBLIC_API_URL` (include the `/api` prefix if the routes have one).
2. Open `httpApi.js`. Every method has a comment `E1`..`E46` that matches the endpoint number in **AVENOR API Specification**.
   Change a path or HTTP verb here only if the real API differs.
3. If a **field name** differs (e.g. `order_number` is `number`), change it in `adapters.js` only (each mapper reads the spec name and a camelCase alias).
4. Run `node --import ./src/services/tests/register.mjs src/services/tests/http.test.mjs` (see section 6) after editing the adapters.
5. Add the API's image host to `next.config` (`images.remotePatterns`) so product photos load.
6. Make sure the API sends CORS headers for the site origin (browser calls: login, cart, checkout...). Server-side calls (catalogue, settings, campaigns) are not affected.
7. Click through: register -> add to cart -> checkout -> account orders -> return request. Errors show as toasts or under the field.

## 3. Methods <-> endpoints

| `api.` method | Endpoint | Used by |
|---|---|---|
| `auth.register / login / logout / me` | E1 POST /auth/register, E2 POST /auth/login, E3 POST /auth/logout, E4 GET /auth/me | login pop-up, Login/Register pages, session restore |
| `catalog.list / listAll / get / related` | E5 GET /products, E6 GET /products/:id, E7 GET /products/:id/related | layout, Shop, Home, Product page |
| `catalog.reviews` | E8 GET /products/:id/reviews | Product page > Reviews tab (list, sort, rating summary, "can I review?") |
| `reviews.create / vote / remove` | E44 POST /products/:id/reviews, E45 PUT /reviews/:id/helpful, E46 DELETE /reviews/:id | Reviews tab: write a review, "Helpful" vote, delete your own review |
| `catalog.categories / genders` | E9, E10 | (available; the pages still use the built-in category lists) |
| `cart.get / add / addOutfit / setQty / remove / clear` | E11 to E16 | cart drawer, cart page, checkout, Build a Look |
| `wishlist.get / add / remove` | E17 to E19 | heart buttons, Wishlist page |
| `priceAlerts.get / savePrefs / enable / disable` | E20 to E23 | bell icons, Wishlist alerts |
| `orders.place / list / requestReturn` | E24 POST /orders, E25 GET /orders, E26 POST /orders/:id/return | Checkout, Account > Orders |
| `orders.get / cancel` | E42 GET /orders/:id, E43 POST /orders/:id/cancel (body `{ reason, note }`) | Order tracking page `/orders/[id]`, Cancel page `/orders/[id]/cancel` |
| `user.profile / updateProfile` | E27, E28 | Account |
| `user.addresses.list / add / setDefault / remove` | E29 to E32 | Account > Addresses |
| `user.sizePassport.get / save / clear` | E33 to E35 | Account > Size passport, "Your size" hints |
| `referrals.me / apply` | E36, E37 | Account > Refer & earn (the sign-up code travels inside `auth.register`) |
| `support.send` | E38 POST /support | Support page |
| `newsletter.subscribe` | E39 | Newsletter box |
| `campaigns.list` | E40 GET /campaigns | festival themes (`lib/v2/campaigns.js`) |
| `settings.get` | E41 GET /settings | delivery fees, limits, payment numbers, districts, support contacts, return window, referral reward |

### Order tracking + cancel (E42, E43)

* `GET /orders/:id` and the orders in `GET /orders` should include `items[]` (`product_id, name, image, size, color, qty, unit_price`) and a status `history[]` = `[{ status, at, note? }]`, oldest first
  (`status` is one of `pending | processing | shipped | delivered | cancelled`, `at` an ISO time). Without `history` the timeline still works from `status`, only the step times are missing.
* For the **order details page** and the **invoice** (`/orders/[id]/details`, `/orders/[id]/invoice`) `GET /orders/:id` should also send:
  `receiver_name`, `receiver_phone`, `receiver_email` (or a `receiver { name, phone, email }` object), `district`, `address`, `note`, `sender_number`, `trx_id`, and `return_request { type, status, reason, note }`.
  Missing fields show as "—" (name / phone / email fall back to the logged-in user). The invoice number is `INV-` + the order number (see `invoiceNo()` in `lib/v2/orders.js`).
* `POST /orders/:id/cancel` must accept `{ reason, note? }` only while the order is `pending` or `processing` (otherwise 422 with `errors.order`), set `status = cancelled`,
  and put `cancelled_at` / `cancel_reason` on the order. For prepaid orders (`payment_method` other than `cod`) set `payment_status = refund_pending`. It returns the updated order.
* The mock server does the same and fills `history` itself (a new order reaches processing after 1 min, shipped after 5 min, delivered after 10 min).

### Product reviews (E8, E44, E45, E46)

A customer can review a product **only after receiving it** (an order of that product with status `delivered`), once per product. The Reviews tab (`components/v2/reviews/`) asks the server for everything, so the rules live in ONE place (the API); the UI only shows what the server says.

* **E8 `GET /products/:id/reviews?page&limit&sort`** (`sort` = `helpful` (default) | `newest` | `highest` | `lowest`). Public, but the app sends the Bearer token when the customer is logged in. Response:
  ```json
  { "data": [ { "id": 11, "name": "Nusrat J.", "rating": 5, "title": "Lovely", "text": "…", "created_at": "2026-09-12T10:00:00+06:00",
                "helpful_count": 4, "voted": true, "mine": false, "verified": true } ],
    "meta": { "page": 1, "limit": 5, "total": 12, "last_page": 3 },
    "summary": { "average": 4.6, "count": 12 },
    "can_review": false, "review_block": "not_purchased" }
  ```
  `voted` / `mine` are about the logged-in customer (false for guests). `review_block` explains `can_review: false`: `login` (guest) | `not_purchased` | `already_reviewed` | `null`. `name` should already be shortened for privacy (e.g. "Rahim U."). `summary` feeds the rating shown under the product title, so it must include the new review at once.
* **E44 `POST /products/:id/reviews`** body `{ rating: 1-5, title?: max 80, text: 10-1000 chars }` -> the created review (same shape as above). 401 guest, **403** `errors.review` when the product was not received, **422** `errors.review` when already reviewed, 422 per field (`rating`, `text`, `title`) for bad input.
* **E45 `PUT /reviews/:id/helpful`** body `{ helpful: true | false }` -> `{ voted, helpful_count }`. Idempotent (the body says the wanted state; one vote per customer). 401 guest, 403 `errors.review` on your own review.
* **E46 `DELETE /reviews/:id`** your own review only (403 otherwise), 204 / empty body. Its votes are removed too.

If a field is named differently, change `toReview` / `toReviewPage` / `toVote` in `adapters.js` only. The unlock rule in the mock is the `REVIEWABLE` list in `mockApi.js` (`["delivered"]`).
Orders page: a delivered order shows **Write a review** under each item, linking to `/product/:id#reviews` (opens the Reviews tab).
Mock accounts start with delivered sample orders of products 1, 2 and 4, so those three can be reviewed straight away; products ordered later unlock about 10 minutes after the order (mock delivery timer).

## 4. How the UI behaves

* **Login session.** The token is kept in `localStorage` (`avenor_token`) and sent as `Authorization: Bearer`. On every page load the app calls `auth.me()`; a dead token is dropped silently. If the API answers **401** during use, `http.js` clears the token and fires `avenor:auth-expired`: the cart is cleared on screen and the login pop-up opens.
* **Continue after login.** If a guest taps "Add to cart", the login pop-up opens; after login the add-to-cart runs by itself.
* **Cart / wishlist / alerts / size passport** live on the server. The screen updates first (optimistic), the call follows, and a failure rolls the screen back and shows the server's message. Cart writes run one after another so quick +/- taps never overlap.
* **Wishlist, cart and price alerts need login.** The heart / bell asks guests to sign in.
* **Money is calculated by the server.** Checkout shows the server's delivery fee (`GET /cart?shipping=`) and the order response total; the browser never sends prices.
* **Settings** (`GET /settings`) override the defaults in `config/v2.js`. If the call fails the defaults are used.
* **Catalogue** is loaded on the server (`lib/v2/catalogSource.js`, cached 60 s) and passed to the client, so SEO and first paint work. The Shop page filters / searches that list itself (including Banglish search) and does not need server-side filtering.

## 5. Errors

All failures throw `ApiError` (`errors.js`): `status` (0 = network), `message`, `errors` (Laravel `{ field: ["msg"] }`), `reason` (e.g. `unknown | own_code | already_used`), and `err.field("email")`.
Forms show `errors` under the matching input; anything else is shown as one message or toast. Server messages should come in the user's language (`Accept-Language: bn|en` is sent on every call).

## 6. Tests (no extra packages)

```
node --import ./src/services/tests/register.mjs src/services/tests/mock.test.mjs   # the mock server rules (106 checks)
node --import ./src/services/tests/register.mjs src/services/tests/http.test.mjs   # real client vs a fake spec-shaped server (35 checks)
```
`http.test.mjs` also proves the adapter output is identical to the built-in catalogue, so nothing changes visually when the real API is connected.
Add `"test:api": "node --import ./src/services/tests/register.mjs src/services/tests/mock.test.mjs && node --import ./src/services/tests/register.mjs src/services/tests/http.test.mjs"` to `package.json` if you want `npm run test:api`.

## 7. Not connected yet (by design)

* Category / gender lists (`categories`, `genders`) exist in the layer but the pages still use the built-in texts.
* Product cards and the shop grid still show the catalogue's own rating / review count; only the product page rating updates live after a new review (the real API's `rating` / `reviews_count` should update too).
* Saved outfits (Build a Look) stay in the browser; a `POST /looks` can be added later.
* Forgot-password / email verification are not in the screens yet.
