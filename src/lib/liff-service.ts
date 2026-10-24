'use client';

import liff from '@line/liff';

export interface LiffUserProfile {
  userId: string;
  displayName: string;
  pictureUrl?: string;
  statusMessage?: string;
}

class LiffService {
  private isInitialized = false;
  private profile: LiffUserProfile | null = null;
  private liffId = process.env.NEXT_PUBLIC_LINE_LIFF_ID || '';

  /**
   * Initialize LIFF SDK in the browser
   */
  public async init(): Promise<{ success: boolean; isInClient: boolean; profile: LiffUserProfile | null; error?: string }> {
    if (typeof window === 'undefined') {
      return { success: false, isInClient: false, profile: null, error: 'Server-side environment' };
    }

    if (this.isInitialized && this.profile) {
      return {
        success: true,
        isInClient: liff.isInClient(),
        profile: this.profile,
      };
    }

    const activeLiffId = (this.liffId || process.env.NEXT_PUBLIC_LINE_LIFF_ID || '').trim();

    if (!activeLiffId) {
      // Graceful fallback when LIFF ID is not set yet in environment
      return {
        success: false,
        isInClient: false,
        profile: null,
        error: 'NEXT_PUBLIC_LINE_LIFF_ID is not configured',
      };
    }

    try {
      await liff.init({ liffId: activeLiffId });
      this.liffId = activeLiffId;
      this.isInitialized = true;

      const isInClient = liff.isInClient();

      if (liff.isLoggedIn()) {
        const rawProfile = await liff.getProfile();
        this.profile = {
          userId: rawProfile.userId,
          displayName: rawProfile.displayName,
          pictureUrl: rawProfile.pictureUrl,
          statusMessage: rawProfile.statusMessage,
        };

        // Cache user ID locally
        localStorage.setItem('ud_patient_line_user_id', rawProfile.userId);

        return {
          success: true,
          isInClient,
          profile: this.profile,
        };
      }

      return {
        success: true,
        isInClient,
        profile: null,
      };
    } catch (err: unknown) {
      console.warn('LIFF init error:', err);
      return {
        success: false,
        isInClient: false,
        profile: null,
        error: err instanceof Error ? err.message : 'Unknown LIFF error',
      };
    }
  }

  public getProfile(): LiffUserProfile | null {
    return this.profile;
  }

  public getUserId(): string | null {
    if (this.profile?.userId) return this.profile.userId;
    if (typeof window !== 'undefined') {
      return localStorage.getItem('ud_patient_line_user_id') || null;
    }
    return null;
  }

  public isInLineClient(): boolean {
    if (typeof window === 'undefined') return false;
    try {
      return liff.isInClient();
    } catch {
      return false;
    }
  }
}

export const liffService = new LiffService();
