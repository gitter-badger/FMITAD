var lastCreated = "";
var panelEle = $("div#user-panels");
panelEle.empty();

$(document).ready(function(){
    $(window).scroll(function() {
        if ($(window).scrollTop() + $(window).height() == $(document).height() ) {
            loadMoreEvents();
        }
    });

    $("#event-add-more").click(function(){
        loadMoreEvents();
    });

    $("#joinEventBtn").click(function(){
        $.post("/api/event/" + $(this).attr("data-id") + "/join", function(data, status){

            if (status != "success"){
                console.log("Status wasn't success, it was " + status);
                return;
            }

            if (data.error){
                $("#placeholder1").html('<div class="alert alert-danger"><a class="close" data-dismiss="alert">×</a><span>' + data.error + '</span></div>');
            }else if(data.success){
                $("#placeholder1").html('<div class="alert alert-success"><a class="close" data-dismiss="alert">×</a><span> '+ data.success + '</span></div>');
            }

            $('#eventModal').modal("hide");

        });
    });

    $('[data-toggle="tooltip"]').tooltip();

    loadMoreEvents();
});

function eventClick (e){
    e.preventDefault();
    var me = $(this);

    $(me.attr("href")).modal("hide");

    $.get("/api/event/" + me.attr("data-id"), function(data, status){

        if (status !== "success"){
            console.log("Couldn't get the event");
            return;
        }

        if (data.error){
            console.log("Error getting data for event " + me.attr("data-id"));
            console.log(data.error);
            return;
        }

        // TODO: Set the modal data
        console.log(data);

        $(me.attr("href") + " h4.modal-title").html(data.details.title);
        $(me.attr("href") + " div.modal-body").html( genModalBodyHtml(data) );
        $(me.attr("href") + " button#joinEventBtn").attr("data-id", data.id);

        $(me.attr("href")).modal("show");
    });
}

function loadMoreEvents() {
    $.get("/api/events/all?lastCreated=" + lastCreated, function(data, status){
        //console.log("Got some?: " + JSON.stringify(data));
        if (data.events.length <= 0 || data.error){

            if(data.error)
                console.log("Error: " + data.error);
            else if(data.events.length <= 0)
                console.log("No more events..");

            return;
        }

        for(var i = 0; i < data.events.length; i++){

            var d = data.events[i];
            panelEle.append(getHtml(d));

            if (i == data.events.length -1){
                lastCreated = d.created_at;
                //console.log("Set last created; " + lastCreated);
            }
        }

        $('a[href="#eventModal"]').off("click", eventClick);
        $('a[href="#eventModal"]').on("click", eventClick);

    } );
}

function genModalBodyHtml( data ){
    var html = '<b>Description:</b>'
                + '<p>%(details.description)s</p>'
                + '<br/><b>Platform:</b>'
                + '<p>%(platform)s</p>'
                + '<br/><b>Created by:</b>'
                + '<p>%(owner.username)s</p>';

    return sprintf(html, data);
}

function getHtml( data ){
    var html = '<div class="col-xs-6 col-sm-4">'
            + '<div class="panel panel-default">'
            + '<div class="panel-heading">'
            +	'<a id="event" href="#eventModal" data-id="%(id)s" ><h3 class="panel-title">%(details.title)s</h3></a></div>'
            + '<div class="panel-body">'
                + "<p><b>Description:</b> %(details.description)s</p>"
                // + '<p>ID: %(id)s </p>'
                // + '<p>Owner: %(owner)s </p>'
                 + '<p><b>Platform:</b> %(platform)s </p>'
                // + '<p>Type: %(type)s </p>'
                // + '<p>created_at: %(created_at)s </p>'

            +'</div></div></div>';

    return sprintf(html, data)
}
