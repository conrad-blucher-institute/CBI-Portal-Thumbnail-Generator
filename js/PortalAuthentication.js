/*  Title: Portal Thumbnail Generator Authentication library
    Purpose: Connect to the ArcGIS Portal by displaying sign-in elements on the page.
    Author: Rodrigo Davila Castillo - Conrad Blucher Institute for Surveying and Science - rodrigo.davilacastillo@tamucc.edu
    Date: March 25, 2025
    How to maintain: TODO
*/

// Portal URL
const arcgisPortalUrl = "https://cbimaps.tamucc.edu/portal"
// App ID
const arcgisAppId = "AWimXkIUXWwB90tA";
// Credential object - initialize as undefined
let arcgisUserCredential = undefined;

// Use these resources: https://developers.arcgis.com/javascript/latest/sample-code/identity-oauth-basic/ and https://github.com/Esri/jsapi-resources/tree/main/oauth and https://github.com/EsriDevEvents/jaspi_oauth2_snippet/blob/master/jaspi_oauth2_snippet.tsx
// Import core Esri packages
require(["esri/identity/OAuthInfo", "esri/identity/IdentityManager", "esri/portal/Portal", "esri/portal/PortalItem", "esri/request"], (OAuthInfo, EsriId, Portal, PortalItem, esriRequest) => {

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
            // Load content on page for signed-in users
            // Construct sign-in message
            $("#userSignedInMessage")
                .html(`You are signed in on
                        <span class="fw-bold">${portal.url}</span> as
                        <span class="fw-bold">${portal.user.username}</span>`
                );
            // Hide signed out elements
            $(".signedOutElements").addClass("d-none");
            $(".signedInElements").removeClass("d-none");
            // TODO: make the "default thumbnail" button react to sign-in + whether an item id is entered
            // TODO: the same thing but for the "set thumbnail" button that's not in the UI yet
        }
        catch (e) {
            console.error(e);
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
            console.log("reloading");
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

    async function getItemById(itemId) {
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
            // Comment item
            console.log(item);

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
    $('#thumbnailGenItemSearchButton').click(async () => {
                    
        const userInput = $('#thumbnailGenItemSearchInput').val();
        const argcisItemIdRegex = new RegExp("^[a-z0-9]{32}$");
        // If the input matches regex (32-characters, 0-9 and a-z), try and see if it's an ID.
        if( argcisItemIdRegex.test(userInput) ) {
            // Get item thumbnail
            try {
                await getItemById(userInput);
                // If we were successful in getting the item with the given ID,
                // return so we don't keep on querying the server.
                return;
            }
            catch (e) {
                // Log error in console; fall through to the next 
                console.error(e);
            }
        }
        const searchUrl = arcgisPortalUrl + `/sharing/rest/search?f=pjson&token=${arcgisUserCredential.token}&q=${userInput}`;
        try {
            arcgisRequestJson = await esriRequest( searchUrl, {
                responseType: "json"
            });
            console.log(arcgisRequestJson);
        }
        catch (e) {
            console.error(e);
        }
    });
});