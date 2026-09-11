import { useState, useEffect, useRef } from "react";

// ---------------------------------------------------------------------------
// KISAAN SETU — Payment Gateway (demo)
//
// Two payment paths:
//   1. Cash on Delivery  -> confirms order immediately, receipt marked "Pay on Delivery"
//   2. Online Payment    -> opens Razorpay Checkout (TEST mode), receipt marked "Paid"
//
// IMPORTANT — before shipping this to production:
//   - Replace the `key` below with your own Razorpay Key ID.
//   - The `order_id` used here is a client-generated demo string. Razorpay
//     requires a real `order_id` created server-side (via /orders API) so
//     the amount can't be tampered with in the browser.
//   - After payment, verify the returned signature on your server before
//     marking an order as paid. Never trust the client-side `handler` alone.
//   - rzp_test_1DP5mmOlF5G5ag is Razorpay's published public TEST key,
//     meant for exactly this kind of integration demo — no real money moves.
// ---------------------------------------------------------------------------

const RAZORPAY_TEST_KEY = "rzp_test_1DP5mmOlF5G5ag";

const CART_ITEMS = [
  { id: 1, name: "NPK Fertilizer (50kg bag)", qty: 2, price: 950 },
  { id: 2, name: "Hybrid Wheat Seeds (10kg)", qty: 1, price: 480 },
  { id: 3, name: "Bio Pesticide (1L)", qty: 1, price: 210 },
];

const COD_FEE = 25;

function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    if (document.getElementById("razorpay-checkout-js")) {
      document.getElementById("razorpay-checkout-js").addEventListener("load", () => resolve(true));
      return;
    }
    const script = document.createElement("script");
    script.id = "razorpay-checkout-js";
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

function generateOrderId() {
  const stamp = Date.now().toString().slice(-8);
  return `KS-${stamp}`;
}

function formatRupees(n) {
  return `₹${n.toLocaleString("en-IN")}`;
}

