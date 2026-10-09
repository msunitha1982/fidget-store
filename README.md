# Fidget Store

Frontend prototype for a small student-run shop selling 3D-printed fidgets
(see [`PROJECT_BRIEF.md`](PROJECT_BRIEF.md)).

Customers browse → spin each fidget in a live 3D preview → pick a color for every part →
submit an order → **pay cash in person**. There is no online payment anywhere.
The owner gets an admin for orders (what to print, status) and products (no code needed).

## Run it

```bash
npm install
npm run dev        # http://localhost:5173
```

### See the latest changes

From the `fidget-store` folder, after new commits are pushed:

```bash
npm run update     # = git pull && npm install
npm run dev        # then open http://localhost:5173
```

If `npm run dev` is already running, `git pull` alone is enough — the open page reloads
by itself (restart `npm run dev` only if `package.json` changed). `git log --oneline -5`
lists the most recent changes.

| Command | What it does |
| --- | --- |
| `npm run update` | Get the latest code and dependencies |
| `npm run dev` | Dev server with hot reload |
| `npm run build` | Typecheck + production build into `dist/` |
| `npm run preview` | Serve the production build |
| `npm test` | Unit tests for cart, configuration, print queue, validation |

Stack: Vite, React 18, TypeScript, React Router, Three.js. No backend yet.

Look: five pinks (`#ee6969` → `#fde0e0`) plus black on white, defined once in
`src/styles/tokens.css`. Font is SF Pro from the visitor's machine (built into Apple
devices); other systems fall back to their own system font.

## Pages

| Route | Page |
| --- | --- |
| `/` | Storefront: live 3D hero, product grid, how ordering works |
| `/products/:slug` | Product: 3D viewer, part legend, color options, quantity, add to order |
| `/order` | Order review: quantities, remove, change colors, total |
| `/order/details` | Customer details (name, email, optional note) → **Submit order** |
| `/order/confirmed/:number` | Confirmation with order number and cash-payment explanation |
| `/admin/orders` | "To print" queue + all orders with status filter and status change |
| `/admin/orders/:number` | One order: print list, customer, cash to collect, NEW → PRINTING → READY → COMPLETED |
| `/admin/products` | Product list with show/hide switch |
| `/admin/products/new`, `/admin/products/:id` | Add / edit product: basics, photos, 3D model upload, color options, visibility, live preview |

The admin is linked from the shop footer ("Owner admin"). It has **no sign-in yet**.

## How it's put together

```
src/
  config/site.ts        Business details not decided yet ([placeholders]) — edit here
  types.ts              Product, OptionGroup, ModelSource, Order …
  data/seed.ts          SAMPLE products and orders (realistic placeholders)
  lib/api.ts            Mock API (async, localStorage). Swap for real HTTP calls.
  lib/cart.tsx          Cart state (persisted in localStorage)
  lib/product.ts        Selections → part colors, order snapshots, publish checks
  lib/orders.ts         Print queue grouping, status steps
  three/                3D: model loading, scene, thumbnails, temporary placeholder shapes
  components/           ModelViewer, OptionGroupPicker, ProductCard, CashNote …
  pages/shop, pages/admin
```

**Data-driven products.** Everything on a product page comes from the `Product` record:
`parts` (pieces of the model), `optionGroups` (a customer-facing choice like "Primary"
that colors one or more parts, with its list of colors), price, description, photos,
`published`. Edits in the admin show up in the shop immediately.

**Orders** store a snapshot of names, prices and chosen colors, so later product edits
don't change past orders. Prices are re-read from the catalog on submit, not taken from
the cart.

### 3D preview

`ModelViewer` is a real WebGL viewer (Three.js + OrbitControls): drag to orbit,
scroll/pinch or buttons to zoom, rotate buttons, reset, keyboard (arrows, +/−, 0).
Part colors update instantly; hovering an option group dims the other parts so it's
obvious which selector colors which part.

Geometry comes from one function, `three/loadModel.ts`, driven by `product.model`:

```ts
{ kind: 'placeholder', shape: 'tri-spinner' }                     // TEMPORARY procedural model
{ kind: 'stl', upAxis: 'z', files: [{ partId, name, url | fileId }] } // real STL files
```

- Every product currently uses a **temporary placeholder model** (labelled "Placeholder
  model" in the viewer). Uploading STL files in the admin replaces it — one file per
  colorable part. Models are centered and scaled automatically; Z-up STLs are rotated.
- `url` is for files served by a backend or `public/`; `fileId` is for uploads stored in
  the browser (IndexedDB) by this prototype.
- Once real files exist, `three/placeholders.ts` can be deleted.
- Lists and cards use still renders from one shared WebGL context (`three/snapshot.ts`)
  instead of dozens of live viewers.
- How multi-part models will be split is still open — the UI only depends on named
  parts and which option group colors them.

## Order emails

Every submitted order is emailed to the owner (`ownerEmail` in `src/config/site.ts`,
currently `1071195@lwsd.org`) with the order number, customer, each item with its colors,
pieces to print, the cash total and a link to the order in the admin. Replying to the email
replies to the customer.

The email is sent from the customer's browser through [FormSubmit](https://formsubmit.co)
(free, no account). **One-time setup:** the first order triggers an "Activate" email from
FormSubmit to the owner address — click it once; after that every order arrives. If an email
fails, the order is still saved and the admin order page shows **Resend email**.

## Admin password

`/admin` asks for a password — **`interesting`** to start. Change it in **Admin → Settings**.
The dashboard stays unlocked until the tab is closed or **Lock dashboard** is pressed.

This is a prototype gate, not real security: it runs in the browser, so someone with the
developer tools can get past it, and a changed password only applies to that browser.
Real protection needs a server-side login.

## What's mocked / not built (on purpose)

- **Backend:** `lib/api.ts` keeps products and orders in localStorage with a small delay.
  Uploaded files live in IndexedDB. "Reset demo data" in the admin restores the samples.
- **Owner email:** `submitOrder` logs the email it *would* send (browser console) and
  records the time on the order.
- **Auth, payments, shipping, pickup rules:** not built. Payment is cash in person only.
- **Placeholders:** payment place/time, how customers hear an order is ready, contact
  info and shop name are `[bracketed]` in `src/config/site.ts` and shown in a visible
  placeholder style until filled in.

To preview error states, add `?simulate=submit-error` to the details page URL, or
`?simulate=load-error` to the shop or a product page.
