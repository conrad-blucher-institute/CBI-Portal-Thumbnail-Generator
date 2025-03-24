/*  Title: Portal Thumbnail Generator library
    Purpose: Logic behind ArcGIS Portal Thumbnail Generator Tool. Takes select items and generates a thumbnail on the
                HTML5 canvas.
    Author: Rick Smith - Conrad Blucher Institute for Surveying and Science - Richard.Smith@tamucc.edu
    Date: April 18, 2023
    How to maintain: The canvas size of 600w x 400h is hard coded in to the logic. Any change of canvas size will
        require recoding the values throughout. Going forward, this information could be pulled out into constants.
*/

/*  Title: generateThumbnail
    Purpose: Generates thumbnail based on selected portal item type, external source selection, source icon, and
                uploaded thumbnail.
*/

function generateThumbnail(){
    // Constant variables
	var canvasWidth = 600;
    var canvasHeight = 400;
	var sidebarWidth = 105;
	var bottombarHeight = 90;
    var logoImageHeight = 90;
    
    // Find canvas and create 2d context
    var canvas = document.getElementById('thumbnail');
    var ctx = canvas.getContext('2d');
    // Save canvas settings
    ctx.save();
    // Clear canvas
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    // Draw uploaded thumbnail (defaults to CBI logo)
    var thumbImg = new Image();
    thumbImg.src = $("#thumb").attr('src');
	// ctx.drawImage(thumbImg, 0, 0, canvasWidth, canvasHeight);
    
    // Change position of image depending on what option is selected in the form. Defaults to stretching the image.
    // Fetch image position, set as imageStretch by default
    const imagePosition = $("input[name=imagePosition]:checked").val() ?? "imageStretch";

    // The dimensions of the image area (target / destination) that the image is being placed in
    const targetHeight = canvasHeight - bottombarHeight;
    const targetWidth = canvasWidth - sidebarWidth;
    // The dimensions of the source image that is being inserted
    const sourceImageWidth = thumbImg.naturalWidth;
    const sourceImageHeight = thumbImg.naturalHeight;
    // Helpful reference: https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/drawImage
    let sourceImageX, sourceImageY, drawnImageHeight, drawnImageWidth, drawnImageX, drawnImageY;

    switch( imagePosition ) {
        case "imageFill":
            // If the image is too wide for the aspect ratio:
            if ( ( targetWidth / targetHeight ) < ( sourceImageWidth / sourceImageHeight ) ) {
                // Cropping (offsetting) the image by scaling the destination (target) image area to the image's size,
                // then getting the # of pixels wide that would not be visible inside the target area (the horizontal overflow in pixels),
                // then dividing by two to get the # of pixels to crop off from the left.
                sourceImageX = ( sourceImageWidth - ( targetWidth * ( sourceImageHeight / targetHeight ) ) ) / 2;
                sourceImageY = 0;

                // The dimensions of the image, once it's being placed into the destination (target) image area.
                // - The image drawn will be the same height as the target image area
                drawnImageHeight = targetHeight;
                // - Scale the width to match the difference between the source image's height and the target image area's height
                drawnImageWidth = sourceImageWidth * ( targetHeight / sourceImageHeight );
                // - Draw the image from the top-left corner of the image area -- from the top right of the sidebar.
                drawnImageX = sidebarWidth;
                drawnImageY = 0;

                // Draw the image onto the canvas
                ctx.drawImage(thumbImg, sourceImageX, sourceImageY, sourceImageWidth, sourceImageHeight, drawnImageX, drawnImageY, drawnImageWidth, drawnImageHeight);
            }
            // If the image is too tall for the aspect ratio (or the fallback):
            else {
                // Cropping (offsetting) the image by scaling the destination (target) image area to the image's size,
                // then getting the # of pixels high that would not be visible from the target area (the vertical overflow in pixels),
                // then dividing by two to get the # of pixels to crop off from the top.
                sourceImageX = 0;
                sourceImageY = ( sourceImageHeight - ( targetHeight * ( sourceImageWidth / targetWidth ) ) ) / 2;

                // The dimensions of the image, once it's being placed into the destination (target) image area.
                // - Scale the height to match the difference between the source image's width and the target image area's width                
                drawnImageHeight = sourceImageHeight * ( targetWidth / sourceImageWidth );
                // - The image drawn will be the same width as the target image area
                drawnImageWidth = targetWidth;
                // - Draw the image from the top-left corner of the image area -- from the top right of the sidebar.
                drawnImageX = sidebarWidth;
                drawnImageY = 0;

                // Draw the image onto the canvas
                ctx.drawImage(thumbImg, sourceImageX, sourceImageY, sourceImageWidth, sourceImageHeight, drawnImageX, drawnImageY, drawnImageWidth, drawnImageHeight);
            }
            break;
        case "imageCenter":
            // Center the image by offsetting it up and left, by the amount of remainder (overflow) width and height divided by two
            drawnImageX = ( -1 * ( sourceImageWidth - targetWidth ) / 2 ) + sidebarWidth;
            drawnImageY = -1 * ( sourceImageHeight - targetHeight ) / 2;
            
            // Draw the image onto the canvas
            ctx.drawImage(thumbImg, drawnImageX, drawnImageY);
            
            break;
        case "imageStretch":
        default:
            // Draw the image in stretched form
            ctx.drawImage(thumbImg, sidebarWidth, 0, canvasWidth-sidebarWidth, canvasHeight-bottombarHeight);
    }
	

    // Draw left white box
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, sidebarWidth, canvasHeight);
	// Draw bottom white box
	ctx.fillStyle = 'white';
	ctx.fillRect(sidebarWidth, canvasHeight-bottombarHeight, canvasWidth, canvasHeight);

    // If external checkbox is checked, draw external tag
    if($("#external").prop('checked')) {
        // Draw 'External' text
        ctx.fillStyle = 'rgb(28,146,209)'; //Izzy Blue
        ctx.font = '36px sans-serif';
        // Draw 'External' text right-justified with 5px padding on right and vertically centered
        ctx.fillText("External", canvasWidth - ctx.measureText("External").width - 5,
		canvasHeight-(bottombarHeight/3));
    }

    // Draw type text
    ctx.fillStyle = 'rgb(0,127,62)'; //Islander Green
    ctx.font = '40px sans-serif';
    // Rotate canvas so text can be drawn vertical
    ctx.rotate(3 * Math.PI / 2);
    if ($("#applicationType option:selected").attr('value') == 'other'){
        var typeTitle = $("#customapplicationtype").val();
    } else {
        var typeTitle = $("#applicationType option:selected").text();
    }
    // Check to see if we need to reduce font size. If overruns area (95px), then reduce font size by 1 and repeat.
    var fontSize = 46;
    while (ctx.measureText(typeTitle).width > 285) {
        // console.log(ctx.measureText(typeTitle.width));
        fontSize = fontSize-1;
        ctx.font = fontSize + 'px sans-serif';
    }
    // Calculate centered text placement
    var centeredTextPlacement =  -155 - (0.5 * ctx.measureText(typeTitle).width);
    // Place text
    ctx.fillText(typeTitle, centeredTextPlacement, 60);
    // Remove rotation
    ctx.restore();

    // Add source icon (logo)
    var logoImage = "logos/" + $("#sourceIcon option:selected").attr('value');
    if (logoImage == "logos/Other.png") {
        logoImage = $("#customlogofile").attr('src');
    }

    var newImage = new Image();
    newImage.src = logoImage;
    //Once loaded, draw image. Set height and calculate width to maintain aspect ratio.
    newImage.onload = function() {
        ctx.drawImage(newImage, 0, canvasHeight-logoImageHeight, 
            logoImageHeight * newImage.width / newImage.height, logoImageHeight);
    };
}

