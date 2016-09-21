
			var resizeCanvas = false;
			$("#image").on("change", readImage);

			<% if (user.profile.image ) { %>
				drawImage("<%= user.profile.image %>");
			<% } else { %>
				drawImage("http://robohash.org/<%= user.id %>");
			<% } %>

			$.validate({
				validateOnBlur: false, // Validate on form.submit()
				errorMessagePosition : 'top'
			});

			// Make sure the user knows if their password is weak or strong..
			$("#new_password").passwordStrength("#new_password_result");

			$(document).ready(function(){

				$("[data-tooltip='tooltip']").tooltip();

				$("#tabs").tab();

				var id = window.location.hash.substr(1);
				$("#" +id).tab("show");

				$("#qr_continue").click(function(e){
					var password = $('#qr_password_confirm').val();

					$.post("/api/two-factor", {password: password }, function( data, status ){
						if(!data.success){
							$('#qr_error').html(data.error);
						}else{

							$("#qr_form").html("<div id='otp_qr' style='width: 100%; height: 100%'></div><br/>"
											 + "<h4>If you cannot see the QR code above enter the code below into your authenticator app</h4>"
										 	 + "<p><span id='otp_key'></span></p><br/>"

										 	 + '<form id="verify-2fa" role="form" method="post" action="/profile/two-factor-verify"><div class="form-group">'
											 + '<label for="token">Enter the 6 didgit code you see</label>'
								 		 	 + '<input id="token" name="token" type="text" required>'
											 + '<input type="password" name="password" value="' + password +'" hidden >'
								 			 + '<input type="submit" value="Verify" class="btn btn-primary"></div></form>');
							 var qrCode = new QRCode(document.getElementById("otp_qr"),{
 								text: data.uri,
 								width: 128,
 								height: 128
 							});

							$("#otp_key").html(data.key);

						}
					});
				});

			});

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
