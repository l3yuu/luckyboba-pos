# Play Console: Data Safety Form Reference

When submitting the app to the Google Play Store, you will be required to fill out the **Data Safety** questionnaire. You can use this cheat sheet to answer the questions accurately based on the Flutter app structure we’ve built.

## 1. Data Collection and Security
*   **Does your app collect or share any of the required user data types?** -> `Yes`
*   **Is all of the user data collected by your app encrypted in transit?** -> `Yes` *(Firebase and your backend use HTTPS).*
*   **Do you provide a way for users to request that their data be deleted?** -> `Yes` *(Refer to section 5 of your Privacy Policy).*

## 2. Data Types Collected

Tick the following boxes:

### Personal Info
*   **Name:** `Collected`
*   **Email Address:** `Collected`
    *   *Is this data collected, shared, or both?* -> `Collected`
    *   *Is this data processed ephemerally?* -> `No`
    *   *Is this data required for your app, or can users choose whether it's collected?* -> `Required` (Needed for account creation / Firebase).
    *   *Why is this user data collected?* -> `App functionality`, `Account management`.

### App Info and Performance
*   **Crash logs & Diagnostics:** `Collected` (Firebase Crashlytics)
    *   *Is this data collected, shared, or both?* -> `Collected`
    *   *Is this data required for your app?* -> `Optional` (Can opt-out via iOS/Android settings).
    *   *Why is this user data collected?* -> `Analytics`.

### Location (If your app has a branch locator)
*   **Approximate Location:** `Collected`
    *   *Why?* -> `App functionality` (Finding nearest Lucky Boba).

## 3. Account Deletion
You will be asked to provide a link to the web page where users can delete their accounts. If you don't have a web portal, provide a link to an email address instructing them how to request deletion, OR note that it can be done directly inside the mobile app's profile screen.
