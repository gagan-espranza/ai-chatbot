# ✈️ Flight Search Setup Instructions

## Quick Setup (Required)

1. **Create Environment File:**

   ```bash
   # Create .env.local in your project root
   touch .env.local
   ```

2. **Add SerpApi Key:**

   ```bash
   # Add this line to .env.local
   SERPAPI_KEY=your_actual_api_key_here
   ```

3. **Get Your Free API Key:**

   - Visit: https://serpapi.com/dashboard
   - Sign up for free account
   - Copy your API key
   - Replace `your_actual_api_key_here` with your actual key

4. **Restart Development Server:**
   ```bash
   npm run dev
   ```

## API Limits

- **Free Tier:** 100 searches/month
- **Paid Plan:** $50/month for 5000 searches
- Usage counter shows current usage in top-right corner

## Test the Feature

Try these example searches:

- "Find flights from New York to London on December 25th"
- "Search for round-trip flights SFO to Tokyo, departing Jan 15, return Jan 22"
- "Show me business class flights from Los Angeles to Paris"

## Troubleshooting

**Error: "Flight search is not configured"**

- Make sure `.env.local` exists in project root
- Check that `SERPAPI_KEY` is set correctly
- Restart the development server

**Error: "400 Bad Request"**

- Verify your API key is valid
- Check if you have remaining quota
- Try different search parameters

## Features Available

✅ Real-time flight data from Google Flights  
✅ Automatic city → airport code conversion  
✅ Price insights and trends  
✅ Multiple travel classes  
✅ Round-trip and one-way flights  
✅ Beautiful flight cards with pricing  
✅ Direct links to book on Google Flights  
✅ API usage tracking