/*  Title: handleFileSelect
    Purpose: Handles event when file is selected. Reads file as Image object and sets path to 'thumb' image element.
 */
function handleFileSelect(evt) {
    var file = evt.target.files[0]; // FileList object. We only get first item uploaded.

    // Make sure the file is an image object
    if (!file.type.match('image.*')) {
        alert('Please only select an image file type.');
        return;
    }

    // Read in image file as a new Image object
    var reader = new FileReader();
    reader.onload = (function(theFile) {
        return function(e) {
            var thumbnailImage = new Image();
            thumbnailImage.src = e.target.result;
            // Set thumb image tag to image object so thumbnail generator will use uploaded image.
            document.getElementById('thumb').src=e.target.result;
            // Once image has been set, generate thumbnail
            thumbnailImage.onload = function() {
                generateThumbnail();
            };
        };
    })(file);
    // Execute reader
    reader.readAsDataURL(file);
}

/*  Title: handleOtherSourceIcon
    Purpose: Handles event when file is selected. Reads file as Image object and sets path to 'thumb' image element.
 */
function handleOtherSourceIcon(evt) {
    var file = evt.target.files[0]; // FileList object. We only get first item uploaded.

    // Make sure the file is an image object
    if (!file.type.match('image.*')) {
        alert('Please only select an image file type.');
        return;
    }

    // Read in image file as a new Image object
    var reader = new FileReader();
    reader.onload = (function(theFile) {
        return function(e) {
            var thumbnailImage = new Image();
            thumbnailImage.src = e.target.result;
            // Set thumb image tag to image object so thumbnail generator will use uploaded image.
            document.getElementById('customlogofile').src=e.target.result;
            // Once image has been set, generate thumbnail
            thumbnailImage.onload = function() {
                generateThumbnail();
            };
        };
    })(file);
    // Execute reader
    reader.readAsDataURL(file);
}

