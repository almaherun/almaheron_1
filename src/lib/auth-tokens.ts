import { SignJWT, jwtVerify } from 'jose';

// التحقق من وجود JWT_SECRET وقوته
const JWT_SECRET = process.env.JWT_SECRET || 'default_jwt_secret_for_development_only_not_secure_minimum_32_chars';

if (!process.env.JWT_SECRET && process.env.NODE_ENV === 'production') {
  console.warn('⚠️ JWT_SECRET environment variable is not set in production');
}

if (JWT_SECRET.length < 32) {
  console.warn('⚠️ JWT_SECRET should be at least 32 characters long');
}

const secret = new TextEncoder().encode(process.env.JWT_SECRET);

export async function createSessionToken(userId: string, role: string, email: string) {
  const token = await new SignJWT({ 
    uid: userId, 
    role, 
    email,
    iat: Math.floor(Date.now() / 1000)
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('7d')
    .setIssuedAt()
    .sign(secret);

  return token;
}

export async function verifySessionToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload;
  } catch (error) {
    return null;
  }
}

// إزالة functions التي تستخدم cookies من هنا
