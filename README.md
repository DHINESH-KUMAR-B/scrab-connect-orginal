# Scrap Connect

Run `npm install && npm run dev`. Without `.env` (see `.env.example`), the app runs in demo mode with mock data and any-email login.

The pickup form includes an OpenStreetMap pin picker and optional browser geolocation. Map tiles require an internet connection; the selected coordinates are saved with the pickup. The customer dashboard shows pickup locations, a monthly recycling goal, and claimable demo cashback vouchers. Demo goals and voucher claims are stored in the browser; vouchers are not cash or real payment discounts.

With Firebase: enable Email/Password auth, create Firestore, deploy `firestore.rules`. Set `role: "admin"` on a user doc from the console.
Collections: `users{name,email,phone,greenPoints,role}`, `collectors{name,vehicle,verified,rating}`, `pickups{userId,collectorId,scrapType,weight,status,price}`.
`src/lib/ai.js` holds placeholder AI (recognition, batching, routing, price prediction); swap recognition for a real vision model via a Cloud Function.
