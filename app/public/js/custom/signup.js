var resizeCanvas = false;
$("#image").on("change", readImage);

$.formUtils.addValidator({
	name: "isChecked",
	validatorFunction: function (value, $ele, config, language, $form) {
		var toValidate = $ele.attr("data-validation-isChecked");
		console.log($(toValidate).prop("checked"));
		return $(toValidate).prop("checked");
	},
	errorMessage: "Please accept the Terms and Conditions",
	errorMessageKey: "notChecked"
});

$.validate({
	modules: 'security',

	validateOnBlur : false, // disable validation when input looses focus
	errorMessagePosition : 'top', // Instead of 'element' which is default
	validateHiddenInputs: true,

	onModulesLoaded: function () {
		var optionalConfig = {
			fontSize: '12pt',
			padding: '4px',
			bad: 'Very weak',
			weak: 'Fairly weak',
			good: 'Good',
			strong: 'Strong'
		};

		$('input[name="password_confirmation"]').displayPasswordStrength(optionalConfig);
	}
});

$("#accept_t_and_c").click(function (e) {
	agreeToTc();
});
function agreeToTc() {
	document.getElementById("t_and_c").checked = true;
	document.getElementById("t_and_c_accept").className = "btn btn-success";
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
