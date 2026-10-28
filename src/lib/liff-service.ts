'use client';

export interface LiffUserProfile {
  userId: string;
  displayName: string;
  pictureUrl?: string;
  statusMessage?: string;
}

class LiffService {
  private isInitialized = false;
  private initPromise: Promise<{ success: boolean; isInClient: boolean; profile: LiffUserProfile | null; error?: string }> | null = null;
  private profile: LiffUserProfile | null = null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private liffInstance: any = null;
  private liffId = process.env.NEXT_PUBLIC_LINE_LIFF_ID || '';

  /**
   * Initialize LIFF SDK in the browser safely with dynamic import and timeout protection
   */
  public async init(): Promise<{ success: boolean; isInClient: boolean; profile: LiffUserProfile | null; error?: string }> {
    if (typeof window === 'undefined') {
      return { success: false, isInClient: false, profile: null, error: 'Server-side environment' };
    }

    if (this.isInitialized && this.profile) {
      return {
        success: true,
        isInClient: this.liffInstance ? Boolean(this.liffInstance.isInClient()) : false,
        profile: this.profile,
      };
    }

    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = (async () => {
      const activeLiffId = (this.liffId || process.env.NEXT_PUBLIC_LINE_LIFF_ID || '').trim();

      if (!activeLiffId) {
        return {
          success: false,
          isInClient: false,
          profile: null,
          error: 'NEXT_PUBLIC_LINE_LIFF_ID is not configured',
        };
      }

      try {
        // Dynamically import @line/liff in browser runtime only
        const liffModule = await import('@line/liff');
        const liff = liffModule.default || liffModule;
        this.liffInstance = liff;

        // Init with 6-second timeout to prevent hanging the webview on mobile network glitch
        const initAction = liff.init({ liffId: activeLiffId });
        const timeoutAction = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('LIFF init timeout')), 6000)
        );

        await Promise.race([initAction, timeoutAction]);
        this.liffId = activeLiffId;
        this.isInitialized = true;

        const isInClient = Boolean(liff.isInClient());

        if (liff.isLoggedIn()) {
          try {
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
          } catch (profileErr) {
            console.warn('Failed to get LIFF profile:', profileErr);
          }
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
    })();

    return this.initPromise;
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
      return this.liffInstance ? Boolean(this.liffInstance.isInClient()) : false;
    } catch {
      return false;
    }
  }
}

export const liffService = new LiffService();
