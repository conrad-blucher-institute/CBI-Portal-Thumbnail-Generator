// Portal URL
const arcgisPortalUrl = "https://cbimaps.tamucc.edu/portal"
// App ID
const arcgisAppId = "AWimXkIUXWwB90tA";
// Credential object - initialize as undefined
let arcgisUserCredential = undefined;

// Use these resources: https://developers.arcgis.com/javascript/latest/sample-code/identity-oauth-basic/ and https://github.com/Esri/jsapi-resources/tree/main/oauth and https://github.com/EsriDevEvents/jaspi_oauth2_snippet/blob/master/jaspi_oauth2_snippet.tsx
// Import core Esri packages
require(["esri/identity/OAuthInfo", "esri/identity/IdentityManager", "esri/portal/Portal", "esri/portal/PortalItem"], (OAuthInfo, EsriId, Portal, PortalItem) => {

    // Create an OAuthInfo object associated with our web app / OAuth key
    const oAuthInfo = new OAuthInfo({
        appId: arcgisAppId,
        portalUrl: arcgisPortalUrl,
        popupCallbackUrl: "http://127.0.0.1:3000/oauth-callback.html", // TODO: remove this after
        popup: true,
    });
    
    // Create a new Portal object
    portal = new Portal({
        url: arcgisPortalUrl,
    });
    
    /**
     * Connects a user to the ArcGIS Portal by adding the OAuth app information to IdentityManager (which manages ArcGIS credentials) and checking the user's sign-in status.
     */
    async function connectToPortal() {
        // Add OAuthInfo to the IdentityManager
        EsriId.registerOAuthInfos([oAuthInfo]);
        // Check if the user is signed in
        checkSignIn();
    }

    /**
     * Checks whether the user is signed in or not, and changes the content displayed on the page if they're signed in. Otherwise, they're prompted to sign in.
     */
    async function checkSignIn() {
        try {
            // Check sign in status
            arcgisUserCredential = await EsriId.checkSignInStatus(oAuthInfo.portalUrl + "/sharing");
            // Load the portal object
            const portal = new Portal({
                url: arcgisPortalUrl,
                authMode: "immediate",
            });
            await portal.load();
            // Add username to UI
            // Hide signed-out div
            $("#userSignedOut").addClass("d-none");
            // Construct sign-in message
            $("#signedInMessage")
                .html(`You are signed in on
                        <span class="fw-bold">${portal.url}</span> as
                        <span class="fw-bold">${portal.user.username}</span>`
                );
            // Display sign-in message
            $("#userSignedIn").removeClass("d-none");
        }
        catch {
            // Not signed in? Use the sign-in function.
            await signInOrOut();
        }
    }

    
    /**
     * Checks if the user's signed in already; if they are, they are signed out. If they aren't, the user is prompted to enter their
     * credentials to sign in, and their sign-in status is checked using the checkSignIn() function.
     */
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
                arcgisUserCredential = await EsriId.getCredential(oAuthInfo.portalUrl + "/sharing", {
                    oAuthPopupConfirmation: true,
                });
                // Once that's done, check their sign-in status.
                checkSignIn();
            }
            catch {
                // We failed to get the user's credentials for some reason.
                console.error("Failed to get user credentials.");
            }
        }
    }

    async function getItemThumbnail(itemId) {
        // Construct portal item object
        const item = new PortalItem({
            id: itemId,
            portal: {
                url: arcgisPortalUrl,
            },
        });

        // Try to get item
        try {
            // Load from portal
            await item.load();
            // Get thumbnail URL
            const itemThumbnailUrl = item.thumbnailUrl;
            console.log(itemThumbnailUrl);
            // // Remove negative feedback in form UI
            // $('#arcgisItemIdInput').removeClass("is-invalid");
            // TODO: add the custom thumbnail to the image!

        }
        // If failed, pass exception back.
        catch {
            throw "Failed to get portal item.";
        }
    }

    /* Authentication actions */
    // Handle connect to portal button press
    $('#arcgisPortalSignIn').click(() => {
        connectToPortal();
    });

    // Handle sign out button press
    $('#arcgisPortalSignOut').click(() => {
        signInOrOut();
    });

    /* Thumbnail actions */
    // Handle add from item ID button press
    $('#arcgisItemIdAdd').click(async () => {
        // Get item ID
        const itemId = $('#arcgisItemIdInput').val();
        // Get item thumbnail
        try {
            await getItemThumbnail(itemId);
        }
        catch (e) {
            // Log error in console
            console.error(e);
            // Display errors on form
            $('#arcgisItemIdInput').addClass("is-invalid");
        }
    });
});