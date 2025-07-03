/**
 * Keep Alive Script for Render Free Tier
 * 
 * This script pings the backend health endpoint every 10 minutes 
 * to prevent it from sleeping on Render's free tier.
 * 
 * Deploy this on Vercel as an edge function or use a service like UptimeRobot.
 */

const https = require('https');

const BACKEND_URL = 'https://afterink-invoice.onrender.com/health';
const PING_INTERVAL = 10 * 60 * 1000; // 10 minutes in milliseconds

function pingBackend() {
  const startTime = Date.now();
  
  https.get(BACKEND_URL, (res) => {
    const responseTime = Date.now() - startTime;
    console.log(`✅ Backend ping successful - Status: ${res.statusCode} - Response time: ${responseTime}ms - ${new Date().toISOString()}`);
  }).on('error', (err) => {
    console.log(`❌ Backend ping failed: ${err.message} - ${new Date().toISOString()}`);
  });
}

// Ping immediately on startup
console.log('🚀 Starting keep-alive service for Afterink Invoice backend...');
pingBackend();

// Then ping every 10 minutes
setInterval(pingBackend, PING_INTERVAL);

console.log(`⏰ Backend will be pinged every ${PING_INTERVAL / 60000} minutes`); 