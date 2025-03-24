// Portal URL
const arcgisPortalUrl = "https://cbimaps.tamucc.edu/portal"

// Use these resources: https://developers.arcgis.com/javascript/latest/sample-code/identity-oauth-basic/ and https://github.com/Esri/jsapi-resources/tree/main/oauth and https://github.com/EsriDevEvents/jaspi_oauth2_snippet/blob/master/jaspi_oauth2_snippet.tsx
// Import core Esri packages
require(["esri/identity/OAuthInfo", "esri/identity/IdentityManager", "esri/portal/Portal"], (OAuthInfo, EsriId, Portal) => {

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
            // Load the portal object
            const portal = new Portal({
                url: arcgisPortalUrl,
                authMode: "immediate",
            });
            await portal.load();
            // Add username to UI
            // Hide "you're not signed in" message
            $("#notSignedIn").addClass("d-none");
            // Hide "connect to portal" button
            $("#arcgisPortalLogin").addClass("d-none");
            // Construct sign-in message
            $("#signedInMessage")
                .html(`You are signed in on
                        <span class="fw-bold">${portal.url}</span> as
                        <span class="fw-bold">${portal.user.username}</span>`
                );
            // Display sign-in message
            $("#signedIn").removeClass("d-none");
        }
        catch {
            // Not signed in? Use the sign-in function.
            await signInOrOut();
        }
    }

    // Sign the user in or out
    async function signInOrOut() {
        try {
            // Check if user's signed in already...
            await EsriId.checkSignInStatus(oAuthInfo.portalUrl + "/sharing");
            // ...if so, destroy their credentials.
            EsriId.destroyCredentials();
            window.location.reload();
        }
        catch {
            // ...otherwise, generate a new credential.
            try {
                // Prompt the user for credentials
                await EsriId.getCredential(oAuthInfo.portalUrl + "/sharing", {
                    oAuthPopupConfirmation: true,
                });
                // Once that's done, check their sign-in status.
                checkSignIn();
            }
            catch {
                // We failed to get the user's credentials for some reason.
                console.log("Failed to get user credentials.");
            }
        }
    }

    // Handle connect to portal button press
    $('#arcgisPortalLogin').click(() => {
        connectToPortal();
    });
    // Handle sign out button press
    $('#arcgisPortalSignOut').click(() => {
        signInOrOut();
    });
});