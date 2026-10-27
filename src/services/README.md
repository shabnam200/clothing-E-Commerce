# AVENOR services layer (backend connection)

Every screen gets its data through ONE object: `import { api } from "@/services"`.
Nothing else in the app calls `fetch` or browser storage for shop data.

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
| empty / not set | **Mock.** A fake server in this tab (`sessionStorage` key `avenor:mock:db:v1`). No backend needed. |
| `https://api.example.com/api` | **Real.** All calls go to the Laravel API. |

Restart `next dev` after changing `.env.local` (copy `services/.env.example`).
To reset the mock data for this tab: `sessionStorage.removeItem("avenor:mock:db:v1")` in the browser console.

The mock behaves like the real server: it validates input (422), enforces stock / max quantity / the 7-day return window,
calculates prices and totals itself, creates orders, and tracks referral rewards. It answers with the same snake_case JSON
as the real API and goes through the same `adapters.js`, so the UI cannot tell the difference.
A new mock account gets two sample past orders; orders you place move pending -> processing (1 min) -> shipped (5 min) -> delivered (10 min).

## 2. Connecting the supervisor's API (checklist)

1. Set `NEXT_PUBLIC_API_URL` (include the `/api` prefix if the routes have one).
2. Open `httpApi.js`. Every method has a comment `E1`..`E41` that matches the endpoint number in **AVENOR API Specification**.
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
| `catalog.reviews / categories / genders` | E8, E9, E10 | (available; the pages still use built-in demo reviews and category lists) |
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
| `orders.get / cancel` | E42 GET /orders/:id, E43 POST /orders/:id/cancel | order tracking, details, cancel and invoice pages |
| `coupons.validate` | E44 POST /coupons/validate | Checkout "Promo code" box (the order call re-checks the code) |
| `catalog.reviews`, `reviews.create / setHelpful` | E8 GET reviews, E45 POST /products/:id/reviews, E46 PUT / E47 DELETE /reviews/:id/helpful | Product page > Reviews tab (write a review, "Helpful" vote) |

### Order tracking + cancel (E42, E43)

* `GET /orders/:id` and the orders in `GET /orders` should include `items[]` (`product_id, name, image, size, color, qty, unit_price`) and a status `history[]` = `[{ status, at, note? }]`, oldest first
  (`status` is one of `pending | processing | shipped | delivered | cancelled`, `at` an ISO time). Without `history` the timeline still works from `status`, only the step times are missing.
* For the **order details page** and the **invoice** (`/orders/[id]/details`, `/orders/[id]/invoice`) `GET /orders/:id` should also send:
  `receiver_name`, `receiver_phone`, `receiver_email` (or a `receiver { name, phone, email }` object), `district`, `address`, `note`, `sender_number`, `trx_id`, and `return_request { type, status, reason, note }`.
  Missing fields show as "—" (name / phone / email fall back to the logged-in user). The invoice number is `INV-` + the order number (see `invoiceNo()` in `lib/v2/orders.js`).
* `POST /orders/:id/cancel` must accept `{ reason, note? }` only while the order is `pending` or `processing` (otherwise 422 with `errors.order`), set `status = cancelled`,
  and put `cancelled_at` / `cancel_reason` on the order. For prepaid orders (`payment_method` other than `cod`) set `payment_status = refund_pending`. It returns the updated order.
* The mock server does the same and fills `history` itself (a new order reaches processing after 1 min, shipped after 5 min, delivered after 10 min).

## 4. How the UI behaves

* **Login session.** The token is kept in `sessionStorage` (`avenor_token`) and sent as `Authorization: Bearer`. It expires when the tab session ends. On every page load the app calls `auth.me()`; a dead token is dropped silently. If the API answers **401** during use, `http.js` clears the token and fires `avenor:auth-expired`: the cart is cleared on screen and the login pop-up opens.
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
node --import ./src/services/tests/register.mjs src/services/tests/mock.test.mjs   # the mock server rules (66 checks)
node --import ./src/services/tests/register.mjs src/services/tests/http.test.mjs   # real client vs a fake spec-shaped server (28 checks)
```
`http.test.mjs` also proves the adapter output is identical to the built-in catalogue, so nothing changes visually when the real API is connected.
Add `"test:api": "node --import ./src/services/tests/register.mjs src/services/tests/mock.test.mjs && node --import ./src/services/tests/register.mjs src/services/tests/http.test.mjs"` to `package.json` if you want `npm run test:api`.

## 7. Not connected yet (by design)

* Product reviews (`catalog.reviews`) and category / gender lists (`categories`, `genders`) exist in the layer but the pages still use the built-in texts.
* Saved outfits (Build a Look) stay in the browser; a `POST /looks` can be added later.
* Forgot-password / email verification are not in the screens yet.

## 8. Multi-shop backends (Dokani Cloud)

Set `NEXT_PUBLIC_SHOP_ID` and `http.js` sends it on every call as the header `X-Shop-Id`. The backend (adapter) uses it to choose that shop's Dokani login, branch, products and stock.
The browser never holds a Dokani token, password or secret key: those stay in the backend (`.env` or an encrypted `shops` table).

## 9. Guest -> login -> continue

When a guest taps Add to cart, the heart, the price bell or "Helpful" / "Write a review", the login popup opens. After login (or sign-up) the same action runs by itself.
Closing the popup without logging in forgets the action, so it never fires at a later login (`resumeRef` in `V2StoreProvider`).

## 10. Dokani Cloud (products from the shop's real stock)

Set the `DOKANI_*` variables (see `.env.example`) and the website's products come straight from Dokani Cloud, server side. Everything else stays on the mock until its API is connected.
Full guide, field mapping and the open questions: **`services/dokani/README.md`**. Health check: `/api/dokani/health`.
