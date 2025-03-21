// Portal URL
const arcgisPortalUrl = "https://cbimaps.tamucc.edu/portal"

// Use these resources: https://developers.arcgis.com/javascript/latest/sample-code/identity-oauth-basic/ and https://github.com/Esri/jsapi-resources/tree/main/oauth and https://github.com/EsriDevEvents/jaspi_oauth2_snippet/blob/master/jaspi_oauth2_snippet.tsx
// Import core Esri packages and use them
require(["esri/identity/OAuthInfo", "esri/identity/IdentityManager", "esri/portal/Portal"], (OAuthInfo, EsriId, Portal) => {

    console.log("imported packages!");
    // Create an OAuthInfo object associated with our web app / OAuth key
    const oAuthInfo = new OAuthInfo({
        appId: "AWimXkIUXWwB90tA",
        portalUrl: arcgisPortalUrl,
        popupCallbackUrl: "http://127.0.0.1:3000/oauth-callback.html", // TODO: remove this after
        popup: true,
    });
    // Create a new Portal object
    portal = new Portal({
        url: arcgisPortalUrl,
    });
    
    async function connectToPortal() {
        // Add OAuthInfo to the IdentityManager
        EsriId.registerOAuthInfos([oAuthInfo]);
        // Check if the user is signed in
        checkSignIn();
    }

    async function checkSignIn() {
        try {
            // Check sign in status
            await EsriId.checkSignInStatus(oAuthInfo.portalUrl + "/sharing");
            // If signed in, success!
            console.log("Success!");
            // Load the portal object
            const portal = new Portal({
                url: arcgisPortalUrl,
                authMode: "immediate",
            });
            await portal.load();
            // Print username
            console.log(`Signed in as ${portal.user.username}`);
        }
        catch {
            // Not signed in?
            await signInOrOut();
        }
    }

    // Sign the user in or out
    async function signInOrOut() {
        EsriId
            .checkSignInStatus(oAuthInfo.portalUrl + "/sharing")
            .then(() => {
                // TODO: If they're already signed in, destroy credentials to sign out.
            })
            .catch(() => {
                // If they're not signed in, generate a new credential
                EsriId
                    .getCredential(oAuthInfo.portalUrl + "/sharing", {
                        // Either false or true to control whether a dialog shows up before the oauth popup window is open
                        oAuthPopupConfirmation: true,
                    })
                    .then(() => {
                        // Once a credential is returned from the promise, check the sign in status to query the portal for items
                        checkSignIn();
                    })
            })
    }

    $('#arcgisPortalLogin').click(() => {
        connectToPortal();
    })
});