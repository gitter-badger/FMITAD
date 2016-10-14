var socket = io();

//TODO: Add more?
var notificationFunctions = {
    "open-page" : function( toOpen ){
        console.log("Opening: " + toOpen);
        window.open( toOpen, '_blank' );
    }
};

socket.on("connection", function(){
    console.log("Successfully connected");
});


socket.emit("page view", {
    ref: document.referer,
    loc: location.pathname
});


socket.on("notification", function( notification ){
    if ( notification.title ){
        var methods = {};
        if (notification.methods){

            if (notification.methods.onclick){
                methods.onclick = function() { notificationFunctions[notification.methods.onclick.type](notification.methods.onclick.params); };
            }
        }

        window.Notif.notify(notification.title, notification.options, methods);

    }
});
