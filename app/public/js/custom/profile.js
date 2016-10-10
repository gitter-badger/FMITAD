var resizeCanvas = false;

$(document).ready(function(){

    $("#image").on("change", readImage);

    $.validate({
    	validateOnBlur: false, // Validate on form.submit()
    	errorMessagePosition : 'top'
    });

    // Make sure the user knows if their password is weak or strong..
    $("#new_password").passwordStrength("#new_password_result");

	$("[data-tooltip='tooltip']").tooltip();

	$("#tabs").tab();

	var id = window.location.hash.substr(1);
	$("#" +id).tab("show");


    

});

function setUpQr( authEnabled ){
    if(!authEnabled)
        return;

    var qrCode = new QRCode(document.getElementById("otp_qr"),{
        width: 128,
        height: 128
    });

    $("#qr_continue").click(function(e){

		$.post("/api/two-factor", {}, function( data, status ){
			if(!data.success){
				$('#qr_error').html(data.error);
			}else{
				$("#otp_key").html(data.key);

				qrCode.clear();
				qrCode.makeCode(data.uri);

			}
		});
	});
}

function togglePassword( element, inputId ){
	var span = element.childNodes[0];
	if (span.classList.contains("glyphicon-eye-open")){ // Clicking on open eye should show TEXT

		span.classList.remove("glyphicon-eye-open");
		span.classList.add("glyphicon-eye-close");

		$('#' + inputId).prop("type", "text");

	}else if (span.classList.contains("glyphicon-eye-close")){
		span.classList.remove("glyphicon-eye-close");
		span.classList.add("glyphicon-eye-open");

		$('#' + inputId).prop("type", "password");
	}
}

function readImage(){
	if (this.files && this.files[0]) {
	    var fileReader = new FileReader();

		var bSize = this.files[0].size;
		var kbSize = bSize / 1024;
		var mbSize = kbSize / 1024;
		console.log(mbSize);
		if (mbSize > 1){
			$("#selectedImage").val("File too large (over 1MB)");
			return;
		}

		$('#selectedImage').val(this.files[0].name); // Show user that we're reading their file
	    fileReader.onload = function(e) {
			//console.log("Loaded fileReader");
			//$$('#base64Image').val (e.target.result); // Set the data we're sending to the server
			//$$('#pastedImage').attr('src', e.target.result); //
			drawImage(e.target.result);
	    };
	    fileReader.readAsDataURL( this.files[0] );
	}
}

function drawImage(imageData){
	var img = new Image;
	var canvas = document.getElementById("image_canvas");
	var context = canvas.getContext("2d");
	$('#base64Image').val (imageData);

	img.onload = function(){
		if (resizeCanvas == true){
			canvas.width = img.width;
			canvas.height = img.height;
			context.clearRect(0,0,canvas.width, canvas.height);
			context.drawImage(img, 0, 0);
		}else{
			var hRatio = canvas.width  / img.width;
			var vRatio =  canvas.height / img.height;
			var ratio  = Math.min ( hRatio, vRatio );
			var centerShift_x = ( canvas.width - img.width*ratio ) / 2;
			var centerShift_y = ( canvas.height - img.height*ratio ) / 2;
			context.clearRect(0,0,canvas.width, canvas.height);
			context.drawImage(img, 0,0, img.width, img.height,
				   centerShift_x,centerShift_y,img.width*ratio, img.height*ratio);
		}
	}

	img.src = imageData;
}
