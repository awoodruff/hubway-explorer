var active = {"24":325,"25":326,"26":298,"27":321,"20":325,"21":324,"22":325,"23":325,"29":272,"4":287,"8":322,"59":284,"58":263,"55":286,"54":277,"57":303,"56":224,"51":260,"50":302,"53":314,"52":317,"88":34,"89":25,"82":57,"83":54,"80":56,"81":60,"86":49,"87":24,"84":53,"85":52,"3":320,"7":268,"39":318,"38":326,"33":315,"32":325,"31":310,"30":305,"37":287,"36":318,"35":320,"34":304,"60":267,"61":232,"62":210,"63":240,"64":221,"65":200,"66":60,"67":60,"68":59,"69":60,"6":317,"98":21,"91":34,"90":34,"93":23,"92":19,"95":21,"94":20,"97":21,"96":21,"11":322,"10":308,"13":321,"12":323,"15":314,"14":325,"17":322,"16":326,"19":53,"18":318,"48":317,"49":324,"46":325,"47":317,"44":312,"45":310,"42":317,"43":321,"40":326,"41":323,"5":315,"9":310,"77":55,"76":64,"75":64,"74":64,"73":64,"72":49,"71":47,"70":63,"79":61,"78":62};
$(function(){
	
	resize();
	$(window).resize(resize);
	
	var hoursFilter,
		durationFilter = [],
		ageFilter = [],
		tempFilter = [];
		
	var filterTimeout;
	
	$("#months p, #days p").addClass("selected");
	
	$(".section-header").click( function(){
		if ( $(this).next().is(":visible") ){
			$(this).next().slideUp();
			$(this).removeClass("open");
		} else {
			$(this).next().slideDown();
			$(this).addClass("open");
		}
	});
	
	$(".text-filter").click(function(){
		$(this).siblings().removeClass("selected");
		$(this).addClass("selected");
		updateFilters();
	});
	
	$("#months p, #days p").click(function(){
		clearTimeout(filterTimeout);
		if ( $(this).hasClass("selected") ) $(this).removeClass("selected");
		else $(this).addClass("selected");
		filterTimeout = setTimeout(updateFilters,500);
	});
	
	$("#duration-slider").slider({min:0,max:21600,values:[0,21600],step:300}).on("slide",function(){
		var vals = $(this).slider("values");
		if ( vals[0] == 0 && vals[1] == 21600 ){ durationFilter = []; $(this).prev().html("All durations") }
		else { durationFilter = vals; $(this).prev().html(formatDuration(vals)) };
		if ( vals[1] == 21600 ) {
			$("#duration-check").prop("checked",true);
			$("#duration-check").removeAttr("disabled");
		}else{
			$("#duration-check").prop("checked",false);
			$("#duration-check").attr("disabled",true);
		}
	}).on("slidestop",updateFilters);
	$("#duration-check").change(function(){
		updateFilters();
	});
	$("#age-slider").slider({min:17,max:80,values:[17,80]}).on("slide",function(){
		var vals = $(this).slider("values");
		if ( vals[0] == 17 && vals[1] == 80 ){ ageFilter = []; $(this).prev().html("All ages") }
		else { ageFilter = vals; $(this).prev().html(vals[0] + " to " + vals[1]) };
	}).on("slidestop",updateFilters);
	$("#temp-slider").slider({min:25,max:90,values:[25,90]}).on("slide",function(){
		var vals = $(this).slider("values");
		if ( vals[0] == 25 && vals[1] == 90 ){ tempFilter = []; $(this).prev().html("All temperatures"); }
		else { tempFilter = vals; $(this).prev().html(vals[0] + " to " + vals[1]) };
	}).on("slidestop",updateFilters);
	$(".plus").click( function(){
		clearTimeout(filterTimeout);
		var next = $(this).next(),
			val;
		if ( next.hasClass("hour") ){
			val = parseInt( next.html() );
			if ( ++val > 12 ) val = 1;
			next.html(val);
		} else if ( next.hasClass("minute") ){
			val = parseInt( next.html() );
			val += 5;
			if ( val == 60 ) val = 0;
			val = val.toString();
			if ( val.length == 1 ) val = "0"+val;
			next.html(val);
		} else {
			if ( next.html() == "AM" ) next.html("PM");
			else next.html("AM");
		}
		filterTimeout = setTimeout(updateFilters,1000);
	});
	$(".minus").click( function(){
		clearTimeout(filterTimeout);
		var next = $(this).prev(),
			val;
		if ( next.hasClass("hour") ){
			val = parseInt( next.html() );
			if ( --val < 1 ) val = 12;
			next.html(val);
		} else if ( next.hasClass("minute") ){
			val = parseInt( next.html() );
			val -= 5;
			if ( val < 0 ) val = 55;
			val = val.toString();
			if ( val.length == 1 ) val = "0"+val;
			next.html(val);
		} else {
			if ( next.html() == "AM" ) next.html("PM");
			else next.html("AM");
		}
		filterTimeout = setTimeout(updateFilters,1000);
	});

	function formatDuration(vals)
	{
		var min = [ parseInt(vals[0]/3600), (vals[0] % 3600)/60 ],
			max = [ parseInt(vals[1]/3600), (vals[1] % 3600)/60 ];
		var minStr = ( !min[0] && !min[1] ) ? "0 min" : (min[0] ? min[0] + " hr"+(min[0]>1?"s":"") : "");
		minStr += ( !min[0] && min[1] ) ? min[1] + " min" : (min[1] ? " " + min[1] + " min" : "");
		var maxStr = max[0] ? max[0] + " hr" + (max[0]>1?"s":""): "";
		maxStr += ( !max[0] && max[1] ) ? max[1] + " min" : (max[1] ? " " + max[1] + " min" : "");
		return minStr + " to " + maxStr;
	}
	
	var map = L.map('map').setView([42.3546, -71.0915], 13);
	var base = new L.MAPCTileLayer("basemap"),
		mg = new L.LayerGroup(),
		g = new L.LayerGroup();
	map.addLayer(base).addLayer(g).addLayer(mg);
	
	var originalData,
		trips,
		stations,
		markers = {},
		selected,
		total,
		p0,p1,p2,p3,p4,p5,p6,p7;
		
	$.getJSON("trips.json",function(data){
		originalData = data;
		trips = data;
		stations = {};
		for ( var i in data ){
			stations[i] = {lat:data[i].lat,lng:data[i].lng,name:data[i].name};
			var m = new L.CircleMarker( new L.LatLng(data[i].lat,data[i].lng), {opacity:0,weight:8,fillColor:"#333", fillOpacity: .75} )
				.setRadius(3)
				.on("click",function(){
					hideProbe();
					drawStation( getId(this) );
					if ( $("#mode-toggle").hasClass("overview") ){
						$("#mode-toggle").removeClass("overview");
						$("#mode-toggle").addClass("station");
						$("#mode-toggle").html("Click to view all stations");
						$("#station-legend").css("display","block");
						$("#overall-legend").css("display","none");
					}
				})
				.on("mouseover",showProbe)
				.on("mouseout",hideProbe);
			markers[i] = m;
			mg.addLayer( m );
		}
	
		getTotal();
		drawStation("36");
	});
	
	$("#mode-toggle").click( function(){
		if ( $(this).hasClass("overview") ) return;
		$("#mode-toggle").removeClass("station");
		$("#mode-toggle").addClass("overview");
		$("#mode-toggle").html("Click a station on the map to view its trips");
		$("#station-legend").css("display","none");
		$("#overall-legend").css("display","block");
		selected = null;
		$("#selected-label p#label").hide();
		drawAll();
	});

	var requestURL;
	function updateFilters()
	{
		var url = "trips.php";
		var pre = function(){ return url == "trips.php" ? "?" : "&" };
		if ($("#gender .text-filter.selected").html() != "All riders") url += (pre() + "gender="+$("#gender .text-filter.selected").html());
		if ( durationFilter.length ){
			var max = $("#duration-check").is("checked") ? 999999999 : durationFilter[1];
			url += (pre() + "duration="+durationFilter[0]+","+max);
		} else if (!$("#duration-check").is("checked")){
			url += (pre() + "duration=0,21600");
		}
		if ( ageFilter.length )  url += (pre() + "age="+ageFilter[0]+","+ageFilter[1]);
		var zipIndex = $("#zip-code .text-filter").index($("#zip-code p.selected"))
		if ( zipIndex !=4 ){
			if ( zipIndex == 0 ) var z = "hubway_area";
			else if ( zipIndex == 1 ) z = "inner_metro";
			else if ( zipIndex == 2 ) z = "south_west";
			else if ( zipIndex == 3 ) z = "north";
			url += pre() + "zip="+z;
		}
		if ( !ageFilter.length && $("#gender .text-filter.selected").html() == "All riders" && zipIndex !=4 ){
			if ($("#member-type .text-filter.selected").html() != "All members") url += (pre() + "member="+$("#member-type .text-filter.selected").html());
		}
		if ( tempFilter.length )  url += (pre() + "temp="+tempFilter[0]+","+tempFilter[1]);
		var months = [];
		$("#months p").each(function(index){
			if ( $(this).hasClass("selected") ) months.push(index+3);
		});
		if ( months.length < 9 && months.length > 0 ) url += pre() + "months=" + months.toString();
		var days = [];
		$("#days p").each(function(index){
			if ( $(this).hasClass("selected") ) days.push(index+1);
		});
		if ( days.length < 7 && days.length > 0 ) url += pre() + "days=" + days.toString();
		if ( $("#daylight .text-filter").index($("#daylight p.selected")) !=2 ){
			url += pre() + "dark=" + $("#daylight .text-filter").index($("#daylight p.selected"));
			// disable time filter
		} else if ( !($("#start-hour").html() == $("#end-hour").html() &&
				$("#start-minute").html() == $("#end-minute").html() &&
				$("#start-am").html() == $("#end-am").html()) ){
			var hr = parseInt($("#start-hour").html());
			if ( $("#start-am").html() == "PM" ) hr += 12;
			if ( hr == 24 || hr == 12 && $("#start-am").html() == "AM" ) hr = 0;
			hr = hr.toString();
			if ( hr.length == 1 ) hr = "0" + hr;
			var startTime = hr + ":" + $("#start-minute").html() + ":00";
			hr = parseInt($("#end-hour").html());
			if ( $("#end-am").html() == "PM" ) hr += 12;
			if ( hr == 24 || hr == 12 && $("#end-am").html() == "AM" ) hr = 0;
			hr = hr.toString();
			if ( hr.length == 1 ) hr = "0" + hr;
			var endTime = hr + ":" + $("#end-minute").html() + ":00";
			var t = $("#time .text-filter").index("#time p.selected") == 0 ? "starttime=" : "endtime=";
			url += pre() + t + startTime + "," + endTime;
		}
		if ( $("#precip .text-filter").index($("#precip p.selected")) !=2 ) url += pre() + "precip=" + $("#precip .text-filter").index($("#precip p.selected"));
		
		
		if ( url == requestURL ) return;
		requestURL = url;
		if ( url != "trips.php" ){
			showLoading();
			$.getJSON(url,function(data){
				$(".loader").remove();
				//console.log(data);
				trips = data;
				getTotal();
				if ( selected )
					drawStation(selected);
				else
					drawAll();
			});
		} else {
			trips = originalData;
			getTotal();
			if ( selected )
				drawStation(selected);
			else
				drawAll();
		}
	}
	
	function showProbe()
	{
		var id = getId(this);
		if ( !id ) return;
		if ( !selected ){
			var to = getTotalTo(id);
			var from = getTotalFrom(id);
			$("#probe").html("<p><strong>"+stations[id].name+"</strong></p><p>Total trips to: <strong>" + to + "</strong></p><p>Total trips from: <strong>" + from + "</strong></p>");
			$("#probe").css({display:"block",left:Math.min($(this._container).offset().left + 10,$(window).width()-$("#probe").outerWidth()-10)+"px",top:Math.max(5,$(this._container).offset().top - $("#probe").outerHeight()-10)+"px"});
		} else {
			to = trips[selected][id] || 0;
			from = trips[id][selected] || 0;
			$("#probe").html("<p><strong>"+stations[id].name+"</strong></p><p>From " + stations[selected].name+": <strong>" + to + "</strong></p><p>To " + stations[selected].name+": <strong>" + from + "</strong></p>");
			$("#probe").css({display:"block",left:Math.min($(this._container).offset().left + 10,$(window).width()-$("#probe").outerWidth()-10)+"px",top:Math.max(5,$(this._container).offset().top - $("#probe").outerHeight()-10)+"px"});
		}
	}
	function hideProbe()
	{
		$("#probe").css("display","none");
	}

	function drawAll()
	{
		g.clearLayers();
		var arr = [];
		for ( var i in stations ){
			if ( !trips[i] ) continue;
			for ( var j in trips[i] ){
				if ( j=="lat" || j=="lng" || j=="name" ) continue;
				//if ( trips[i][j] < 25*(total/552000) ) continue;
				var line = new L.Arc([new L.LatLng(stations[i].lat,stations[i].lng),new L.LatLng(stations[j].lat,stations[j].lng)],{color:lineColor(trips[i][j]/active[i]),opacity:.5,weight:.5, clickable: false});
				arr.push(line);
			}
		}
		arr.sort( function(){ return .5- Math.random() } );
		for ( i in arr ){
			g.addLayer(arr[i]);
		}
		map.removeLayer(mg);
		map.addLayer(mg);
	}
	function drawStation(i)
	{
		selected = i;
		$("#selected-label p#label").html(stations[i].name);
		$("#selected-label p#label").show();
		g.clearLayers();
		var a = getTotalFrom(i),
			t = getTotalTo(i),
			line;
	
		var arr = [];
		for ( var j in trips[i] ){
			if ( j=="lat" || j=="lng" || j=="name" ) continue;
			line = new L.Arc([new L.LatLng(stations[i].lat,stations[i].lng),new L.LatLng(stations[j].lat,stations[j].lng)],{color:'#A6611A',opacity:.75,weight:Math.min(20,100*trips[i][j]/(a+t)), clickable: false});
			arr.push(line);
		}
		for ( j in trips ){
			if ( trips[j][i] ){
				line = new L.Arc([new L.LatLng(stations[j].lat,stations[j].lng),new L.LatLng(stations[i].lat,stations[i].lng)],{color:'#018571',opacity:.75,weight:Math.min(20,100*trips[j][i]/(a+t)), clickable: false});
				arr.push(line);
			}
		}
		// randomize order of line drawing
		arr.sort( function(){ return .5- Math.random() } );
		for ( i in arr ){
			g.addLayer(arr[i]);
		}
		map.removeLayer(mg);
		map.addLayer(mg);
	}
	
	function getTotal()
	{
		total = 0;
		var arr = [];
		for ( var i in trips ){
			var a = active[i];
			for ( var j in trips[i] ){
				if ( j=="lat" || j=="lng" || j=="name" ) continue;
				total += trips[i][j];
				arr[arr.length] = trips[i][j]/a;
				
			}
		}
		arr.sort( function(a,b){return a-b} );
		p0 = ( arr[Math.floor(arr.length*.05)] );
		p1 = ( arr[Math.floor(arr.length*.10)] );
		p2 = ( arr[Math.floor(arr.length*.25)] );
		p3 = ( arr[Math.floor(arr.length*.50)] );
		p4 = ( arr[Math.floor(arr.length*.65)] );
		p5 = ( arr[Math.floor(arr.length*.80)] );
		p6 = ( arr[Math.floor(arr.length*.90)] );
		p7 = ( arr[Math.floor(arr.length*.95)] );
	}
	
	function lineWidth(n)
	{
		if ( n < p0 ) return .25;
		if ( n < p1 ) return .25;
		if ( n < p2 ) return .5;
		if ( n < p3 ) return 1;
		if ( n < p4 ) return 2;
		if ( n < p5 ) return 3;
		if ( n < p6 ) return 4;
		if ( n < p7 ) return 5;
		return 6;
	}
	function lineColor(n)
	{
		if ( n < p0 ) return "#EDF8B1";
		if ( n < p1 ) return "#C7E9B4";
		if ( n < p2 ) return "#7FCDBB";
		if ( n < p3 ) return "#41B6C4";
		if ( n < p4 ) return "#1D91C0";
		if ( n < p5 ) return "#225EA8";
		if ( n < p6 ) return "#253494";
		return "#081D58";
	}
	
	function getTotalTo(i)
	{
		var num = 0;
		for ( var j in trips ){
			if ( trips[j][i] ) num += trips[j][i];
		}
		return num;
	}
	
	function getTotalFrom(i)
	{
		var num = 0;
		for ( var n in trips[i] ){
			if ( n != "lat" && n != "lng" && n!= "name")
				num += trips[i][n];
		}
		return num;
	}
	
	function getId(m)
	{
		for ( var i in markers ){
			if ( markers[i] == m ) return i;
		}
	}
	
	function resize()
	{
		$("#map").height( $(window).height() - $("#header").outerHeight() - $("#footer").outerHeight() );
		$("#left").height( $(window).height() - $("#header").outerHeight() );
		$("#footer").width( $(window).width() - $("#left").outerWidth() );
	}
	
	function showLoading()
	{
		$("body").prepend(
			$( document.createElement( 'div' ) )
				.addClass( "loader" )
				.css({
					"height" : ( $("body").height() ) + "px",
					"width" : $("body").width() + "px"
				})
		);
	}
});