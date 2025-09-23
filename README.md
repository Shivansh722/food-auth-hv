# Food Authentication System

A web application for employee food authentication using HyperVerge face recognition SDK, replacing traditional QR code systems.

## 🚀 Quick Start

### 1. Environment Setup
```bash
# Clone the repository
git clone <repository-url>
cd food-auth-hv

# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Fill in your credentials in .env file
```

### 2. Configure Environment Variables
Edit `.env` file with your credentials:
```
REACT_APP_FIREBASE_API_KEY=your_firebase_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id
REACT_APP_FIREBASE_MEASUREMENT_ID=your_measurement_id

REACT_APP_HV_APP_ID=your_hyperverge_app_id
REACT_APP_HV_APP_KEY=your_hyperverge_app_key
REACT_APP_HV_WORKFLOW_ID=your_workflow_id
```

### 3. Run the Application
```bash
npm start
```

Access the app at `http://localhost:3000`
Admin dashboard at `http://localhost:3000/admin`

## 📁 Project Structure

```
src/
├── components/
│   ├── AuthPage.js          # User authentication interface
│   └── AdminDashboard.js    # Admin panel for viewing logs
├── firebase/
│   └── config.js           # Firebase configuration
├── services/
│   └── hypervergeService.js # HyperVerge SDK integration
└── App.js                  # Main app component
```

## 🔒 Security Notes

- Never commit `.env` files to git
- Firebase config contains sensitive API keys
- HyperVerge credentials should be kept secure
- Use environment variables in production

---

## HyperVerge Integration Details

orkflowId : `enrol`

Inputs Required: None

Endpoints to be checked: Orion

Description:

1. Form to Input ID number
2. Selfie Liveness
3. Selfie+ID enrol

{
"name": "Face + ID number Enrol Workflow",
"description": "ID Form Input + Liveness + Dedupe",
"properties":{
"name": "Face + ID number Enrol Workflow",
"description": "ID Form Input + Liveness + Dedupe",
"sdkVersions": {
"mobile": {
"maximum": "10.0.0",
"minimum": "0.2.0"
},
"web": {
"maximum": "10.0.0",
"minimum": "5.0.0"
}
},
"enableResumeWorkflow": false
},
"modules": [
{
"type": "countries",
"subType": "countries",
"id": "module_countryPicker",
"nextStep": "module_idInputForm",
"properties": {
"countriesSupported": [
"idn"
]
}
},
{
"type": "dynamicForm",
"subType": "form",
"id": "module_idInputForm",
"nextStep": "",
"properties": {
"sections": [
{
"id": "idForm",
"components": [
{
"id": "titleLabel",
"type": "label",
"subType": "title",
"text": "Enter your ID number"
},
{
"id": "descLabel",
"type": "label",
"subType": "subTitle",
"text": "This ID number will be used as unique identifier for your selfie"
},
{
"id": "idNumber",
"type": "text",
"title": "Unique ID",
"required": "yes",
"keyboard": "text",
"enabled": "yes",
"validation": [{
"type": "regex",
"value": "[A-Za-z0-9_]+",
"errorMsg": "Hmm, your Unique ID doesn’t look right. Please check it again."
}],
"onValidated": {
"reloadComponents": ["proceedButton"]
},
"onChange": {
"reloadComponents": [
"proceedButton"
]
}
},
{
"id": "proceedButton",
"type": "button",
"subType": "primary",
"text": "Continue",
"enabled":"(module_idInputForm.idNumber.isValid == 'yes')",
"onClick": {
"nextStep": "module_liveness"
}
}
]
}
]
}
},

{
"type": "face",
"subType": "selfie_validation",
"id": "module_liveness",
"nextStep": "condition_postLiveness",
"properties": {
"url": "{module_countryPicker.baseUrl}/v1/checkLiveness",
"showInstruction": true,
"showReview": false
},
"variables": [
{
"name": "action",
"path": "response.result.summary.action"
},
{
"name": "selfieRequestId",
"path": "response.metadata.requestId"
}
]
},
{
"type": "api",
"subType": "face_dedupe_api",
"id": "module_dedupe",
"nextStep": "condition_postDedupe",
"properties": {
"url": "https://phl-orion.hyperverge.co/v2/search",
"apiType": "multipart_post",
"headers": {
"moduleId": "module_dedupe"
},
"requestParameters": [{
"name": "transactionId",
"value": "inputs.transactionId",
"type": "string"
},
{
"name": "selfie",
"value": "module_liveness.fullImagePath",
"type": "image"
},
{
"name": "block",
"value": "no",
"type": "string"
},
{
"name": "enrol",
"value": "yes",
"type": "string"
},
{
"name": "ignoreSelfieQuality",
"value": "yes",
"type": "string"
},
{
"name": "idNumber",
"value": "module_idInputForm.idNumber.value",
"type": "string"
},
{
"name": "idType",
"value": "pan",
"type": "string"
}
]
},
"variables": [{
"name": "matchCount",
"path": "response.result.data.matches.count"
},
{
"name": "mismatchCount",
"path": "response.result.data.suspiciousMatches.count"
},
{
"name": "blockCount",
"path": "response.result.data.blocklist.count"
}
]
}
],
"conditions": {
"condition_postLiveness": {
"if_false": "decline",
"if_true": "module_dedupe",
"rule": "module_liveness.action == 'pass'"
},
"condition_postDedupe": {
"if_false": "decline",
"if_true": "approve",
"rule": "(module_dedupe.matchCount == 0) && (module_dedupe.mismatchCount == 0) && (module_dedupe.blockCount == 0)"
}
},
"sdkResponse": {
"Matches": "module_dedupe.matchCount",
"Block Matches": "module_dedupe.blockCount"
}
}

