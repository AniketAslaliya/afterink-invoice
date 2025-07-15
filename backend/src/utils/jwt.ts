import jwt, { Secret, SignOptions } from 'jsonwebtoken';
import { IAuthPayload } from '../types';

export const generateAccessToken = (payload: IAuthPayload): string => {
  const secret: Secret = process.env.JWT_SECRET as Secret;
  if (!secret) {
    console.error('JWT_SECRET is not defined in environment variables');
    console.error('Available environment variables:', Object.keys(process.env).filter(key => key.includes('JWT')));
    throw new Error('JWT_SECRET is not defined');
  }
  const options: SignOptions = { expiresIn: (process.env.JWT_EXPIRE_TIME || '1h') as any };
  return jwt.sign(payload, secret, options);
};

export const generateRefreshToken = (payload: IAuthPayload): string => {
  const secret: Secret = process.env.JWT_REFRESH_SECRET as Secret;
  if (!secret) {
    console.error('JWT_REFRESH_SECRET is not defined in environment variables');
    console.error('Available environment variables:', Object.keys(process.env).filter(key => key.includes('JWT')));
    throw new Error('JWT_REFRESH_SECRET is not defined');
  }
  const options: SignOptions = { expiresIn: (process.env.JWT_REFRESH_EXPIRE_TIME || '7d') as any };
  return jwt.sign(payload, secret, options);
};

export const verifyAccessToken = (token: string): IAuthPayload => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET!) as IAuthPayload;
  } catch (error) {
    throw new Error('Invalid or expired access token');
  }
};

export const verifyRefreshToken = (token: string): IAuthPayload => {
  try {
    return jwt.verify(token, process.env.JWT_REFRESH_SECRET!) as IAuthPayload;
  } catch (error) {
    throw new Error('Invalid or expired refresh token');
  }
};

export const decodeToken = (token: string): any => {
  return jwt.decode(token);
};

export const generateTokenPair = (payload: IAuthPayload) => {
  return {
    accessToken: generateAccessToken(payload),
    refreshToken: generateRefreshToken(payload),
  };
}; 