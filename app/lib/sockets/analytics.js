var Analytics = {};
var data = {};

Analytics.calculateStuff = function(){
    return {
        browsers: calcBrowsers(),
        operatingSystems: calcOses(),
        pages: calcPages(),
        referrers: calcRefs(),
        totalUsers: getActiveUsers()
    };
};

Analytics.initUser = function( socketID, agent ){
    data[socketID] = {
        agent: agent
    };
};

Analytics.pageView = function( socketID, ref, loc){
    data[socketID].referer = ref;
    data[socketID].location = loc;
};

Analytics.disconnect = function( socketID ){
    delete data[socketID];
};

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

module.exports = Analytics;
