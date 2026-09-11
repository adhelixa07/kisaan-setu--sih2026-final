import { useState, useEffect, useRef } from "react";

// ---------------------------------------------------------------------------
// KISAAN SETU — Farmer registration (demo)
//
// Flow: Mobile number -> OTP -> eNAM ID verification -> Confirm -> Done
//
// IMPORTANT — what's real here vs. simulated, before shipping this:
//
//   OTP
//   - This demo generates the OTP in the browser and shows it on screen so
//     you can test the flow without a backend. That is ONLY for the demo.
//   - In production the OTP must be generated and sent server-side, through
//     a DLT-registered SMS route (mandatory in India for transactional SMS
//     — providers like MSG91, Kaleyra, or AWS SNS's India route handle this).
//     The frontend should only ever collect the number and the code the
//     farmer received, never see or generate the code itself.
//
//   eNAM ID verification
//   - There is no public self-serve API for verifying eNAM registration —
//     access requires integration approval from the National Agriculture
//     Market / AGMARKNET team (under the Ministry of Agriculture). This demo
//     simulates that lookup against a small mock table so the UX is real
//     even though the data source isn't.
//   - The exact eNAM ID format also varies by state/mandi implementation;
//     the validation here (EN + 8 digits) is a placeholder — swap it for
//     whatever format your actual integration returns.
//   - Try one of these demo IDs at the eNAM step: EN10293847, EN55821093,
//     EN77410256
// ---------------------------------------------------------------------------

const MOCK_ENAM_DB = [
  { enamId: "EN10293847", name: "Ramesh Kumar Yadav", state: "Uttar Pradesh", mandi: "Lucknow APMC", category: "Cereals & Grains" },
  { enamId: "EN55821093", name: "Suresh Patel", state: "Gujarat", mandi: "Ahmedabad APMC", category: "Cotton & Oilseeds" },
  { enamId: "EN77410256", name: "Lakshmi Reddy", state: "Andhra Pradesh", mandi: "Guntur APMC", category: "Chillies & Spices" },
];

const OTP_TTL = 60; // seconds
const MAX_OTP_ATTEMPTS = 3;
const ENAM_ID_PATTERN = /^EN\d{8}$/;

function generateOtp() {
  return '123456';
}

function generateFarmerId() {
  const stamp = Date.now().toString().slice(-6);
  return `KS-F-${stamp}`;
}

function isValidMobile(v) {
  return /^[6-9]\d{9}$/.test(v);
}

