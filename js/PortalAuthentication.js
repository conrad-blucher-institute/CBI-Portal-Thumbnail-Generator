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
// Selected item
let item = undefined;

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
    
    // ArcGIS authentication functions
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
            // Display signed in elements
            $(".signedInElements").removeClass("d-none");
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

    // ArcGIS Portal item interaction functions
    async function getItemById(itemId) {
        // Construct portal item object
        const itemById = new PortalItem({
            id: itemId,
            portal: {
                url: arcgisPortalUrl,
            },
        });

        // Try to get item
        try {
            // Load from portal
            await itemById.load();
            // Return item
            return itemById;
        }
        // If failed, pass exception back.
        catch {
            throw "Failed to get portal item.";
        }
    }

    // This function handles the selection of an item -- it adds it to the bottom (footer) of the card,
    // it navigates the user to the next step, and it autofills data on tab 2.
    function selectItem(selectedItem) {
        // Set wider item variable to selectedItem
        item = selectedItem;
        // Display selected item info
        $("#selectedItemInfo").removeClass("d-none");
        $("#selectedItemInfoMsg")
            .html(`
                Selected item: <span class="fw-bold">${item.title}</span> by <span class="fw-bold">${item.owner}</span>
            `);
        // Navigate from tab 1 to tab 2
        // Remove disabled class on tab 2 (if it's there)
        $('#thumbnailGenItemDataTab').removeClass("disabled");
        // Show the next tab!
        const itemDataTab = bootstrap.Tab.getOrCreateInstance($('#thumbnailGenTabs button[data-bs-target="#thumbnailGenItemData"]'));
        itemDataTab.show();
        // Autofill data, trigger input so the thumbnail changes
        $('#applicationTypeInput').val(item.type).trigger('input');
        // Hide any items that correspond to no item being selected, show items that correspond to a selected item
        $('.noSelection').addClass('d-none');
        $('.requiresSelection').removeClass('d-none');
    }

    // This function navigates a user's deselection of an item -- it hides the footer, nullifies the item variable, and sends them back to tab 1.
    function deselectItem() {
        // Hide footer
        $("#selectedItemInfo").addClass("d-none");
        // Hide items that correspond to item being selected, show items that correspond to no selected item
        $('.noSelection').removeClass('d-none');
        $('.requiresSelection').addClass('d-none');
        // Send user back to tab 1
        const itemSelectTab = bootstrap.Tab.getOrCreateInstance($('#thumbnailGenTabs button[data-bs-target="#thumbnailGenSelectItem"]'));
        itemSelectTab.show();
        // Disable other tabs
        $('#thumbnailGenItemDataTab').addClass("disabled");
        $('#thumbnailGenMakeThumbnailTab').addClass("disabled");
        // Destroy item in memory
        item.destroy();
        // Make item point to undefined
        item = undefined;
    }

    function displaySearchResults(itemResults) {
        // Clear current results container
        $("#thumbnailGenItemSearchResultsList").html("");
        // Only display a list if it's a list and if it has a length value over 0.
        if (Array.isArray(itemResults) && itemResults?.length > 0) {
            // Loop through item array
            for (const itemResult of itemResults) {
                console.log(itemResult);
                // If the item has a thumbnail, display it. Otherwise, make the layout text-only.
                if ( itemResult.thumbnail ) {
                    $("#thumbnailGenItemSearchResultsList")
                    .append(`<button type="button" class="searchResult list-group-item list-group-item-action" value="${itemResult.id}">
                                <div class="d-flex gap-3 align-items-center">
                                    <div class="w-25 d-flex align-items-center">
                                        <img
                                            class="rounded img-fluid"
                                            src="${arcgisPortalUrl}/sharing/rest/content/items/${itemResult.id}/info/${itemResult.thumbnail}?token=${arcgisUserCredential.token}"
                                        >
                                    </div>
                                    <div class="w-75">
                                        <div class="fs-5">${itemResult.title}</div>
                                        <div class="fs-6">${itemResult.type}</div>
                                    </div>
                                </div>
                            </button>`);
                }
                else {
                    $("#thumbnailGenItemSearchResultsList")
                    .append(`<button type="button" href="#" class="list-group-item list-group-item-action">
                                <div class="fs-5">${itemResult.title}</div>
                                <div class="fs-6">${itemResult.type}</div>
                            </button>`);
                }
            }
        }
        else {
            $("#thumbnailGenItemSearchResultsList").html(`
                    <div class="alert alert-danger" role="alert">
                        No results found.
                    </div>
                `);
        }
        // Create an event listener for search results
        $('.searchResult').on("click", async (event) => {
            // Prevent other parent/child elements from getting the "click" event
            event.stopPropagation();
            event.stopImmediatePropagation();
            // Get the item object from the passed ID
            const itemById = await getItemById(event.currentTarget.value);
            // Select the item
            selectItem(itemById);
        });
    }

    // Thumbnail functions
    // Update the thumbnail element on the page with the given url
    function setThumbnailImage(url) {
        $('#thumb').attr("src", url);
    }

    // Get the ArcGIS Portal thumbnail url for the current item
    async function getPortalItemThumbnailBlob() {
        // Get portal image from Portal server
        const url = `${arcgisPortalUrl}/sharing/rest/content/items/${item.id}/info/${item.thumbnail}?token=${arcgisUserCredential.token}`;
        let response = undefined;
        // Attempt to get blob response from server
        try {
            response = await esriRequest( url, {
                responseType: "blob"
            });
        }
        catch (e) {
            console.error(e);
            return null;
        }
        
        return response.data;
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

    /* Search and item selection actions */
    // Handle search
    $('#thumbnailGenItemSearch').on("submit", async (event) => {
        // Suppress default behavior (reloading page)
        event.preventDefault();

        // Get user's input
        const userInput = $('#thumbnailGenItemSearchInput').val();
        const argcisItemIdRegex = new RegExp("^[a-z0-9]{32}$");
        const itemById = undefined;
        // If the input matches regex (32-characters, 0-9 and a-z), try and see if it's an ID.
        if( argcisItemIdRegex.test(userInput) ) {
            // Get item thumbnail
            try {
                itemById = await getItemById(userInput);
                console.log(itemById);
                displaySearchResults([itemById]);
                return;
            }
            catch (e) {
                // Log error in console; fall through to the next 
                console.error(e);
            }
        }
        const searchUrl = `${arcgisPortalUrl}/sharing/rest/search?f=pjson&token=${arcgisUserCredential.token}&q=${userInput}`;
        try {
            arcgisRequestJson = await esriRequest( searchUrl, {
                responseType: "json"
            });
            console.log(arcgisRequestJson);
            displaySearchResults(arcgisRequestJson?.data?.results);
        }
        catch (e) {
            console.error(e);
        }
    });

    // Handle item deselection
    $('#selectedItemInfoRemove').on("click", () => {
        deselectItem();
    });

    /* Thumbnail actions */
    $('#getItemThumbnail').on("click", async () => {
        // Get image blob
        const blob = await getPortalItemThumbnailBlob();
        // Create image blob url
        const URLObj = window.URL || window.webkitURL;
        const img = new Image();
        img.src = URLObj.createObjectURL(blob);
        // Set image
        setThumbnailImage( img.src );
    })
});