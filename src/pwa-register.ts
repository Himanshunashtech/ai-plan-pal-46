// PWA Service Worker Registration
export function registerPWA() {
  if ('serviceWorker' in navigator && import.meta.env.PROD) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js', { scope: '/' })
        .then(registration => {
          console.log('PWA service worker registered:', registration);
          
          // Check for updates
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  // New update available
                  console.log('New PWA update available!');
                  // You can show an update notification here
                  if (confirm('A new version is available. Reload to update?')) {
                    window.location.reload();
                  }
                }
              });
            }
          });
        })
        .catch(error => {
          console.error('PWA service worker registration failed:', error);
        });
    });
  }
}

// Check if app is installed as PWA
export function isPWAInstalled(): boolean {
  return window.matchMedia('(display-mode: standalone)').matches || 
         (window.navigator as any).standalone === true;
}

// Prompt user to install PWA
export function showInstallPrompt(): void {
  const installPrompt = (window as any).deferredPrompt;
  if (installPrompt) {
    installPrompt.prompt();
    installPrompt.userChoice.then((choiceResult: any) => {
      if (choiceResult.outcome === 'accepted') {
        console.log('User accepted the install prompt');
      } else {
        console.log('User dismissed the install prompt');
      }
      (window as any).deferredPrompt = null;
    });
  }
}