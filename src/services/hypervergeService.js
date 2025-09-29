const HV_CONFIG = {
  appId: process.env.REACT_APP_HV_APP_ID,
  appKey: process.env.REACT_APP_HV_APP_KEY,
  workflowId: process.env.REACT_APP_HV_WORKFLOW_ID,
  accessToken: process.env.REACT_APP_HV_ACCESS_TOKEN // optional for dev only
};

class HyperVergeService {
  constructor() {
    this.sdkLoaded = false;
  }

  // Loads the HyperVerge SDK script if not already loaded
  loadSDK() {
    return new Promise((resolve, reject) => {
      if (window.HyperKYCModule) {
        this.sdkLoaded = true;
        resolve();
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://websdk.hyperverge.co/v2.0/hv-sdk.js';
      script.async = true;
      script.onload = () => {
        this.sdkLoaded = true;
        resolve();
      };
      script.onerror = (e) => reject(new Error('Failed to load HyperVerge SDK script'));
      document.body.appendChild(script);
    });
  }

  // Launches the real HyperVerge workflow with diagnostics
  /**
   * Launches the HyperVerge workflow.
   * @param {string} transactionId
   * @param {function} callback
   * @param {object} [workflowInputs] - Optional workflow inputs (e.g., { bvnPhoto: ... })
   */
  async launchSDK(transactionId, callback, workflowInputs) {
    await this.loadSDK();

    if (!window.HyperKYCModule) {
      callback({ status: 'error', message: 'HyperVerge SDK failed to load' });
      return;
    }

  // Normalize access token: SDK expects "Bearer <token>"
  let token = HV_CONFIG.accessToken;
    // Log all launch parameters and Firebase env
    console.log('Launching HyperVerge SDK with config:', {
      appId: HV_CONFIG.appId,
      appKey: HV_CONFIG.appKey,
      workflowId: HV_CONFIG.workflowId,
      accessToken: token,
      transactionId,
      envFirebase: {
        apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
        authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
        projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
        storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
        appId: process.env.REACT_APP_FIREBASE_APP_ID,
        measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID,
      }
    });
    if (token) {
      token = token.trim();
      if (!token.toLowerCase().startsWith('bearer ')) {
        token = 'Bearer ' + token;
      }
      // mask token for logs
      const masked = token.slice(0, 6) + '...' + token.slice(-6);
      console.warn('Using REACT_APP_HV_ACCESS_TOKEN from env (dev only). token=', masked);
      // Try to decode the JWT payload (helpful to check appId / expiry)
      try {
        const raw = token.replace(/^Bearer\s+/i, '');
        const parts = raw.split('.');
        if (parts.length >= 2) {
          // base64 decode (browser runtime)
          const b64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
          const json = decodeURIComponent(Array.prototype.map.call(atob(b64), function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
          }).join(''));
          const payload = JSON.parse(json);
          // Log only safe, small diagnostics
          const info = {
            keys: Object.keys(payload),
            exp: payload.exp ? new Date(payload.exp * 1000).toISOString() : undefined,
            iat: payload.iat ? new Date(payload.iat * 1000).toISOString() : undefined,
            appIdCandidate: payload.appId || payload.aid || payload.a || payload.iss || undefined
          };
          console.info('Decoded HV access token payload info:', info);
        } else {
          console.info('Access token does not look like a JWT (no dot-separated parts)');
        }
      } catch (err) {
        console.warn('Could not parse JWT payload for diagnostics', err);
      }
    }

    console.log('Launching HyperVerge with:', {
      appId: HV_CONFIG.appId,
      workflowId: HV_CONFIG.workflowId,
      transactionId,
      usingAccessToken: !!token
    });

    if (!HV_CONFIG.workflowId) {
      callback({ status: 'error', message: 'Missing HyperVerge workflow id (REACT_APP_HV_WORKFLOW_ID)' });
      return;
    }

    // Diagnostic: inspect SDK object
    try {
      console.log('HyperKYCModule keys:', Object.keys(window.HyperKYCModule || {}));
      if (window.HyperKYCModule && window.HyperKYCModule.getVersion) {
        try {
          console.log('Hyper SDK version:', window.HyperKYCModule.getVersion());
        } catch (e) {
          // ignore
        }
      }
    } catch (e) {
      console.warn('Could not inspect HyperKYCModule', e);
    }

    // Watchdog: if SDK never calls back, return an error after timeout
    let finished = false;
    const watchdog = setTimeout(() => {
      if (!finished) {
        finished = true;
        console.error('HyperVerge SDK timeout: no callback received within 30s');
        callback({ status: 'error', message: 'SDK timeout: no response', transactionId });
      }
    }, 30000);

    // Launch using the accessToken-based constructor if token is present
    try {
      if (token && window.HyperKycConfig) {
        // Support passing workflowInputs (e.g., { bvnPhoto }) for workflows that require them
        let cfg;
        if (HV_CONFIG.appId && workflowInputs) {
          console.log('Passing explicit appId and workflowInputs to HyperKycConfig');
          cfg = new window.HyperKycConfig(token, HV_CONFIG.workflowId, transactionId, HV_CONFIG.appId, workflowInputs);
        } else if (HV_CONFIG.appId) {
          console.log('Passing explicit appId to HyperKycConfig to avoid appId=undefined in workflow fetch');
          cfg = new window.HyperKycConfig(token, HV_CONFIG.workflowId, transactionId, HV_CONFIG.appId);
        } else if (workflowInputs) {
          console.log('Passing workflowInputs to HyperKycConfig');
          cfg = new window.HyperKycConfig(token, HV_CONFIG.workflowId, transactionId, workflowInputs);
        } else {
          cfg = new window.HyperKycConfig(token, HV_CONFIG.workflowId, transactionId);
        }
        window.HyperKYCModule.launch(cfg, (result) => {
          if (finished) return;
          finished = true;
          clearTimeout(watchdog);
          console.log('HyperKYC callback result:', result);
          callback(result);
        });
        return;
      }

      // Otherwise, SDK requires a server-generated access token. We cannot safely generate access tokens client-side in production.
      // Try the older options object launch (may not be supported by SDK versions that expect an access token)
      window.HyperKYCModule.launch({
        appId: HV_CONFIG.appId,
        appKey: HV_CONFIG.appKey,
        workflowId: HV_CONFIG.workflowId,
        transactionId,
        onSuccess: (result) => {
          if (finished) return;
          finished = true;
          clearTimeout(watchdog);
          console.log('HyperKYC onSuccess:', result);
          callback(result);
        },
        onError: (error) => {
          if (finished) return;
          finished = true;
          clearTimeout(watchdog);
          console.error('HyperKYC onError:', error);
          callback({ status: 'error', error });
        },
        onProgress: (p) => console.debug('HyperKYC progress:', p)
      });
    } catch (err) {
      if (!finished) {
        finished = true;
        clearTimeout(watchdog);
        console.error('HyperKYC launch threw:', err);
        callback({ status: 'error', message: 'SDK launch threw', error: String(err) });
      }
    }
  }

  // Generates a random transaction ID
  generateTransactionId() {
    return 'txn_' + Math.random().toString(36).substr(2, 9);
  }
}

const hypervergeService = new HyperVergeService();
export default hypervergeService;