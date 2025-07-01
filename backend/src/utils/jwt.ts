import jwt from 'jsonwebtoken';
import { IAuthPayload } from '../types';

export const generateAccessToken = (payload: IAuthPayload): string => {
  return jwt.sign(payload, process.env.JWT_SECRET!, {
    expiresIn: process.env.JWT_EXPIRE_TIME || '1h',
  });
};

export const generateRefreshToken = (payload: IAuthPayload): string => {
  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET!, {
    expiresIn: process.env.JWT_REFRESH_EXPIRE_TIME || '7d',
  });
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