export default function KisaanSetuRegistration() {
  const [screen, setScreen] = useState("mobile"); // mobile | otp | enam | confirm | success

  // mobile + otp state
  const [mobile, setMobile] = useState("");
  const [mobileError, setMobileError] = useState("");
  const [otp, setOtp] = useState("");
  const [otpInput, setOtpInput] = useState("");
  const [otpError, setOtpError] = useState("");
  const [otpAttemptsLeft, setOtpAttemptsLeft] = useState(MAX_OTP_ATTEMPTS);
  const [timer, setTimer] = useState(OTP_TTL);
  const timerRef = useRef(null);

  // eNAM state
  const [enamId, setEnamId] = useState("");
  const [enamError, setEnamError] = useState("");
  const [enamStatus, setEnamStatus] = useState("idle"); // idle | checking | verified | failed
  const [enamProfile, setEnamProfile] = useState(null);

  // final details
  const [village, setVillage] = useState("");
  const [farmerId, setFarmerId] = useState("");

  useEffect(() => {
    if (screen === "otp" && timer > 0) {
      timerRef.current = setTimeout(() => setTimer((t) => t - 1), 1000);
    }
    return () => clearTimeout(timerRef.current);
  }, [screen, timer]);

  function handleSendOtp() {
    if (!isValidMobile(mobile)) {
      setMobileError("Enter a valid 10-digit mobile number.");
      return;
    }
    setMobileError("");
    const code = generateOtp();
    setOtp(code);
    setOtpInput("");
    setOtpError("");
    setOtpAttemptsLeft(MAX_OTP_ATTEMPTS);
    setTimer(OTP_TTL);
    setScreen("otp");
  }

  function handleResendOtp() {
    const code = generateOtp();
    setOtp(code);
    setOtpInput("");
    setOtpError("");
    setOtpAttemptsLeft(MAX_OTP_ATTEMPTS);
    setTimer(OTP_TTL);
  }

  function handleVerifyOtp() {
    if (otpInput.length !== 6) {
      setOtpError("Enter the 6-digit code.");
      return;
    }
    if (otpInput === otp) {
      setOtpError("");
      setScreen("enam");
      return;
    }
    const left = otpAttemptsLeft - 1;
    setOtpAttemptsLeft(left);
    if (left <= 0) {
      setOtpError("Too many incorrect attempts. Request a new code.");
    } else {
      setOtpError(`Incorrect code. ${left} attempt${left === 1 ? "" : "s"} left.`);
    }
  }

  function handleVerifyEnam() {
    const id = enamId.trim().toUpperCase();
    if (!ENAM_ID_PATTERN.test(id)) {
      setEnamError("eNAM ID should look like EN followed by 8 digits.");
      setEnamStatus("idle");
      return;
    }
    setEnamError("");
    setEnamStatus("checking");
    setTimeout(() => {
      const match = MOCK_ENAM_DB.find((f) => f.enamId === id);
      if (match) {
        setEnamProfile(match);
        setEnamStatus("verified");
      } else {
        setEnamProfile(null);
        setEnamStatus("failed");
      }
    }, 1100);
  }

  function handleCompleteRegistration() {
    setFarmerId(generateFarmerId());
    setScreen("success");
  }

  function handleStartOver() {
    setScreen("mobile");
    setMobile("");
    setMobileError("");
    setOtp("");
    setOtpInput("");
    setOtpError("");
    setEnamId("");
    setEnamError("");
    setEnamStatus("idle");
    setEnamProfile(null);
    setVillage("");
    setFarmerId("");
  }

  const stepIndex = { mobile: 1, otp: 1, enam: 2, confirm: 3, success: 3 }[screen];

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
          --err: #A23B2E;
          --err-bg: #FBEAE6;
          --err-line: #EFC6BC;
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

        .ks-phone { width: 100%; max-width: 420px; }

        .ks-header { display: flex; align-items: center; gap: 10px; margin-bottom: 20px; }
        .ks-mark {
          width: 34px; height: 34px; border-radius: 9px;
          background: var(--leaf); position: relative; flex-shrink: 0;
        }
        .ks-mark::before, .ks-mark::after {
          content: ""; position: absolute; background: var(--wheat); border-radius: 2px;
        }
        .ks-mark::before { width: 3px; height: 16px; left: 11px; top: 9px; transform: rotate(-18deg); }
        .ks-mark::after { width: 3px; height: 16px; left: 19px; top: 9px; transform: rotate(18deg); }
        .ks-brand { display: flex; flex-direction: column; line-height: 1.1; }
        .ks-brand-name { font-weight: 800; font-size: 18px; letter-spacing: -0.01em; }
        .ks-brand-sub { font-size: 12.5px; color: var(--soil); font-weight: 600; }

        .ks-steps {
          display: flex; align-items: center; gap: 6px;
          font-size: 12px; font-weight: 700; color: var(--soil); margin-bottom: 18px;
        }
        .ks-step { display:flex; align-items:center; gap:6px; opacity: 0.45; }
        .ks-step.active { opacity: 1; color: var(--leaf); }
        .ks-step-dot {
          width: 18px; height: 18px; border-radius: 50%; background: var(--sage);
          display: flex; align-items: center; justify-content: center; font-size: 11px;
        }
        .ks-step.active .ks-step-dot { background: var(--leaf); color: #fff; }
        .ks-step-sep { width: 16px; height: 1px; background: var(--line); }

        .ks-panel {
          background: var(--panel); border: 1px solid var(--line); border-radius: 16px;
          overflow: hidden; box-shadow: 0 1px 2px rgba(38,41,31,0.04);
        }
        .ks-section { padding: 20px; border-bottom: 1px solid var(--line); }
        .ks-section:last-child { border-bottom: none; }
        .ks-section-title { font-size: 13px; font-weight: 700; color: var(--soil); margin: 0 0 4px 0; }
        .ks-section-desc { font-size: 13px; color: #8A8570; margin: 0 0 16px 0; line-height: 1.5; }

        .ks-label { font-size: 12.5px; font-weight: 700; color: var(--ink); display: block; margin-bottom: 6px; }

        .ks-mobile-input-row { display: flex; border: 1.5px solid var(--line); border-radius: 12px; overflow: hidden; }
        .ks-mobile-prefix {
          padding: 12px 12px; background: var(--sage); font-weight: 700; font-size: 14px;
          color: var(--leaf-dark); border-right: 1.5px solid var(--line); flex-shrink: 0;
        }
        .ks-input {
          border: none; outline: none; padding: 12px; font-size: 15px; width: 100%;
          font-family: inherit; background: transparent; color: var(--ink);
          letter-spacing: 0.3px;
        }
        .ks-input-box {
          border: 1.5px solid var(--line); border-radius: 12px; width: 100%;
        }
        .ks-input-box.err { border-color: var(--err); }
        .ks-input-box:focus-within { border-color: var(--leaf); }

        .ks-otp-input { text-align: center; font-size: 20px; font-weight: 800; letter-spacing: 8px; }

        .ks-cta {
          width: 100%; padding: 14px; border-radius: 12px; border: none;
          background: var(--wheat); color: #2A1F0B; font-weight: 800; font-size: 15px;
          cursor: pointer; transition: background 0.15s ease, transform 0.05s ease;
        }
        .ks-cta:hover { background: var(--wheat-dark); }
        .ks-cta:active { transform: scale(0.99); }
        .ks-cta:disabled { opacity: 0.55; cursor: not-allowed; }

        .ks-cta-outline {
          width: 100%; padding: 12px; border-radius: 12px; border: 1.5px solid var(--line);
          background: transparent; color: var(--ink); font-weight: 700; font-size: 13.5px;
          cursor: pointer; margin-top: 10px;
        }
        .ks-cta-outline:hover { border-color: var(--leaf); }
        .ks-cta-outline:disabled { opacity: 0.5; cursor: not-allowed; }

        .ks-field-error { font-size: 12px; color: var(--err); margin-top: 6px; }

        .ks-error-banner {
          font-size: 13px; color: var(--err); background: var(--err-bg);
          border: 1px solid var(--err-line); border-radius: 10px; padding: 10px 12px; margin-bottom: 14px;
        }

        .ks-demo-banner {
          font-size: 12.5px; color: var(--leaf-dark); background: var(--sage);
          border: 1px solid #CBDCC1; border-radius: 10px; padding: 10px 12px; margin-bottom: 14px; line-height: 1.5;
        }
        .ks-demo-banner b { letter-spacing: 2px; }

        .ks-timer-row {
          display: flex; justify-content: space-between; align-items: center;
          font-size: 12.5px; color: #8A8570; margin: 10px 0 4px 0;
        }
        .ks-link-btn {
          background: none; border: none; padding: 0; color: var(--leaf); font-weight: 700;
          font-size: 12.5px; cursor: pointer; font-family: inherit;
        }
        .ks-link-btn:disabled { color: #B8B29A; cursor: not-allowed; }

        .ks-enam-status {
          display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 700;
          padding: 10px 12px; border-radius: 10px; margin-top: 12px;
        }
        .ks-enam-status.checking { background: var(--sage); color: var(--leaf-dark); }
        .ks-enam-status.failed { background: var(--err-bg); color: var(--err); }

        .ks-spinner {
          width: 13px; height: 13px; border-radius: 50%;
          border: 2px solid rgba(31,77,46,0.25); border-top-color: var(--leaf);
          animation: ks-spin 0.7s linear infinite; flex-shrink: 0;
        }
        @keyframes ks-spin { to { transform: rotate(360deg); } }

        .ks-profile-card {
          border: 1.5px solid var(--line); border-radius: 12px; padding: 14px; margin-top: 12px; background: var(--paper);
        }
        .ks-profile-name { font-weight: 800; font-size: 15px; margin-bottom: 8px; }
        .ks-kv-row { display: flex; justify-content: space-between; font-size: 13px; padding: 4px 0; }
        .ks-kv-label { color: #8A8570; }
        .ks-kv-value { font-weight: 700; text-align: right; }

        .ks-verified-chip {
          display: inline-flex; align-items: center; gap: 5px; font-size: 11.5px; font-weight: 700;
          color: var(--leaf-dark); background: var(--sage); padding: 3px 8px; border-radius: 999px; margin-bottom: 8px;
        }

        .ks-footnote { font-size: 11.5px; color: #8A8570; text-align: center; margin-top: 14px; line-height: 1.5; }

        /* success */
        .ks-check {
          width: 46px; height: 46px; border-radius: 50%; background: var(--leaf);
          display: flex; align-items: center; justify-content: center; margin: 4px auto 12px auto;
        }
        .ks-success-head { text-align: center; padding-bottom: 6px; }
        .ks-success-sub { font-size: 13.5px; color: #8A8570; margin-top: 4px; }
        .ks-dashed { border-top: 1.5px dashed var(--line); margin: 12px 0; }
      `}</style>

      <div className="ks-phone">
        <div className="ks-header">
          <div className="ks-mark" />
          <div className="ks-brand">
            <span className="ks-brand-name">Kisaan Setu</span>
            <span className="ks-brand-sub">किसान सेतु · Farmer registration</span>
          </div>
        </div>

        {screen !== "success" && (
          <div className="ks-steps">
            <div className={`ks-step ${stepIndex >= 1 ? "active" : ""}`}>
              <span className="ks-step-dot">1</span> Mobile
            </div>
            <div className="ks-step-sep" />
            <div className={`ks-step ${stepIndex >= 2 ? "active" : ""}`}>
              <span className="ks-step-dot">2</span> eNAM ID
            </div>
            <div className="ks-step-sep" />
            <div className={`ks-step ${stepIndex >= 3 ? "active" : ""}`}>
              <span className="ks-step-dot">3</span> Confirm
            </div>
          </div>
        )}

        {/* Step: mobile */}
        {screen === "mobile" && (
          <div className="ks-panel">
            <div className="ks-section">
              <p className="ks-section-title">Verify your mobile number</p>
              <p className="ks-section-desc">We'll send a one-time code to confirm it's you.</p>
              <label className="ks-label">Mobile number</label>
              <div className={`ks-mobile-input-row ${mobileError ? "err" : ""}`} style={{ borderColor: mobileError ? "var(--err)" : undefined }}>
                <span className="ks-mobile-prefix">+91</span>
                <input
                  className="ks-input"
                  type="tel"
                  inputMode="numeric"
                  maxLength={10}
                  placeholder="98765 43210"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value.replace(/\D/g, "").slice(0, 10))}
                />
              </div>
              {mobileError && <div className="ks-field-error">{mobileError}</div>}
            </div>
            <div className="ks-section">
              <button className="ks-cta" onClick={handleSendOtp}>
                Send OTP
              </button>
            </div>
          </div>
        )}

        {/* Step: otp */}
        {screen === "otp" && (
          <div className="ks-panel">
            <div className="ks-section">
              <p className="ks-section-title">Enter the code</p>
              <p className="ks-section-desc">Sent to +91 {mobile}. <span className="ks-link-btn" onClick={() => setScreen("mobile")} style={{ cursor: "pointer" }}>Change number</span></p>

              <div className="ks-demo-banner">
                Demo mode — no SMS is actually sent. Your one-time code is <b>{otp}</b>. In production this arrives by SMS and is never shown here.
              </div>

              <label className="ks-label">6-digit OTP</label>
              <div className={`ks-input-box ${otpError ? "err" : ""}`}>
                <input
                  className="ks-input ks-otp-input"
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="——————"
                  value={otpInput}
                  onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  disabled={otpAttemptsLeft <= 0}
                />
              </div>
              {otpError && <div className="ks-field-error">{otpError}</div>}

              <div className="ks-timer-row">
                <span>{timer > 0 ? `Code expires in ${timer}s` : "Code expired"}</span>
                <button className="ks-link-btn" onClick={handleResendOtp} disabled={timer > 0}>
                  Resend code
                </button>
              </div>
            </div>
            <div className="ks-section">
              <button className="ks-cta" onClick={handleVerifyOtp} disabled={otpAttemptsLeft <= 0 || timer <= 0}>
                Verify & continue
              </button>
            </div>
          </div>
        )}

        {/* Step: enam */}
        {screen === "enam" && (
          <div className="ks-panel">
            <div className="ks-section">
              <p className="ks-section-title">Verify your eNAM ID</p>
              <p className="ks-section-desc">
                This confirms you as a registered farmer on the National Agriculture Market and pulls your registered mandi details.
              </p>

              <div className="ks-demo-banner">
                Demo lookup only — try <b>EN10293847</b>, <b>EN55821093</b>, or <b>EN77410256</b>.
              </div>

              <label className="ks-label">eNAM registration ID</label>
              <div className={`ks-input-box ${enamError ? "err" : ""}`}>
                <input
                  className="ks-input"
                  type="text"
                  placeholder="EN10293847"
                  value={enamId}
                  onChange={(e) => {
                    setEnamId(e.target.value.toUpperCase());
                    setEnamStatus("idle");
                  }}
                />
              </div>
              {enamError && <div className="ks-field-error">{enamError}</div>}

              {enamStatus === "checking" && (
                <div className="ks-enam-status checking">
                  <span className="ks-spinner" />
                  Checking eNAM registry…
                </div>
              )}

              {enamStatus === "failed" && (
                <div className="ks-enam-status failed">
                  No matching eNAM registration found. Check the ID and try again.
                </div>
              )}

              {enamStatus === "verified" && enamProfile && (
                <div className="ks-profile-card">
                  <span className="ks-verified-chip">✓ eNAM verified</span>
                  <div className="ks-profile-name">{enamProfile.name}</div>
                  <div className="ks-kv-row"><span className="ks-kv-label">State</span><span className="ks-kv-value">{enamProfile.state}</span></div>
                  <div className="ks-kv-row"><span className="ks-kv-label">Registered mandi</span><span className="ks-kv-value">{enamProfile.mandi}</span></div>
                  <div className="ks-kv-row"><span className="ks-kv-label">Produce category</span><span className="ks-kv-value">{enamProfile.category}</span></div>
                </div>
              )}
            </div>
            <div className="ks-section">
              {enamStatus === "verified" ? (
                <button className="ks-cta" onClick={() => setScreen("confirm")}>
                  Continue
                </button>
              ) : (
                <button className="ks-cta" onClick={handleVerifyEnam} disabled={enamStatus === "checking"}>
                  {enamStatus === "checking" ? "Checking…" : "Verify eNAM ID"}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Step: confirm */}
        {screen === "confirm" && enamProfile && (
          <div className="ks-panel">
            <div className="ks-section">
              <p className="ks-section-title">Confirm your details</p>
              <p className="ks-section-desc">This is what we'll use for your Kisaan Setu profile.</p>

              <div className="ks-profile-card">
                <span className="ks-verified-chip">✓ eNAM verified</span>
                <div className="ks-profile-name">{enamProfile.name}</div>
                <div className="ks-kv-row"><span className="ks-kv-label">Mobile</span><span className="ks-kv-value">+91 {mobile}</span></div>
                <div className="ks-kv-row"><span className="ks-kv-label">eNAM ID</span><span className="ks-kv-value">{enamProfile.enamId}</span></div>
                <div className="ks-kv-row"><span className="ks-kv-label">State</span><span className="ks-kv-value">{enamProfile.state}</span></div>
                <div className="ks-kv-row"><span className="ks-kv-label">Registered mandi</span><span className="ks-kv-value">{enamProfile.mandi}</span></div>
                <div className="ks-kv-row"><span className="ks-kv-label">Produce category</span><span className="ks-kv-value">{enamProfile.category}</span></div>
              </div>

              <label className="ks-label" style={{ marginTop: 14 }}>Village / farm location (optional)</label>
              <div className="ks-input-box">
                <input
                  className="ks-input"
                  type="text"
                  placeholder="e.g. Bilaspur village, Raebareli"
                  value={village}
                  onChange={(e) => setVillage(e.target.value)}
                />
              </div>
            </div>
            <div className="ks-section">
              <button className="ks-cta" onClick={handleCompleteRegistration}>
                Complete registration
              </button>
            </div>
          </div>
        )}

        {/* Step: success */}
        {screen === "success" && enamProfile && (
          <div className="ks-panel">
            <div className="ks-section ks-success-head">
              <div className="ks-check">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                  <path d="M5 13l4 4L19 7" stroke="#FBF7EF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <p className="ks-section-title" style={{ fontSize: 15, color: "var(--ink)" }}>Registration complete</p>
              <p className="ks-success-sub">Welcome to Kisaan Setu, {enamProfile.name.split(" ")[0]}.</p>
            </div>
            <div className="ks-section">
              <div className="ks-kv-row"><span className="ks-kv-label">Kisaan Setu ID</span><span className="ks-kv-value">{farmerId}</span></div>
              <div className="ks-kv-row"><span className="ks-kv-label">Name</span><span className="ks-kv-value">{enamProfile.name}</span></div>
              <div className="ks-kv-row"><span className="ks-kv-label">Mobile</span><span className="ks-kv-value">+91 {mobile}</span></div>
              <div className="ks-kv-row"><span className="ks-kv-label">eNAM ID</span><span className="ks-kv-value">{enamProfile.enamId}</span></div>
              <div className="ks-kv-row"><span className="ks-kv-label">Mandi</span><span className="ks-kv-value">{enamProfile.mandi}</span></div>
              {village && <div className="ks-kv-row"><span className="ks-kv-label">Village</span><span className="ks-kv-value">{village}</span></div>}
              <div className="ks-dashed" />
              <button className="ks-cta-outline" onClick={handleStartOver}>
                Register another farmer
              </button>
            </div>
          </div>
        )}

        <p className="ks-footnote">
          Mobile OTP and eNAM ID together form two-factor verification: the OTP proves the
          phone belongs to the applicant, and eNAM confirms they're a registered farmer.
        </p>
      </div>
    </div>
  );
}
