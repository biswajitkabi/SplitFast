/**
 * Generates a UPI deep link that opens any UPI app (GPay, PhonePe, Paytm)
 * This is the feature that makes SplitFast feel like a real Indian fintech product
 *
 * upi://pay?pa=VPA&pn=NAME&am=AMOUNT&tn=NOTE&cu=INR
 */
export function buildUpiLink({ upiId, name, amount, note }) {
  const params = new URLSearchParams({
    pa: upiId,
    pn: name,
    am: amount.toFixed(2),
    tn: note || 'SplitFast payment',
    cu: 'INR'
  })
  return `upi://pay?${params.toString()}`
}

/**
 * Returns GPay-specific intent link (better Android experience)
 */
export function buildGPayLink({ upiId, name, amount, note }) {
  const base = buildUpiLink({ upiId, name, amount, note })
  return `intent://pay?${base.split('?')[1]}#Intent;scheme=upi;package=com.google.android.apps.nbu.paisa.user;end`
}

/**
 * Detect if user is on mobile (UPI links only work on mobile)
 */
export function isMobile() {
  return /Android|iPhone|iPad/i.test(navigator.userAgent)
}