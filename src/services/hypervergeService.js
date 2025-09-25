const HV_CONFIG = {
  appId: process.env.REACT_APP_HV_APP_ID,
  appKey: process.env.REACT_APP_HV_APP_KEY,
  workflowId: process.env.REACT_APP_HV_WORKFLOW_ID, // should be 'enrol'
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
      script.onerror = reject;
      document.body.appendChild(script);
    });
  }

  // Launches the real HyperVerge workflow
  async launchSDK(transactionId, callback) {
    await this.loadSDK();

    if (!window.HyperKYCModule) {
      callback({ status: 'error', message: 'HyperVerge SDK failed to load' });
      return;
    }

    // Debug: Log config values
    console.log('Launching HyperVerge with:', {
      appId: HV_CONFIG.appId,
      appKey: HV_CONFIG.appKey,
      workflowId: HV_CONFIG.workflowId,
      transactionId
    });

    if (!HV_CONFIG.appId || !HV_CONFIG.appKey || !HV_CONFIG.workflowId) {
      callback({ status: 'error', message: 'Missing HyperVerge config env vars', config: HV_CONFIG });
      return;
    }

    window.HyperKYCModule.launch({
      appId: HV_CONFIG.appId,
      appKey: HV_CONFIG.appKey,
      workflowId: HV_CONFIG.workflowId,
      transactionId,
      // Optionally, you can pass userData, locale, etc.
      onSuccess: (result) => callback(result),
      onError: (error) => callback({ status: 'error', error }),
    });
  }

  // Generates a random transaction ID
  generateTransactionId() {
    return 'txn_' + Math.random().toString(36).substr(2, 9);
  }
}

const hypervergeService = new HyperVergeService();
export default hypervergeService;