$("a[href='#search']").on("click", function(event) {
    event.preventDefault();
    $("#search").addClass("open");
    $('#search > form > input[type="search"]').focus();
});

$("#search, #search button.close").on("click keyup", function(event) {
    if (event.target == this || event.target.className == 'close' || event.keyCode == 27) {
        $(this).removeClass("open");
    }
});

$('form').submit(function(event) {
    event.preventDefault();

    $("#search").removeClass("open");
    var q = $("#search > form > input[type='search']").val();

    var panelEle = $("div#user-panels");
    panelEle.empty();

    if (q.trim() == ""){
        panelEle.append("<div class='alert alert-info' role='alert'>"
                        + "<strong>Hey!</strong> You must enter something... This can be an email, username or id (If you have it)</div>");
        return;
    }

    $.get("/api/search-user?q=" + encodeURIComponent(q), function(data, status){
        if (data.length <= 0){
            //TODO: No users found :(
            panelEle.append("<div class='alert alert-danger' role='alert'>"
                            + "<strong>Aw, snaps!</strong> Looks like we couldn't find anyone with \"" + q + "\"</div>");
            return;
        }

        for(var i = 0; i < data.length; i++){
            var d = data[i];
            panelEle.append(createPanelHtml(d));
        }

        console.log("Success!");
    });

    return false;
});

function createPanelHtml (data){

    var html = "<div class='panel panel-default'>"
            + '<div class="panel-heading"><h3 class="panel-title">'
            + '<a href="/user/%(id)s"> %(nameId)s </a>'
            + '</h3></div>'
            + "<div class='panel'>"
            + '<div class="panel-body">'
            + "<img src='%(profileImage)s' width='100' height='100' />"
            + "<p>ID: %(id)s </p>"
            + "<a class='btn btn-success' href='/user/%(id)s/follow'>Follow</a>"
            + "</div></div></div>";
    return sprintf(html, data);
}
