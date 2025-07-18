/*  Title: Portal Thumbnail Generator Accesss library
    Purpose: Connect to the ArcGIS Portal and access/edit items on the Portal.
    Author: Rodrigo Davila Castillo - Conrad Blucher Institute for Surveying and Science - rodrigo.davilacastillo@tamucc.edu
    Date: April 7, 2025
    How to maintain:
        -   This sample's authentication flow is largely based off this ArcGIS Maps SDK sample code: https://developers.arcgis.com/javascript/latest/sample-code/identity-oauth-basic/.
            Read it to understand how it is used to prompt the user for sign-in, and how it calls back and gets a token at the end.
        -   A few constant variables have been pulled to the top to make it easier to change the portal URL, app ID, and the hosted app URL.
            -   The app URL should match the redirect URLs in the OAuth 2 application item's settings in the Portal.
        -   This code imports some modules from the ArcGIS Maps SDK for JS with AMD syntax (require(["esri/moduleName"], (moduleName) => { code }).
            -   To add more modules, add them to the require() array and the list of arguments for the arrow function in the right order.
        -   The UI is controlled by choosing to show or hide elements with classes (e.g., signedOutElements are elements in the page that are displayed when a user is not signed in).
            Make sure that no sensitive information is stored here, since these are trivially easy to bypass. However, it isn't possible to update thumbnails or view private items without a token,
            which you can only get by actually going through the sign-in process.
        -   This file is split into sections for constants, objects, functions, and actions/event listeners; and subsections for authentication, portal item, and thumbnail-related code.
            Try to keep it organized that way for readability.
*/

/* Constants */
// Portal URL
const arcgisPortalUrl = "https://cbimaps.tamucc.edu/portal"
// App ID
const arcgisAppId = "AWimXkIUXWwB90tA";
// App URL
const appUrl = "https://cbimaps.tamucc.edu/thumbsup"
// Credential object - initialize as undefined
let arcgisUserCredential = undefined;
// Selected item - initialize as undefined
let item = undefined;

