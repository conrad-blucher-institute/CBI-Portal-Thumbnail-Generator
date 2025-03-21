// Portal URL
const arcgisPortalUrl = "https://cbimaps.tamucc.edu/portal"

// Import core Esri packages and use them
require(["esri/identity/OAuthInfo", "esri/portal/Portal"], (OAuthInfo, Portal) => {
    const portalLogin = async () => {
        const oAuthInfo = new OAuthInfo({
            appId: "c96b5f5ef7c24a7d8606b15715509159",
            portalUrl: arcgisPortalUrl,
            popup: true,
        });
    
        portal = new Portal({
            url: arcgisPortalUrl,
        });
    
        console.log("portal login!");
        
        await portal.load();
    }

    $('document').ready(() => {
        portalLogin();
    })
});