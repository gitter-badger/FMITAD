var notif = window.Notification || window.mozNotification
    || window.webkitNotification;

window.Notif = {};

// use window.Notif.enabledNotifications to check if the user has notifications enabled
window.Notif.setPreference = function( enabled ){
    console.log("Set preferences to: " + enabled);
    window.Notif.enabledNotifications = enabled;
}

window.Notif.checkPermission = function( ){
    console.log("Checking permissions");

    if (typeof notif == "undefined"){
        console.warn("Cannot check permission. Notifications not supported");
        return;
    }

    if ( window.Notif.enabledNotifications && notif.permission == "denied"){
        console.log("Umm.. ");
        //What to do? They have it enabled but have blocked us...
        return;
    }

    if ( notif.permission === "default" ){

        //Check if they have it enabled in preferences.
        if (window.Notif.enabledNotifications)
            notif.requestPermission( function(permission){} );

    }else{
        //They've probably denied us...
        //Respect their decision and move on..
    }
};

window.Notif.notify = function( title, options, methods ){
    if (typeof notif == "undefined"){
        console.warn("Cannot notify user. Notifications not supported");
        return;
    }

    // If they haven't allowed us via broswer or, they have it disabled in prefs.
    if (notif.permission == "denied" || !(window.Notif.enabledNotifications) ){
        console.warn("Cannot display notification. User denied us. :(");
        return;
    }

    if (notif.permission == "default" && window.Notif.enabledNotifications){
        alert("I need your permission to send you notifications.");
        window.Notif.checkPermission(  );
    }

    if (typeof options !== "object"){
        console.warn("Options for notification must be an object.");
        options = {};
    }

    if(typeof methods !== "object"){
        console.warn("methods must be an object");
        methods = {};
    }

    var notification = new notif(title, options);

    console.log(methods);

    if (methods.onclick)
        notification.onclick = methods.onclick;

    if (methods.onerror)
        notification.onerror = methods.onerror;

    if (methods.onshow)
        notification.onshow = methods.onshow;

    if (methods.onclose)
        notification.onclose = methods.onclose;

    setTimeout(notification.close.bind(notification), 10000);

};