function formatDate(d) {
  return d.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function KisaanSetuPayment() {
  const [method, setMethod] = useState("online");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [screen, setScreen] = useState("checkout"); // checkout | receipt
  const [receipt, setReceipt] = useState(null);
  const scriptLoadedRef = useRef(false);

  useEffect(() => {
    loadRazorpayScript().then((ok) => {
      scriptLoadedRef.current = ok;
    });
  }, []);

  const itemsTotal = CART_ITEMS.reduce((sum, i) => sum + i.qty * i.price, 0);
  const codFee = method === "cod" ? COD_FEE : 0;
  const total = itemsTotal + codFee;

  async function handlePayOnline() {
    setError("");
    setLoading(true);
    const ok = await loadRazorpayScript();
    if (!ok || !window.Razorpay) {
      setLoading(false);
      setError("Could not load the payment gateway. Check your connection and try again.");
      return;
    }

    const orderId = generateOrderId();

    const options = {
      key: RAZORPAY_TEST_KEY,
      amount: total * 100, // paise
      currency: "INR",
      name: "Kisaan Setu",
      description: `Order ${orderId}`,
      notes: { order_id: orderId },
      theme: { color: "#1F4D2E" },
      handler: function (response) {
        setReceipt({
          orderId,
          method: "Online Payment",
          status: "Paid",
          transactionId: response.razorpay_payment_id,
          amount: total,
          date: new Date(),
        });
        setLoading(false);
        setScreen("receipt");
      },
      modal: {
        ondismiss: function () {
          setLoading(false);
        },
      },
      prefill: { name: "", email: "", contact: "" },
    };

    const rzp = new window.Razorpay(options);
    rzp.on("payment.failed", function (response) {
      setLoading(false);
      setError(`Payment failed: ${response.error.description || "please try again."}`);
    });
    rzp.open();
  }

  function handleCOD() {
    setError("");
    const orderId = generateOrderId();
    setReceipt({
      orderId,
      method: "Cash on Delivery",
      status: "Pay on Delivery",
      transactionId: "—",
      amount: total,
      date: new Date(),
    });
    setScreen("receipt");
  }

  function handlePlaceOrder() {
    if (method === "online") {
      handlePayOnline();
    } else {
      handleCOD();
    }
  }

  function handleNewOrder() {
    setScreen("checkout");
    setReceipt(null);
    setError("");
  }

  function handleDownloadReceipt() {
    if (!receipt) return;
    const lines = [
      "KISAAN SETU — PAYMENT RECEIPT",
      "--------------------------------",
      `Order ID: ${receipt.orderId}`,
      `Date: ${formatDate(receipt.date)}`,
      `Payment method: ${receipt.method}`,
      `Status: ${receipt.status}`,
      `Transaction ID: ${receipt.transactionId}`,
      "",
      "Items:",
      ...CART_ITEMS.map((i) => `  ${i.name} x${i.qty} — ${formatRupees(i.qty * i.price)}`),
      receipt.method === "Cash on Delivery" ? `  COD handling fee — ${formatRupees(COD_FEE)}` : null,
      "",
      `Total paid: ${formatRupees(receipt.amount)}`,
    ].filter(Boolean);
    const blob = new Blob([lines.join("\n")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${receipt.orderId}-receipt.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  return (
    <div className="ks-root">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@500;600;700;800&display=swap');

        .ks-root {
          --ink: #26291F;
          --paper: #FBF7EF;
          --panel: #FFFFFF;
          --leaf: #1F4D2E;
          --leaf-dark: #163A22;
          --sage: #E7EEE1;
          --soil: #6B4226;
          --wheat: #D9A441;
          --wheat-dark: #B9832F;
          --line: #DDD6C4;
          font-family: 'Manrope', system-ui, sans-serif;
          background: var(--paper);
          color: var(--ink);
          min-height: 100vh;
          display: flex;
          justify-content: center;
          padding: 32px 16px;
          box-sizing: border-box;
        }
        .ks-root * { box-sizing: border-box; }

        .ks-phone {
          width: 100%;
          max-width: 420px;
        }

        .ks-header {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 20px;
        }
        .ks-mark {
          width: 34px;
          height: 34px;
          border-radius: 9px;
          background: var(--leaf);
          position: relative;
          flex-shrink: 0;
        }
        .ks-mark::before, .ks-mark::after {
          content: "";
          position: absolute;
          background: var(--wheat);
          border-radius: 2px;
        }
        .ks-mark::before { width: 3px; height: 16px; left: 11px; top: 9px; transform: rotate(-18deg); }
        .ks-mark::after { width: 3px; height: 16px; left: 19px; top: 9px; transform: rotate(18deg); }
        .ks-brand {
          display: flex;
          flex-direction: column;
          line-height: 1.1;
        }
        .ks-brand-name {
          font-weight: 800;
          font-size: 18px;
          letter-spacing: -0.01em;
        }
        .ks-brand-sub {
          font-size: 12.5px;
          color: var(--soil);
          font-weight: 600;
        }

        .ks-steps {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          font-weight: 700;
          color: var(--soil);
          margin-bottom: 18px;
        }
        .ks-step { display:flex; align-items:center; gap:6px; opacity: 0.45; }
        .ks-step.active { opacity: 1; color: var(--leaf); }
        .ks-step-dot {
          width: 18px; height: 18px; border-radius: 50%;
          background: var(--sage);
          display: flex; align-items: center; justify-content: center;
          font-size: 11px;
        }
        .ks-step.active .ks-step-dot { background: var(--leaf); color: #fff; }
        .ks-step-sep { width: 16px; height: 1px; background: var(--line); }

        .ks-panel {
          background: var(--panel);
          border: 1px solid var(--line);
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 1px 2px rgba(38,41,31,0.04);
        }

        .ks-section {
          padding: 18px 20px;
          border-bottom: 1px solid var(--line);
        }
        .ks-section:last-child { border-bottom: none; }

        .ks-section-title {
          font-size: 13px;
          font-weight: 700;
          color: var(--soil);
          margin: 0 0 12px 0;
        }

        .ks-item-row {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          font-size: 14px;
          padding: 6px 0;
        }
        .ks-item-name { color: var(--ink); }
        .ks-item-qty { color: #8A8570; font-size: 12.5px; }
        .ks-item-price { font-weight: 700; white-space: nowrap; }

        .ks-divider { height: 1px; background: var(--line); margin: 10px 0; }

        .ks-total-row {
          display: flex;
          justify-content: space-between;
          font-size: 15px;
          font-weight: 800;
          padding-top: 4px;
        }
        .ks-fee-row {
          display: flex;
          justify-content: space-between;
          font-size: 13px;
          color: #8A8570;
          padding: 4px 0;
        }

        .ks-method-group {
          display: flex;
          gap: 10px;
        }
        .ks-method {
          flex: 1;
          border: 1.5px solid var(--line);
          border-radius: 12px;
          padding: 12px 12px;
          cursor: pointer;
          background: var(--paper);
          transition: border-color 0.15s ease, background 0.15s ease;
        }
        .ks-method.selected {
          border-color: var(--leaf);
          background: var(--sage);
        }
        .ks-method-label {
          font-weight: 700;
          font-size: 14px;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .ks-radio {
          width: 16px; height: 16px;
          border-radius: 50%;
          border: 1.5px solid var(--line);
          flex-shrink: 0;
          position: relative;
        }
        .ks-method.selected .ks-radio { border-color: var(--leaf); }
        .ks-method.selected .ks-radio::after {
          content: "";
          position: absolute;
          inset: 3px;
          border-radius: 50%;
          background: var(--leaf);
        }
        .ks-method-note {
          font-size: 12px;
          color: #8A8570;
          margin-top: 4px;
          padding-left: 24px;
        }

        .ks-cta {
          width: 100%;
          padding: 14px;
          border-radius: 12px;
          border: none;
          background: var(--wheat);
          color: #2A1F0B;
          font-weight: 800;
          font-size: 15px;
          cursor: pointer;
          transition: background 0.15s ease, transform 0.05s ease;
        }
        .ks-cta:hover { background: var(--wheat-dark); }
        .ks-cta:active { transform: scale(0.99); }
        .ks-cta:disabled { opacity: 0.6; cursor: not-allowed; }

        .ks-error {
          font-size: 13px;
          color: #A23B2E;
          background: #FBEAE6;
          border: 1px solid #EFC6BC;
          border-radius: 10px;
          padding: 10px 12px;
          margin-bottom: 12px;
        }

        .ks-footnote {
          font-size: 11.5px;
          color: #8A8570;
          text-align: center;
          margin-top: 14px;
          line-height: 1.5;
        }

        /* Receipt */
        .ks-receipt-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          font-weight: 700;
          padding: 5px 10px;
          border-radius: 999px;
          background: var(--sage);
          color: var(--leaf-dark);
        }
        .ks-receipt-badge.pending {
          background: #FBF1DE;
          color: var(--wheat-dark);
        }
        .ks-check {
          width: 46px; height: 46px;
          border-radius: 50%;
          background: var(--leaf);
          display: flex; align-items: center; justify-content: center;
          margin: 4px auto 12px auto;
        }
        .ks-receipt-head {
          text-align: center;
          padding-bottom: 6px;
        }
        .ks-receipt-amount {
          font-size: 26px;
          font-weight: 800;
          margin: 10px 0 4px 0;
        }
        .ks-kv-row {
          display: flex;
          justify-content: space-between;
          font-size: 13.5px;
          padding: 5px 0;
        }
        .ks-kv-label { color: #8A8570; }
        .ks-kv-value { font-weight: 700; text-align: right; }
        .ks-dashed {
          border-top: 1.5px dashed var(--line);
          margin: 10px 0;
        }
        .ks-secondary-row {
          display: flex;
          gap: 10px;
          margin-top: 14px;
        }
        .ks-btn-outline {
          flex: 1;
          padding: 11px;
          border-radius: 12px;
          border: 1.5px solid var(--line);
          background: transparent;
          color: var(--ink);
          font-weight: 700;
          font-size: 13.5px;
          cursor: pointer;
        }
        .ks-btn-outline:hover { border-color: var(--leaf); }
      `}</style>

      <div className="ks-phone">
        <div className="ks-header">
          <div className="ks-mark" />
          <div className="ks-brand">
            <span className="ks-brand-name">Kisaan Setu</span>
            <span className="ks-brand-sub">किसान सेतु · Farm supply checkout</span>
          </div>
        </div>

        {screen === "checkout" && (
          <>
            <div className="ks-steps">
              <div className="ks-step active">
                <span className="ks-step-dot">1</span> Review
              </div>
              <div className="ks-step-sep" />
              <div className="ks-step active">
                <span className="ks-step-dot">2</span> Pay
              </div>
              <div className="ks-step-sep" />
              <div className="ks-step">
                <span className="ks-step-dot">3</span> Receipt
              </div>
            </div>

            <div className="ks-panel">
              <div className="ks-section">
                <p className="ks-section-title">Order summary</p>
                {CART_ITEMS.map((item) => (
                  <div className="ks-item-row" key={item.id}>
                    <div>
                      <div className="ks-item-name">{item.name}</div>
                      <div className="ks-item-qty">Qty {item.qty}</div>
                    </div>
                    <div className="ks-item-price">{formatRupees(item.qty * item.price)}</div>
                  </div>
                ))}
                <div className="ks-divider" />
                <div className="ks-fee-row">
                  <span>Items subtotal</span>
                  <span>{formatRupees(itemsTotal)}</span>
                </div>
                {method === "cod" && (
                  <div className="ks-fee-row">
                    <span>COD handling fee</span>
                    <span>{formatRupees(COD_FEE)}</span>
                  </div>
                )}
                <div className="ks-total-row">
                  <span>Total</span>
                  <span>{formatRupees(total)}</span>
                </div>
              </div>

              <div className="ks-section">
                <p className="ks-section-title">Payment method</p>
                <div className="ks-method-group">
                  <div
                    className={`ks-method ${method === "online" ? "selected" : ""}`}
                    onClick={() => setMethod("online")}
                  >
                    <div className="ks-method-label">
                      <span className="ks-radio" />
                      Online
                    </div>
                    <div className="ks-method-note">UPI, card, netbanking</div>
                  </div>
                  <div
                    className={`ks-method ${method === "cod" ? "selected" : ""}`}
                    onClick={() => setMethod("cod")}
                  >
                    <div className="ks-method-label">
                      <span className="ks-radio" />
                      Cash on delivery
                    </div>
                    <div className="ks-method-note">Pay when it arrives</div>
                  </div>
                </div>
              </div>

              <div className="ks-section">
                {error && <div className="ks-error">{error}</div>}
                <button className="ks-cta" onClick={handlePlaceOrder} disabled={loading}>
                  {loading
                    ? "Opening payment gateway…"
                    : method === "online"
                    ? `Pay ${formatRupees(total)}`
                    : `Place order · ${formatRupees(total)}`}
                </button>
              </div>
            </div>

            <p className="ks-footnote">
              Online payments run through Razorpay's test checkout for this demo — no real
              money is charged. Swap in a live key and server-side order creation before
              going to production.
            </p>
          </>
        )}

        {screen === "receipt" && receipt && (
          <div className="ks-panel">
            <div className="ks-section ks-receipt-head">
              <div className="ks-check">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                  <path d="M5 13l4 4L19 7" stroke="#FBF7EF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <span className={`ks-receipt-badge ${receipt.status === "Pay on Delivery" ? "pending" : ""}`}>
                {receipt.status === "Pay on Delivery" ? "Order confirmed · pay on delivery" : "Payment successful"}
              </span>
              <div className="ks-receipt-amount">{formatRupees(receipt.amount)}</div>
            </div>

            <div className="ks-section">
              <div className="ks-kv-row">
                <span className="ks-kv-label">Order ID</span>
                <span className="ks-kv-value">{receipt.orderId}</span>
              </div>
              <div className="ks-kv-row">
                <span className="ks-kv-label">Date</span>
                <span className="ks-kv-value">{formatDate(receipt.date)}</span>
              </div>
              <div className="ks-kv-row">
                <span className="ks-kv-label">Payment method</span>
                <span className="ks-kv-value">{receipt.method}</span>
              </div>
              <div className="ks-kv-row">
                <span className="ks-kv-label">Transaction ID</span>
                <span className="ks-kv-value">{receipt.transactionId}</span>
              </div>

              <div className="ks-dashed" />

              {CART_ITEMS.map((item) => (
                <div className="ks-item-row" key={item.id}>
                  <div>
                    <div className="ks-item-name">{item.name}</div>
                    <div className="ks-item-qty">Qty {item.qty}</div>
                  </div>
                  <div className="ks-item-price">{formatRupees(item.qty * item.price)}</div>
                </div>
              ))}
              {receipt.method === "Cash on Delivery" && (
                <div className="ks-fee-row">
                  <span>COD handling fee</span>
                  <span>{formatRupees(COD_FEE)}</span>
                </div>
              )}

              <div className="ks-divider" />
              <div className="ks-total-row">
                <span>Total</span>
                <span>{formatRupees(receipt.amount)}</span>
              </div>

              <div className="ks-secondary-row">
                <button className="ks-btn-outline" onClick={handleDownloadReceipt}>
                  Download receipt
                </button>
                <button className="ks-btn-outline" onClick={handleNewOrder}>
                  New order
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
