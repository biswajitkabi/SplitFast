// Cache exchange rates to avoid hitting API on every request
let ratesCache = {}
let lastFetched = null

export async function getExchangeRates() {
  // Refresh every 6 hours
  if (lastFetched && Date.now() - lastFetched < 6 * 60 * 60 * 1000) {
    return ratesCache
  }

  try {
    const res = await fetch(
      `https://api.exchangerate-api.com/v4/latest/INR`
    )
    const data = await res.json()
    ratesCache = data.rates
    lastFetched = Date.now()
    return ratesCache
  } catch (err) {
    console.error('Exchange rate fetch failed:', err)
    return ratesCache // use cached if fetch fails
  }
}

export async function convertToINR(amount, fromCurrency) {
  if (fromCurrency === 'INR') return amount
  const rates = await getExchangeRates()
  // rates are relative to INR as base
  // so 1 INR = rates[USD] USD
  // therefore 1 USD = 1/rates[USD] INR
  const rate = rates[fromCurrency]
  if (!rate) return amount
  return amount / rate
}