| selfie_flow | Selfie Capture + Liveness Check + QC | /checkLiveness |
| --- | --- | --- |

Cursor Prompt

So I've to create a webapp in which replaces a system where currently in office we have a qr code stuck on the wall on scanning the qr u r authenticated from the company email that you had food at a particular time

so I have to make it using my company's web sdk which will caputure the image of user through the website and do it

also there is an enrol API call which I can make to register any of the new company faces

so basically as of now we don't have the sdk thing or enrol thing to worry about really, let's focus on having a frontend for the users to authenticate and a dashboard for the admin

also use firebase for the backend service to take care of everything

also - one thing is very clear, the codebase should be as clean as possible, keep the code concise with no bullshit, just write what's required nothing else at all, keep it very short very readable

## enrol:

Yes, when you make an enrol API call with a face image in the “HV face auth” workflow, it **does check against a list of already existing people**—but not by name, rather by face data and the provided ID number.

Here’s how it works based on the documentation:

- The workflow collects a unique ID number from the user and captures a selfie (face image).
- The **enrol API call** (‎⁠https://phl-orion.hyperverge.co/v2/search⁠) is made with the selfie, ID number, and other parameters.
- The API module is called ‎⁠face_dedupe_api⁠. Its purpose is to check for duplicate faces (dedupe) in the system.
- The response from the API includes:
    - ‎⁠matchCount⁠: Number of matches found for the face in the database.
    - ‎⁠mismatchCount⁠: Number of suspicious matches.
    - ‎⁠blockCount⁠: Number of blocklist matches.

**Logic:**

- If ‎⁠matchCount⁠, ‎⁠mismatchCount⁠, and ‎⁠blockCount⁠ are all zero, the enrolment is approved (i.e., the face is not found in the existing database).
- If any of these counts are non-zero, the enrolment is declined (i.e., the face matches an existing entry, or is suspicious/blocked).

**Summary:**

The system checks for duplicate faces using the image and ID number, not by name. The dedupe API ensures that the same person cannot enrol multiple times with different IDs, and also checks for blocklisted or suspicious faces.

Let me know if you want a code sample or further details on how to use this API!

## WEb sdk

Integrate the Web SDK, then call the enrol (face dedupe) API with the captured selfie.

**What to do, based on these docs**

1. Set up the Web SDK in your page
    - Add the SDK script tag with the latest version.
    Example:
    ‎⁠<script src="https://hv-camera-web-sg.s3-ap-southeast-1.amazonaws.com/hyperverge-web-sdk@<INSERT_LATEST_VERSION_HERE>/src/sdk.min.js"></script>⁠
    - Generate an access token using your appId and appKey via the login API.
    See the steps in [Web SDK](https://github.com/SolutionsTeamHV/HyperKYC_Sample_Apps/tree/main/Web_SDK) and [Node.js download](https://nodejs.org/en/download).
    - Initialize and launch the SDK with a unique transactionId and your workflowId.
        - You can prefetch: ‎⁠window.HyperKYCModule.prefetch(appId:"<app-id>", workflowId:"<workflow-id>")⁠
        - Create config: ‎⁠const hyperKycConfig = new window.HyperKycConfig(accessToken, workflowId, transactionId);⁠
        - Launch: ‎⁠window.HyperKYCModule.launch(hyperKycConfig, handler);⁠
        - Handle results in the ‎⁠handler(HyperKycResult)⁠ for statuses like ‎⁠auto_approved⁠, ‎⁠auto_declined⁠, ‎⁠needs_review⁠, etc.
2. Use the “HV face auth” enrol workflow or align your workflow to it
The page defines a workflowId of enrol with modules:
    - A form to collect a unique ID number (module_idInputForm)
    - Selfie Liveness (module_liveness)
    - Face dedupe API call (module_dedupe)
    Approval rule: it approves only if matchCount, mismatchCount, and blockCount are all zero.
3. Make the enrol API call with the selfie and ID number
From the “HV face auth” doc, the API module calls Orion search with enrol parameters:
    - Endpoint: https://phl-orion.hyperverge.co/v2/search
    - Multipart fields:
        - transactionId: inputs.transactionId
        - selfie: module_liveness.fullImagePath
        - block: no
        - enrol: yes
        - ignoreSelfieQuality: yes
        - idNumber: module_idInputForm.idNumber.value
        - idType: pan
        The API returns counts: matchCount, mismatchCount, blockCount.
    - Approve if all three are zero.
    - Decline otherwise.
4. Keep an eye on logs and troubleshooting
    - For Web SDK integration flows, handle the console and SDK status handler per [Web SDK](https://github.com/SolutionsTeamHV/HyperKYC_Sample_Apps/tree/main/Web_SDK).
    - If you run into 403s, check workflowId, SDK version in the script URL, and token expiry ([JWT decode](https://jwt.io/)).
5. Optional: Frontend + Admin (from the HV face auth page notes)
    - User frontend: simple page to input ID number → capture selfie/liveness → submit.
    - Admin dashboard: view enrolments and dedupe outcomes.
    - Backend: Firebase to store transactions, statuses, and audit logs.
    The HV face auth page’s “Cursor Prompt” suggests this structure while keeping the code concise and clean.

**Quick checklist**

- Get appId/appKey; generate accessToken.
- Choose workflowId (the HV face auth page shows workflowId: enrol).
- Embed SDK, prefetch (optional), initialize HyperKycConfig with a unique transactionId.
- Build the ID input + liveness capture UI.
- On completion, submit the enrol API to [Orion search](https://phl-orion.hyperverge.co/v2/search) with selfie + idNumber.
- Approve/decline based on match/mismatch/block counts.
- Log results and surface them in your admin dashboard.

If you need, you can start from the sample integration link in [Web SDK](https://github.com/SolutionsTeamHV/HyperKYC_Sample_Apps/tree/main/Web_SDK) and adapt it to the HV face auth workflow described on the HV face auth page.

## when what:

The Web SDK handles capture and workflow; the enrol API does backend dedupe/enrol.

**Why you need both**

- **Web SDK (front‑end workflow & capture)**
    - Provides the in‑browser UI and logic to run your workflow: collect inputs, capture a selfie, perform liveness, and manage statuses.
    - Handles initialization with accessToken, workflowId, and a unique transactionId, and returns result statuses like ‎⁠auto_approved⁠, ‎⁠auto_declined⁠, ‎⁠needs_review⁠.
    - Offers prefetching to load assets sooner and a standard launch flow with a handler for outcomes. See the steps and code snippets on the Web SDK page: [Web SDK](https://github.com/SolutionsTeamHV/HyperKYC_Sample_Apps/tree/main/Web_SDK).
    - Enables consistent logging/debugging via ‎⁠GlobalWebSDKObject.globals.moduleVariablesMap⁠ and helps you troubleshoot token expiry, workflow ID, SDK version, etc.
- **Enrol API (backend dedupe/search/enrol)**
    - Processes the selfie and metadata server‑side to check for duplicates, suspicious matches, or blocklist hits.
    - In the “HV face auth” workflow, it’s the ‎⁠face_dedupe_api⁠ call to Orion Search that returns ‎⁠matchCount⁠, ‎⁠mismatchCount⁠, and ‎⁠blockCount⁠. The workflow approves only if all three are zero.
    - With ‎⁠enrol: yes⁠, it registers the face after passing dedupe checks; it’s not doing UI or capture—it’s the backend decision/check.

**How they work together**

1. You embed and launch the **Web SDK** with your ‎⁠accessToken⁠, ‎⁠workflowId⁠, and unique ‎⁠transactionId⁠ per the docs on [Web SDK](https://github.com/SolutionsTeamHV/HyperKYC_Sample_Apps/tree/main/Web_SDK).
2. The SDK runs the workflow in the browser:
    - Collects the unique ID number (if required by the workflow),
    - Captures a selfie and runs liveness,
    - Orchestrates modules and emits a final status through your ‎⁠handler⁠.
3. The workflow calls the **Enrol API** on the backend with the selfie and ID number:
    - If dedupe passes (no matches/suspicious/blocklist), the enrolment proceeds.
    - Otherwise, it’s declined or flagged.

**Mental model**

- SDK = capture + UX + orchestration + client‑side integration.
- Enrol API = server‑side identity check + dedupe + enrol decision.

Use the SDK to reliably capture and drive the flow; use the enrol API to validate and register on the backend. They’re complementary, not redundant.