// Import core Esri packages
require(["esri/identity/OAuthInfo", "esri/identity/IdentityManager", "esri/portal/Portal", "esri/portal/PortalItem", "esri/request"], (OAuthInfo, EsriId, Portal, PortalItem, esriRequest) => {

    /* Objects */
    // Authentication objects
    
    // Create an OAuthInfo object associated with our web app / OAuth key
    const oAuthInfo = new OAuthInfo({
        appId: arcgisAppId,
        portalUrl: arcgisPortalUrl,
        popupCallbackUrl: `${appUrl}/oauth-callback.html`,
        popup: true,
    });
    
    /* Functions */
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
                .html(
                    `You are signed in on
                        <span class="fw-bold">${portal.url}</span> as
                        <span class="fw-bold">${portal.user.username}</span>
                `);
            // Hide signed out elements
            $(".signedOutElements").addClass("d-none");
            // Display signed in elements
            $(".signedInElements").removeClass("d-none");
            // Display admin elements if user is org_admin
            const privilegesRequestUrl = `${arcgisPortalUrl}/sharing/rest/community/self?f=pjson&token=${arcgisUserCredential.token}`
            const privilegesResponse = await esriRequest( privilegesRequestUrl );
            if ( privilegesResponse?.["data"]?.["role"] === "org_admin" ) {
                $(".adminElements").removeClass("d-none");
            }
        }
        catch (e) {
            console.error(e);
            // Not signed in? Use the sign-in function.
            await signInOrOut();
        }
    }

    
    /**
     * Checks if the user's signed in already; if they are, sign them out. If they aren't, the user is prompted to enter their
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

    // ArcGIS Portal item interaction functions
    /**
     * An asynchronous function used to retrieve an item object from the Portal with a given item ID.
     * @param {string} itemId The item's ID
     * @returns {Promise<object>} The portal item
     */
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

    /**
     * Handle a user's selection of an item by:
     *  -   Checking if the user has the permissions to update the item's thumbnail
     *  -   Adding the selected item to the card footer (and give them the option to deselect it)
     *  -   Advance the user to the next card tab (item data)
     *  -   Autofilling the item's type in the item data tab
     *  -   Hiding elements that correspond to no item selection, and showing elements that correspond to an item selection,
     *      while accounting for the user's permissions on that item
     * @param {object} selectedItem The ArcGIS Portal item object corresponding to the user's selection
     */
    async function selectItem(selectedItem) {
        // Set item variable to selectedItem
        item = selectedItem;
        // Display selected item info
        $("#selectedItemInfo").removeClass("d-none");
        $("#selectedItemInfoMsg")
            .html(`
                Selected item: <span class="fw-bold">${item.title}</span> by <span class="fw-bold">${item.owner}</span>
            `);
        // Navigate from tab 1 to tab 2
        // Remove disabled class on tab 2 (if it's there)
        $("#itemDataTab").removeClass("disabled");
        // Show the next tab!
        const itemDataTab = bootstrap.Tab.getOrCreateInstance($('#tabs button[data-bs-target="#itemData"]'));
        itemDataTab.show();
        // Autofill data, trigger input so the thumbnail changes
        $("#applicationTypeInput").val(item.type).trigger("input");
        // Hide any elements that correspond to no item being selected;
        // no check for privileges on item necessary since users can only search their own items
        $(".noSelection").addClass("d-none");
        $(".requiresSelection").removeClass("d-none");
    }

    /**
     * Handle a user's deselection of an item by:
     *  -   Hiding the card footer w/ item details
     *  -   Hiding elements that correspond to an item being selected, and showing elements that correspond to no item selection
     *  -   Sending the user back to the first tab and disabling tabs 2 and 3
     *  -   Destroying the item in memory
     */
    function deselectItem() {
        // Hide footer
        $("#selectedItemInfo").addClass("d-none");
        // Hide items that correspond to item being selected, show items that correspond to no selected item
        $(".noSelection").removeClass("d-none");
        $(".requiresSelection").addClass("d-none");
        // Send user back to tab 1
        const itemSelectTab = bootstrap.Tab.getOrCreateInstance($('#tabs button[data-bs-target="#selectItem"]'));
        itemSelectTab.show();
        // Disable other tabs
        $("#itemDataTab").addClass("disabled");
        $("#makeThumbnailTab").addClass("disabled");
        // Destroy item in memory
        item.destroy();
        // Make item point to undefined
        item = undefined;
    }

    /**
     * Handle displaying an array of search results underneath the search bar
     * @param {Array} itemResults 
     */
    function displaySearchResults(itemResults) {
        // Hide no results dialog, existing item results
        $("#itemSearchNoResults").addClass("d-none");
        $("#itemSearchResultsList").addClass("d-none");
        // Clear current results container
        $("#itemSearchResultsList").html("");
        // Only display a list if it's a list and if it has a length value over 0.
        if (Array.isArray(itemResults) && itemResults?.length > 0) {
            // Loop through item array
            for (const itemResult of itemResults) {
                // If the item has a thumbnail, display it. Otherwise, make the layout text-only.
                if ( itemResult.thumbnail ) {
                    $("#itemSearchResultsList")
                    .append(`
                        <div class="searchResult list-group-item list-group-item-action">
                            <div class="d-flex gap-3 align-items-center">
                                <div class="w-25 d-flex align-items-center">
                                    <img
                                        class="rounded img-fluid"
                                        src="${arcgisPortalUrl}/sharing/rest/content/items/${itemResult.id}/info/${itemResult.thumbnail}?token=${arcgisUserCredential.token}"
                                    >
                                </div>
                                <div class="w-75 d-flex justify-content-between">
                                    <div class="w-60">
                                        <div class="fs-5">${itemResult.title}</div>
                                        <div class="fs-6">${itemResult.type}</div>
                                    </div>
                                    <div class="d-flex w-40 justify-content-end align-items-center gap-1">
                                        <a class="btn btn-sm btn-light" target="_blank" href="${arcgisPortalUrl}/home/item.html?id=${itemResult.id}">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-box-arrow-up-right" viewBox="0 0 16 16">
                                                <path fill-rule="evenodd" d="M8.636 3.5a.5.5 0 0 0-.5-.5H1.5A1.5 1.5 0 0 0 0 4.5v10A1.5 1.5 0 0 0 1.5 16h10a1.5 1.5 0 0 0 1.5-1.5V7.864a.5.5 0 0 0-1 0V14.5a.5.5 0 0 1-.5.5h-10a.5.5 0 0 1-.5-.5v-10a.5.5 0 0 1 .5-.5h6.636a.5.5 0 0 0 .5-.5"/>
                                                <path fill-rule="evenodd" d="M16 .5a.5.5 0 0 0-.5-.5h-5a.5.5 0 0 0 0 1h3.793L6.146 9.146a.5.5 0 1 0 .708.708L15 1.707V5.5a.5.5 0 0 0 1 0z"/>
                                            </svg>
                                        </a>
                                        <a class="btn btn-sm btn-primary searchResultSelect" data-id="${itemResult.id}">
                                            Select
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-caret-right-fill" viewBox="0 0 16 16">
                                                <path d="m12.14 8.753-5.482 4.796c-.646.566-1.658.106-1.658-.753V3.204a1 1 0 0 1 1.659-.753l5.48 4.796a1 1 0 0 1 0 1.506z"/>
                                            </svg>
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </div>
                    `);
                }
                else {
                    $("#itemSearchResultsList")
                        .append(`
                            <div class="searchResult list-group-item list-group-item-action">
                                <div class="w-100 d-flex justify-content-between">
                                    <div class="w-70">
                                        <div class="fs-5">${itemResult.title}</div>
                                        <div class="fs-6">${itemResult.type}</div>
                                    </div>
                                    <div class="d-flex w-30 justify-content-end align-items-center gap-1">
                                        <a class="btn btn-sm btn-light" target="_blank" href="${arcgisPortalUrl}/home/item.html?id=${itemResult.id}">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-box-arrow-up-right" viewBox="0 0 16 16">
                                                <path fill-rule="evenodd" d="M8.636 3.5a.5.5 0 0 0-.5-.5H1.5A1.5 1.5 0 0 0 0 4.5v10A1.5 1.5 0 0 0 1.5 16h10a1.5 1.5 0 0 0 1.5-1.5V7.864a.5.5 0 0 0-1 0V14.5a.5.5 0 0 1-.5.5h-10a.5.5 0 0 1-.5-.5v-10a.5.5 0 0 1 .5-.5h6.636a.5.5 0 0 0 .5-.5"/>
                                                <path fill-rule="evenodd" d="M16 .5a.5.5 0 0 0-.5-.5h-5a.5.5 0 0 0 0 1h3.793L6.146 9.146a.5.5 0 1 0 .708.708L15 1.707V5.5a.5.5 0 0 0 1 0z"/>
                                            </svg>
                                        </a>
                                        <a class="btn btn-sm btn-primary searchResultSelect d-inline-block" data-id="${itemResult.id}">
                                            Select
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-caret-right-fill" viewBox="0 0 16 16">
                                                <path d="m12.14 8.753-5.482 4.796c-.646.566-1.658.106-1.658-.753V3.204a1 1 0 0 1 1.659-.753l5.48 4.796a1 1 0 0 1 0 1.506z"/>
                                            </svg>
                                        </a>
                                    </div>
                                </div>
                            </div>
                        `);
                }
            }
            $("#itemSearchResultsList").removeClass("d-none");
        }
        else {
            $("#itemSearchNoResults").removeClass("d-none");
        }
        // Create an event listener for clicks on search results
        $(".searchResultSelect").on("click", async (event) => {
            // Prevent other parent/child elements from getting the "click" event
            event.stopPropagation();
            event.stopImmediatePropagation();
            // Get the item object from the passed ID
            const itemById = await getItemById(event.currentTarget.dataset.id);
            // Select the item
            await selectItem(itemById);
        });
    }

    // Thumbnail functions
    /**
     * Handle retrieving the thumbnail for the current item as a Blob. Returns undefined if unsuccessful.
     * @returns {Blob} Thumbnail image blob
     */
    async function getPortalItemThumbnailBlob() {
        // Get portal image from Portal server
        const url = `${arcgisPortalUrl}/sharing/rest/content/items/${item.id}/info/${item.thumbnail}?w=2400&token=${arcgisUserCredential.token}`;
        let response = undefined;
        // Attempt to get blob response from server
        try {
            response = await esriRequest( url, {
                responseType: "blob"
            });
        }
        catch (e) {
            console.error(e);
            return undefined;
        }
        
        return response.data;
    }

    // Upload the thumbnail to the portal using a given image blob, and set it for that particular item
    /**
     * Attempt to set the thumbnail for the current item to be the given image blob. Throws an error if unsuccessful.
     * @param {Blob} imageBlob The image blob to use as the new item thumbnail
     */
    async function uploadThumbnail(imageBlob) {
        try {
            await item.updateThumbnail(params={
                thumbnail: imageBlob,
            });
        }
        catch (e) {
            // If failed, log error and return the error
            console.error(e);
            throw e;
        }
    }

    /* Event listeners and actions */
    // Authentication actions */
    
    // Handle connect to portal button press
    $("#arcgisPortalSignIn").on("click", () => {
        connectToPortal();
    });

    // Handle sign out button press
    $("#arcgisPortalSignOut").on("click", () => {
        signInOrOut();
    });

    // Search and item selection actions

    // Handle user search. Test if we're given an item ID and display the item if it matches;
    // otherwise, display search results for the user's query.
    $("#itemSearch").on("submit", async (event) => {
        // Suppress default behavior (reloading page)
        event.preventDefault();

        // Get user's input and options (search terms, sorting options, filter to user items)
        const userInput = $("#itemSearchInput").val();
        const sortField = $("input[name=sortField]:checked").val() ?? "title";
        const sortOrder = $("input[name=sortOrder]:checked").val() ?? "asc";
        const limitToUserItems = $("#searchFilterUserContentButton").hasClass("active") ? true : false;
        const argcisItemIdRegex = new RegExp("^[a-z0-9]{32}$");
        const itemById = undefined;
        // If the input matches regex (32-characters, 0-9 and a-z), try and see if it's an ID.
        if( argcisItemIdRegex.test(userInput) ) {
            // Get item thumbnail
            try {
                itemById = await getItemById(userInput);
                displaySearchResults([itemById]);
                return;
            }
            catch (e) {
                // Log error in console; fall through to the next 
                console.error(e);
            }
        }
        try {
            arcgisRequestJson = await esriRequest( `${arcgisPortalUrl}/sharing/rest/search`, {
                responseType: "json",
                query: {
                    "f": "pjson",
                    "filter": limitToUserItems ? `owner:${arcgisUserCredential.userId}` : "",
                    "token": arcgisUserCredential.token,
                    "sortField": sortField,
                    "sortOrder": sortOrder,
                    "q": userInput,
                }
            });
            displaySearchResults(arcgisRequestJson?.data?.results);
        }
        catch (e) {
            console.error(e);
        }
    });

    // Respond to item deselection
    $("#selectedItemInfoRemove").on("click", () => {
        deselectItem();
    });

    // Thumbnail actions

    // Get the default/current thumbnail image as blob, add it to thumbnail
    $("#getItemThumbnail").on("click", async () => {
        // Get image blob
        const blob = await getPortalItemThumbnailBlob();
        // Create image blob url
        const URLObj = window.URL || window.webkitURL;
        const img = new Image();
        img.src = URLObj.createObjectURL(blob);
        // Set image
        $("#thumb").attr("src", img.src);
    });

    // Upload and set the generated thumbnail on the Portal item
    $("#uploadThumbnail").on("click", async () => {
        // Get the modal element
        const modal = bootstrap.Modal.getOrCreateInstance($("#setThumbnailModal"));
        // Get the canvas element, convert it to a blob
        document.getElementById("thumbnail").toBlob(async (blob) => {
            // Upload the thumbnail to the portal
            try {
                await uploadThumbnail(blob);
                // Add success message and buttons
                $("#setThumbnailModalBody")
                    .html(`
                        Your item's thumbnail has been updated!
                    `);
                $("#setThumbnailModalFooter")
                    .html(`
                        <a class="btn btn-primary" target="_blank" href="${arcgisPortalUrl}/home/item.html?id=${item.id}">View item</a>
                        <button type="button" class="btn btn-primary" data-bs-dismiss="modal">OK</button>                
                    `);
                // Show the success modal
                modal.show();
            }
            catch (e) {
                // Add error text
                $("#setThumbnailModalBody")
                    .html(`
                        Something went wrong with updating your item.
                        <div class="card text-bg-light">
                            <div class="card-body">
                                <pre><code>${e}</code></pre>
                            </div>
                        </div>
                    `);
                $("#setThumbnailModalFooter")
                    .html(`
                        <button type="button" class="btn btn-primary" data-bs-dismiss="modal">OK</button>                
                    `);
                // Show the error modal
                modal.show();
            }
        }, "image/png");
    });
});