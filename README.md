# CBI Portal Thumbnail Generator
An extremely simple self-contained thumbnail generator for ArcGIS Enterprise portal items, intended for displaying items from multiple source agencies in a standardized way. This application was designed for internal use at the [Conrad Blucher Institute](https://conradblucherinstitute.org). However, information on its deployment has been provided for the public's benefit.
![A step-by-step demonstration of the thumbnail creation process of the Portal Thumbnail Generator.](https://github.com/user-attachments/assets/b477ffd6-594a-43fc-b109-7a7fc8ce9eec)

# Deploy
## Get your app ID
First things first, you'll want to create an app ID for this application. To do so, log onto your ArcGIS Enterprise portal, reach the Content tab, and click the `+ New Item` button. Select the **Developer credentials** option, and in the next screen, enter the following details:
- Redirect URLs: enter the URL for the folder where you will be hosting this application from, alongside the page `oauth-callback.html`. For example, if you're hosting this application in `https://mycorp.com/thumbnailgen`, you'll want to enter the URL `https://mycorp.com/thumbnailgen/oauth-callback.html`.
  - If you're testing this on a local environment, you can use a localhost address and port here (such as `https://127.0.0.1:3000/oauth-callback.html`. Make sure to use a different URL in production, of course.
- Application environment: Browser. This application is designed for the web.
- URL: enter the URL this application will be hosted on. A placeholder here is fine
Finally, enter the details that will show up for this application's item page on your organization's ArcGIS portal, and press Save.

You've now created the application that will be used to access Portal items from the thumbnail generator. You will use the Client ID found on the application's item page in the next step.

## Edit files
Clone the repository to your folder of choice. Then, edit the following files to ensure that this application works in your organization:
### js/PortalAccess.js
- Edit the `arcgisPortalUrl` to your organization's ArcGIS portal URL
- Edit the `arcgisAppId` to the **Client ID** found on the item page for the application item you created in the previous step. Do **not** share the **Client Secret** or the **Temporary Token**.
- Edit the `appUrl` to the URL that this application is hosted at.
### Logos
Remove the logos included in the `logos` folder, and update the `logoList.js` file accordingly. You will have to update the logoList.js since this is entirely a client-side application -- JS has no way to reliably read the logo files from the server. Make sure to update the `DEFAULT_LOGO` constant as well -- this will be the logo shown on the default thumbnail.
### Screenshot_default.png
This file is used as the background for the default thumbnail. Replace the file and/or update the `src` attribute in `index.html`.
### index.html
- Update the `<title>` and `<h1>` tags to include your organization's name.
- Update references to `CBI Maps` to ArcGIS Enterprise, or your organization's specific name for its ArcGIS Enterprise instance.
### Favicons
Replace the images in the `favicons` folder to those of your organization.
