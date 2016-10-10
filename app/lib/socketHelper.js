var ua = require("express-useragent");

var Analytics = {};

function calculateStuff(){
    return {
        browsers: calcBrowsers(),
        operatingSystems: calcOses(),
        pages: calcPages(),
        referrers: calcRefs(),
        totalUsers: getActiveUsers()
    };
}
function getActiveUsers(){
    return Object.keys(Analytics).length;
}

function calcBrowsers(){
    var browsers = {};

    for(var key in Analytics){
        var browser = Analytics[key].agent.browser;
        if (browser in browsers)
            browsers[browser] ++;
        else
            browsers[browser] = 1;
    }

    return browsers;
}

function calcOses(){
    var oses = {};

    for(var key in Analytics){
        var os = Analytics[key].agent.os;
        if (os in oses)
            oses[os] ++;
        else
            oses[os] = 1;
    }
    return oses;
}
function calcPages(){
    var pages = {};

    for(var key in Analytics){
        var page = Analytics[key].location;
        if (page in pages)
            pages[page] ++;
        else
            pages[page] = 1;
    }
    return pages;
}
function calcRefs(){
    var referers = {};

    for(var key in Analytics){
        var ref = Analytics[key].referer || "(direct)";
        if (ref in referers)
            referers[ref] ++;
        else
            referers[ref] = 1;
    }
    return referers;
}

function Helper ( io ){
    if (!(this instanceof Helper)){
		return new Helper(io);
	}

    console.log("Setting IO");
    io.on("connection", function(socket){
        console.log("User has connected: " + socket.id);

        Analytics[socket.id] = {
            agent: ua.parse(socket.handshake.headers["user-agent"])
        };

        // Example notification
        socket.emit ( "notification",
                    {
                        title:"Test title",
                        options:{
                            body:"Hello from socket.io"
                        },
                        methods: {
                            onclick: {
                                type: "open-page",
                                params: "https://google.com"
                            }
                        }
                    });

        socket.on("page view", function( data ){
            Analytics[socket.id].referer = data.ref;
            Analytics[socket.id].location = data.loc;

            console.log("New Analytics: \n" + JSON.stringify( calculateStuff() ));
        });

        socket.on("disconnect", function(){
            delete Analytics[socket.id];
        });
    });
};

module.exports = Helper;
