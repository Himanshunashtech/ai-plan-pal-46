import { Purchases } from '@revenuecat/purchases-js';

const REVENUECAT_WEB_API_KEY = import.meta.env.VITE_REVENUECAT_WEB_API_KEY || 'rcb_PLACEHOLDER_KEY';

export class WebPaymentService {
    private static instance: WebPaymentService;
    private isInitialized = false;

    private constructor() { }

    static getInstance(): WebPaymentService {
        if (!WebPaymentService.instance) {
            WebPaymentService.instance = new WebPaymentService();
        }
        return WebPaymentService.instance;
    }

    async initialize(userId: string) {
        if (this.isInitialized) return;

        if (REVENUECAT_WEB_API_KEY === 'rcb_PLACEHOLDER_KEY') {
            console.warn('RevenueCat Web API Key is missing. Web payments will not work.');
            return; // Stop initialization to prevent 401 errors
        }

        try {
            Purchases.configure({
                apiKey: REVENUECAT_WEB_API_KEY,
                appUserId: userId,
            });
            this.isInitialized = true;
        } catch (error) {
            console.error('Failed to initialize RevenueCat Web SDK:', error);
        }
    }

    async getOfferings() {
        if (!this.isInitialized) {
            throw new Error('WebPaymentService not initialized');
        }
        try {
            const offerings = await Purchases.getSharedInstance().getOfferings();
            return offerings;
        } catch (error) {
            console.error('Error fetching web offerings:', error);
            throw error;
        }
    }

    async purchasePackage(rcPackage: any) {
        if (!this.isInitialized) {
            throw new Error('WebPaymentService not initialized');
        }
        try {
            const { customerInfo } = await Purchases.getSharedInstance().purchasePackage(rcPackage);
            return {
                success: true,
                customerInfo
            };
        } catch (error) {
            console.error('Error purchasing package:', error);
            return {
                success: false,
                error
            };
        }
    }

    async checkSubscriptionStatus() {
        if (!this.isInitialized) return { isPremium: false };

        try {
            const customerInfo = await Purchases.getSharedInstance().getCustomerInfo();
            // Adjust entitlement ID based on what you configured in RC dashboard
            const entitlement = customerInfo.entitlements.active['premium']; // Defaulting to 'premium'
            return {
                isPremium: !!entitlement,
                expiresAt: entitlement?.expirationDate || null
            };
        } catch (error) {
            console.error('Error checking subscription status:', error);
            return { isPremium: false };
        }
    }
}

export const webPaymentService = WebPaymentService.getInstance();
