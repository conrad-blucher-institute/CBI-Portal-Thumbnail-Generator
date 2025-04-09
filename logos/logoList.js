/**
 * logoList.js
 * Title:          Logo listing
 * Purpose:         This small collection of constants allows for overcoming JS's limitations and creating a dynamic logo selection in the thumbnail generator.
 *                  In the future, this library can also be extended to allow for more complex logo handling (e.g., having a separate filename and display name/label).
 * Author:          Rodrigo Davila Castillo - Conrad Blucher Institute for Surveying and Science - rodrigo.davilacastillo@tamucc.edu
 * Date:            April 9, 2025
 * How to maintain: If new logos are added, all you need to do is add the image to the logos folder, add its filename to LOGO_FILES, and voila.
 *                  If you want to change the default image shown, change the DEFAULT_LOGO constant to one of the filenames in LOGO_FILES.
 */

/**
 * A constant array listing all of the logo files inside the logos folder.
 * Update this every time you add a new logo; due to JS's client-side limitations,
 * it's much trickier to just fetch the list of logo files from the logos folder.
 */
const LOGO_FILES = [
    "AI2ES.png",
    "CATS.png",
    "CBI.png",
    "CDL.png",
    "GOAL.png",
    "MANTIS.png",
    "TNRIS.png",
    "TSRC.png",
];

/**
 * A constant string with the filename of the default logo to show on screen. This logo should be included in LOGO_FILES.
 */
const DEFAULT_LOGO = "CBI.png";