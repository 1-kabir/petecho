export const AUTH_COOKIE_NAME = 'petecho_auth';
export const AUTH_SECRET =
  process.env.NEXT_PUBLIC_AUTH_SECRET || 'petecho-dev-secret-change-me';
export const API_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export interface PetRecord {
  id: number;
  name: string;
  gender: string;
  typeKey: string;
  spriteKey: string;
  customSpriteUrl?: string | null;
  customRunUrl?: string | null;
  customBallUrl?: string | null;
  customPlayUrl?: string | null;
  shareToken: string;
  description: string;
  birthday: string;
  stats: {
    run: number;
    ball: number;
    play: number;
  };
  guestStats: {
    run: number;
    ball: number;
    play: number;
  };
  isReal: boolean;
  isAlive: boolean;
  createdAt: string;
}

export interface UserRecord {
  id: number;
  email: string;
  name?: string | null;
  age?: number | null;
  description?: string | null;
  profilePictureUrl?: string | null;
  pets: PetRecord[];
}

export interface ChatRecord {
  id: string;
  petId: number;
  role: 'user' | 'pet';
  text: string;
  mimeType?: string | null;
  fileUrl?: string | null;
  replyToId?: string | null;
  timestamp: string;
}

export function setAuthCookie(token: string) {
  document.cookie = `${AUTH_COOKIE_NAME}=${encodeURIComponent(token)}; Path=/; Max-Age=${60 * 60 * 24 * 7}; SameSite=Lax`;
}

export function clearAuthCookie() {
  document.cookie = `${AUTH_COOKIE_NAME}=; Path=/; Max-Age=0; SameSite=Lax`;
}

export function getAuthCookie() {
  const cookie = document.cookie
    .split('; ')
    .find((item) => item.startsWith(`${AUTH_COOKIE_NAME}=`));

  if (!cookie) {
    return null;
  }

  return decodeURIComponent(cookie.split('=').slice(1).join('='));
}

export function getUserInitial(email: string | null) {
  if (!email) {
    return 'K';
  }

  return email.trim().charAt(0).toUpperCase() || 'K';
}

export function getAuthHeaders(): Record<string, string> {
  const token = getAuthCookie();

  return token
    ? {
        Authorization: `Bearer ${token}`,
      }
    : {};
}
