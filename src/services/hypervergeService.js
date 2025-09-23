const HV_CONFIG = {
  appId: process.env.REACT_APP_HV_APP_ID,
  appKey: process.env.REACT_APP_HV_APP_KEY,
  workflowId: process.env.REACT_APP_HV_WORKFLOW_ID,
  baseUrl: 'https://phl-orion.hyperverge.co'
};

class HyperVergeService {
  constructor() {
    this.accessToken = null;
    this.sdkLoaded = false;
    this.checkSDKLoaded();
  }

  // Check if SDK is loaded and prefetch if needed
  checkSDKLoaded() {
    console.log('Starting SDK load check...');
    let attempts = 0;
    
    const checkInterval = setInterval(() => {
      attempts++;
      console.log(`SDK check attempt ${attempts}:`, {
        HyperKYCModule: !!window.HyperKYCModule,
        HyperKycConfig: !!window.HyperKycConfig,
        windowKeys: Object.keys(window).filter(k => k.toLowerCase().includes('hyper'))
      });
      
      if (window.HyperKYCModule && window.HyperKycConfig) {
        console.log('HyperVerge SDK loaded successfully');
        this.sdkLoaded = true;
        
        // Prefetch as per documentation
        try {
          window.HyperKYCModule.prefetch({
            appId: HV_CONFIG.appId,
            workflowId: HV_CONFIG.workflowId
          });
          console.log('SDK prefetch initiated');
        } catch (error) {
          console.log('Prefetch error (non-critical):', error);
        }
        
        clearInterval(checkInterval);
      }
    }, 500);

    // Stop checking after 15 seconds
    setTimeout(() => {
      clearInterval(checkInterval);
      if (!this.sdkLoaded) {
        console.error('HyperVerge SDK failed to load within 15 seconds');
        console.log('Final window check:', {
          HyperKYCModule: !!window.HyperKYCModule,
          HyperKycConfig: !!window.HyperKycConfig,
          allWindowProps: Object.keys(window).filter(k => k.toLowerCase().includes('hyper'))
        });
      }
    }, 15000);
  }

  // Generate access token (using the working token from curl test for now)
  async getAccessToken() {
    if (this.accessToken) return this.accessToken;

    // For now, let's use a hardcoded token that we know works
    // This is temporary until we solve the CORS issue
    this.accessToken = "Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJhcHBJZCI6InY5cmI1ZyIsImhhc2giOiJhMmNmOGRiNGQ1YmYzMGE3OGVkNzczZmZkOGJjMWNiZWZhNGE1MWQ1OWUwMzc2MjQ4ZTIxZGI5ZjJmMjIwNmFiIiwiaWF0IjoxNzU4NjI2NTQ4LCJleHAiOjE3NTg2MzAxNDgsImp0aSI6IjIwMGRkZDliLTk3MDEtNDc5OS1iNmI1LTdmNTI0MmQxY2Q3YyJ9.xVyUcdWbMCWZre-NjgsSSNIpxUQdQYqM6H_Ymy1h6wUUuYRXxNsDT5qxgrztqey-3fGm7JRUbKLnZseG3YMNgExWjoqfWL2sXzb6Fvb9yW4vM1HUTIGxdMi8WBockDjp12kNhjdsnEQPWCyyWw4DI";
    console.log('Using hardcoded token for testing');
    return this.accessToken;
  }

  // Generate unique transaction ID
  generateTransactionId() {
    return 'txn_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

    // Launch HyperVerge SDK
  async launchSDK(transactionId, onResult) {
    try {
      console.log('Launching SDK with transactionId:', transactionId);
      
      // First, let's create a functional mock until we get the right workflow
      console.log('Using mock implementation until workflow ID is resolved');
      
      // Simulate the workflow steps from your README:
      // 1. ID Input Form
      // 2. Selfie Liveness 
      // 3. Face Dedupe API
      
      setTimeout(async () => {
        try {
          // Simulate calling the face dedupe API directly
          const mockResult = await this.simulateEnrolWorkflow(transactionId);
          if (onResult) onResult(mockResult);
        } catch (error) {
          if (onResult) {
            onResult({
              status: 'error',
              transactionId: transactionId,
              error: error.message
            });
          }
        }
      }, 2000);

    } catch (error) {
      console.error('Error launching SDK:', error);
      
      if (onResult) {
        onResult({
          status: 'error',
          transactionId: transactionId,
          error: error.message
        });
      }
    }
  }

  // Simulate the enrol workflow manually
  async simulateEnrolWorkflow(transactionId) {
    console.log('Simulating realistic food authentication workflow...');
    
    // Step 1: Simulate employee ID (in real system, this would come from employee database)
    const mockIdNumber = 'EMP_' + Math.floor(Math.random() * 9000 + 1000);
    console.log('Employee ID:', mockIdNumber);
    
    // Step 2: Simulate camera access and selfie capture
    console.log('Camera access granted, capturing selfie...');
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate capture time
    
    // Step 3: Simulate liveness detection
    console.log('Running liveness detection...');
    await new Promise(resolve => setTimeout(resolve, 500)); // Simulate processing
    
    // Step 4: Simulate face matching against employee database
    console.log('Checking against employee database...');
    await new Promise(resolve => setTimeout(resolve, 800)); // Simulate API call
    
    // Randomly simulate different outcomes (mostly success for demo)
    const outcomes = [
      { status: 'auto_approved', probability: 0.85 },
      { status: 'auto_declined', probability: 0.10 },
      { status: 'needs_review', probability: 0.05 }
    ];
    
    const random = Math.random();
    let cumulativeProbability = 0;
    let selectedOutcome = outcomes[0];
    
    for (const outcome of outcomes) {
      cumulativeProbability += outcome.probability;
      if (random <= cumulativeProbability) {
        selectedOutcome = outcome;
        break;
      }
    }
    
    return {
      status: selectedOutcome.status,
      transactionId: transactionId,
      userId: mockIdNumber,
      matches: selectedOutcome.status === 'auto_approved' ? 1 : 0,
      mismatchCount: selectedOutcome.status === 'auto_declined' ? 1 : 0,
      blockCount: 0,
      mockWorkflow: true,
      timestamp: new Date().toISOString()
    };
  }
}

const hypervergeService = new HyperVergeService();
export default hypervergeService;