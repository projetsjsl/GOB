/// <reference types="vite/client" />

// Déclarations de types pour les bibliothèques CDN globales
declare global {
  interface Window {
    Chart: any;
    Recharts: any;
    LightweightCharts: any;
    __GOB_DASHBOARD_MOUNTED?: boolean;
    __nativeLocalStorage?: Storage;
    __nativeSessionStorage?: Storage;
    GOB_AUTH?: {
      user: any;
      permissions: any;
      canSaveConversations: boolean;
      canViewHistory: boolean;
      canViewAllHistory: boolean;
    };
    authGuard?: any;
  }
}

// Permettre l'utilisation directe sans window.
declare const Chart: any;
declare const Recharts: any;
declare const LightweightCharts: any;

export {}
