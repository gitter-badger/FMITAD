var Analytics = {};

Analytics.calculateStuff = function( connected ){
    return {
        browsers: calcBrowsers(connected),
        operatingSystems: calcOses(connected),
        pages: calcPages(connected),
        referrers: calcRefs(connected),
        totalUsers: getActiveUsers(connected)
    };
};

Analytics.initUser = function( client, agent ){
    client.agent = agent;
};

Analytics.pageView = function( client, ref, loc){
    client.referer = ref;
    client.location = loc;
};

function getActiveUsers( connected ){
    return Object.keys(connected).length;
}

function calcBrowsers( connected ){
    var browsers = {};

    for(var key in connected ){
        var browser = connected[key].agent.browser;
        if (browser in browsers)
            browsers[browser] ++;
        else
            browsers[browser] = 1;
    }

    return browsers;
}

function calcOses( connected ){
    var oses = {};

    for(var key in connected ){
        var os = connected[key].agent.os;
        if (os in oses)
            oses[os] ++;
        else
            oses[os] = 1;
    }
    return oses;
}

function calcPages( connected ){
    var pages = {};

    for(var key in connected){
        var page = connected[key].location;
        if (page in pages)
            pages[page] ++;
        else
            pages[page] = 1;
    }
    return pages;
}

function calcRefs( connected ){
    var referers = {};

    for(var key in connected){
        var ref = connected[key].referer || "(direct)";
        if (ref in referers)
            referers[ref] ++;
        else
            referers[ref] = 1;
    }
    return referers;
}

module.exports = Analytics;