/*  Title: Toggle custom source upload visibility
    Purpose: Toggles the visibility of custom source upload based on if they choose 'Other'
*/

function toggleCustomSourceUpload(evt){
    if ($("#sourceIcon option:selected").attr('value') == 'Other.png'){
        document.getElementById('customLogoBlock').style.display="block";
    } else {
        document.getElementById('customLogoBlock').style.display="none";
    }
}

/*  Title: Toggle custom application type visibility
    Purpose: Toggles the visibility of custom application type based on if they choose 'Other'
*/

function toggleCustomApplicationType(evt){
    if ($("#applicationType option:selected").attr('value') == 'other'){
        document.getElementById('customApplicationType').style.display="block";
    } else {
        document.getElementById('customApplicationType').style.display="none";
    }
}

/*  Title: Toggle image upload controls
    Purposes: Handles the user's toggle of ArcGIS Portal or an image upload for their image source
*/
function toggleImageUploadControls() {
    const imageUploadSource = $("input[name=imageSource]:checked").val() ?? "fileUpload";

    if ( imageUploadSource === "arcgisPortal" ) {
        $("#userImageOptions").addClass("d-none");
        $("#arcgisPortalImageOptions").removeClass("d-none");
    }
    else {
        $("#arcgisPortalImageOptions").addClass("d-none");
        $("#userImageOptions").removeClass("d-none");
    }
}

/*  Title: document on ready event
    Purpose: Wires up controls when DOM has loaded.
 */
$('document').ready(function(){
    // Check that all APIs need are supported by browser.
    if (window.File && window.FileReader && window.FileList && window.Blob) {
        // All the File APIs are supported.
    } else {
        alert('The File APIs are not fully supported in this browser. This tool will not work.');
    }

    

    // Do an initial creation of the thumbnail.
    generateThumbnail();

    // If application type changes, generate thumbnail
    $('#applicationType').on('change', function(){
        toggleCustomApplicationType();
        generateThumbnail();
    });

    // If external box checked (changes), generate thumbnail
    $('#external').on('change', function(){
        generateThumbnail();
    });

    // If source icon changes, generate thumbnail
    $('#sourceIcon').on('change', function(){
        toggleCustomSourceUpload();
        generateThumbnail();
    });

    // If custom item type entered, generate thumbnail
    $('#customapplicationtype').on('keyup', function(){
        generateThumbnail();
    })

    // If file chosen, generate thumbnail
    $('#file').on('change', handleFileSelect);

    // If file chosen, generate thumbnail
    $('#customlogo').on('change', handleOtherSourceIcon);

    // If the image position option changes, generate thumbnail
    $('#imagePositionControls').on('change', function(){
        generateThumbnail();
    });

    // Clear image source option control
    $("input[name=imageSource]:checked").prop("checked", false);

    // If the image source option changes, change the options displayed and generate thumbnail
    $('#imageSourceControls').on('change', () => {
        toggleImageUploadControls();
        generateThumbnail();
    });

    // If Download Thumbnail button clicked, force file download
    $('#downloadThumbnail').on('click', function(){
        var canvas = document.getElementById('thumbnail');
        if (canvas.msToBlob) { //for stupid IE
            var blob = canvas.msToBlob();
            window.navigator.msSaveBlob(blob, 'GeneratedThumbnail.png');
        } else { // for other browsers
            var link = document.createElement('a');
            link.href = canvas.toDataURL();
            link.download = "GeneratedThumbnail.png";
            link.click();
        }
    });

    //If the source of the thumbnail image changes, refresh thumbnail.
    //This is needed for when the image is pasted, it will refresh
    $('#thumb').on('load', function(){
        generateThumbnail();
    });

    // If an image is pasted on to the page, set it as the thumbnail source
    window.addEventListener("paste", function(e){
        retrieveImageFromClipboardAsBlob(e, function(imageBlob){
            if(imageBlob){
                var URLObj = window.URL || window.webkitURL;
                var img = new Image();
                img.src=URLObj.createObjectURL(imageBlob);
                document.getElementById('thumb').src=img.src;
            }
        }) 
    }, false);
});

//This handler retrieves the images from the clipboard as a blob and returns it in a callback.
function retrieveImageFromClipboardAsBlob(pasteEvent, callback){
	if(pasteEvent.clipboardData == false){
        if(typeof(callback) == "function"){
            callback(undefined);
        }
    };

    var items = pasteEvent.clipboardData.items;

    if(items == undefined){
        if(typeof(callback) == "function"){
            callback(undefined);
        }
    };

    for (var i = 0; i < items.length; i++) {
        // Skip content if not image
        if (items[i].type.indexOf("image") == -1) continue;
        // Retrieve image on clipboard as blob
        var blob = items[i].getAsFile();

        if(typeof(callback) == "function"){
            callback(blob);
        }
    }
}