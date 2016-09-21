var lastCreated = "";
var panelEle = $("div#user-panels");
panelEle.empty();

$(document).ready(function(){
	$(window).scroll(function() {
		if ($(window).scrollTop() + $(window).height() == $(document).height() ) {
			loadMoreEvents();
		}
	});

	loadMoreEvents();
});

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
				console.log("Set last created; " + lastCreated);
			}
		}

	} );
}

function getHtml( data ){
	var html = '<div class="col-xs-6 col-sm-4">'
			+ '<div class="panel panel-default">'
			+ '<div class="panel-heading">'
			+	'<a href="/events/%(id)s" ><h3 class="panel-title">%(details.title)s</h3></a></div>'
			+ '<div class="panel-body">'
				+ '<p>ID: %(id)s </p>'
				+ '<p>Owner: %(owner)s </p>'
				+ '<p>Platform: %(platform)s </p>'
				+ '<p>Type: %(type)s </p>'
				+ '<p>created_at: %(created_at)s </p>'
			+'</div></div></div>';

	return sprintf(html, data)
}
