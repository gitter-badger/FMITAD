
(function ($) {

    $.fn.passwordStrength = function( resultSelector ){
        $(this).keyup(function(){
            $(resultSelector).html(checkStrength( resultSelector, $(this).val() ));
        });

        function checkStrength(selector, password) {
            var strength = 0;
            if (password.length <= 0){
                $(selector).removeClass();
                return "";
            }

            if (password.length < 4) {
                $(selector).removeClass();
                $(selector).addClass('short');
                return "It's a bit short.. Don't you think?";
            }

            if (password.length > 6) {
                strength += 1;
            }
            // If password contains both lower and uppercase characters, increase strength value.
            if (password.match(/([a-z].*[A-Z])|([A-Z].*[a-z])/)) {
                strength += 1;
            }

            // If it has numbers and characters, increase strength value.
            if (password.match(/([a-zA-Z])/) && password.match(/([0-9])/)){
                strength += 1;
            }

            // If it has one special character, increase strength value.
            if (password.match(/([!,%,&,@,#,$,^,*,?,_,~])/)) {
                strength += 1;
            }

            // If it has two special characters, increase strength value.
            if (password.match(/(.*[!,%,&,@,#,$,^,*,?,_,~].*[!,%,&,@,#,$,^,*,?,_,~])/)){
                 strength += 1;
             }
            // Calculated strength value, we can return messages
            // If value is less than 2
            if (strength < 2) {
                $(selector).removeClass();
                $(selector).addClass('weak');
                return "Weak... Please tell me you don't use this...";
            } else if (strength == 2) {
                $(selector).removeClass();
                $(selector).addClass('good');
                return "That's better";
            } else {
                $(selector).removeClass();
                $(selector).addClass('strong');
                return "There we go! That's what we like to see! A nice and strong password";
            }
        }
    }

})(jQuery);
