require('dotenv').config();

console.log('🔍 Environment Variables Debug');
console.log('==============================');

const requiredVars = [
  'MONGODB_URI',
  'JWT_SECRET',
  'JWT_REFRESH_SECRET',
  'JWT_EXPIRE_TIME',
  'JWT_REFRESH_EXPIRE_TIME',
  'PORT',
  'NODE_ENV'
];

console.log('\nRequired Environment Variables:');
requiredVars.forEach(varName => {
  const value = process.env[varName];
  const status = value ? '✅ SET' : '❌ MISSING';
  const displayValue = value ? (varName.includes('SECRET') ? '***HIDDEN***' : value) : 'undefined';
  console.log(`${status} ${varName}: ${displayValue}`);
});

console.log('\nOptional Environment Variables:');
const optionalVars = [
  'RATE_LIMIT_WINDOW_MS',
  'RATE_LIMIT_MAX_REQUESTS',
  'SMTP_HOST',
  'SMTP_PORT',
  'SMTP_USER',
  'SMTP_PASS',
  'EMAIL_FROM',
  'FRONTEND_URL'
];

optionalVars.forEach(varName => {
  const value = process.env[varName];
  const status = value ? '✅ SET' : '⚠️  NOT SET';
  const displayValue = value ? (varName.includes('PASS') ? '***HIDDEN***' : value) : 'undefined';
  console.log(`${status} ${varName}: ${displayValue}`);
});

console.log('\n📋 Quick Fix Instructions:');
console.log('1. Create a .env file in the backend directory');
console.log('2. Add the following required variables:');
console.log('   MONGODB_URI=mongodb://localhost:27017/afterink-invoice');
console.log('   JWT_SECRET=your-super-secret-jwt-key-here');
console.log('   JWT_REFRESH_SECRET=your-super-secret-refresh-jwt-key-here');
console.log('   JWT_EXPIRE_TIME=1h');
console.log('   JWT_REFRESH_EXPIRE_TIME=7d');
console.log('   PORT=5000');
console.log('   NODE_ENV=development');
console.log('\n3. Restart your server after adding the .env file'); 