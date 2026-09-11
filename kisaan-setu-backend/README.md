# Kisaan Setu — backend

Express + MongoDB (Mongoose) API behind the registration (OTP + eNAM) and
payment (Razorpay) flows.

## Setup

```bash
npm install
cp .env.example .env
# then edit .env — at minimum set MONGODB_URI, JWT_SECRET, OTP_HASH_SECRET,
# and your Razorpay keys
npm run dev      # nodemon, restarts on file changes
# or
npm start
```

MongoDB options for `MONGODB_URI`:
- Local: install MongoDB Community Server, then `mongodb://127.0.0.1:27017/kisaansetu`
- Atlas (free tier, no local install): create a cluster at mongodb.com/atlas,
  add your IP to the network access list, and copy the connection string it
  gives you — it looks like `mongodb+srv://user:pass@cluster.mongodb.net/kisaansetu`

Health check once running: `GET http://localhost:5000/api/health`

## Data model

- **OtpSession** — one active OTP per mobile number, TTL-indexed so MongoDB
  deletes expired ones automatically. Stores a salted hash of the code, never
  the code itself.
- **Farmer** — created once, after eNAM verification succeeds. `mobile` and
  `enamId` are both unique.
- **Order** — one per checkout, `cod` or `online`, linked to the farmer who
  placed it.

## Auth model

Two JWT "stages", checked by `requireAuth(stage)`:

| stage           | issued after                | can call                                    |
|-----------------|------------------------------|----------------------------------------------|
| `otp_verified`  | `/api/auth/verify-otp`       | `/api/farmers/verify-enam`, `/api/farmers/register` |
| `registered`    | `/api/farmers/register` (or a repeat login) | `/api/orders`, `/api/payments/verify`, `/api/farmers/me` |

Send the token on every protected call: `Authorization: Bearer <token>`.

## API reference

### `POST /api/auth/send-otp`
```json
{ "mobile": "9876543210" }
```
→ `{ ok, expiresInSeconds, devOtp }` — `devOtp` is only included outside
production; see the note in `src/utils/otp.js` about wiring a real SMS
provider.

### `POST /api/auth/verify-otp`
```json
{ "mobile": "9876543210", "otp": "482913" }
```
→ `{ ok, stage, token }` (`stage` is `"registered"` if this number already
has a Farmer profile — you'll get a full session token straight away and
can skip the eNAM step).

### `POST /api/farmers/verify-enam` *(requires `otp_verified` token)*
```json
{ "enamId": "EN10293847" }
```
→ `{ ok, profile }`. Try `EN10293847`, `EN55821093`, or `EN77410256` against
the mock registry in `src/utils/enamMock.js` — swap that file for a real
eNAM/AGMARKNET integration when you have API access.

### `POST /api/farmers/register` *(requires `otp_verified` token)*
```json
{ "enamId": "EN10293847", "village": "Bilaspur village, Raebareli" }
```
→ `{ ok, token, farmer }` — `token` is now a `registered`-stage token.

### `GET /api/farmers/me` *(requires `registered` token)*
→ `{ farmer }`

### `POST /api/orders` *(requires `registered` token)*
```json
{
  "items": [{ "name": "NPK Fertilizer (50kg bag)", "qty": 2, "price": 950 }],
  "paymentMethod": "cod"
}
```
For `"paymentMethod": "online"`, the response also includes a `razorpay`
block (`keyId`, `orderId`, `amount`, `currency`) — pass that straight into
`new window.Razorpay(options)` on the frontend.

### `POST /api/payments/verify` *(requires `registered` token)*
```json
{
  "razorpay_order_id": "order_...",
  "razorpay_payment_id": "pay_...",
  "razorpay_signature": "..."
}
```
Call this from the Razorpay checkout `handler` callback. It re-derives the
HMAC signature server-side with your `key_secret` and only then marks the
order `paid` — the frontend `handler` firing is not, by itself, proof of
payment.

### `GET /api/orders` / `GET /api/orders/:orderId` *(requires `registered` token)*
Order history / a single receipt for the logged-in farmer.

## Wiring this to the two frontend artifacts

The registration and payment React components built earlier call nothing
yet — they run entirely in local state. To connect them:

1. Registration component: `handleSendOtp` → `POST /api/auth/send-otp`,
   `handleVerifyOtp` → `POST /api/auth/verify-otp` (store the returned
   token), `handleVerifyEnam` → `POST /api/farmers/verify-enam`,
   `handleCompleteRegistration` → `POST /api/farmers/register`.
2. Payment component: replace the client-generated `orderId`/receipt with a
   real call to `POST /api/orders`; for online payments, use the returned
   `razorpay` block to open checkout, and call `POST /api/payments/verify`
   from the `handler` callback before showing the receipt screen.

Happy to wire that up directly in the two components if you want the full
loop working end-to-end.
