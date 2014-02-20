L.Arc = L.Polyline.extend({
	_getPathPartStr: function (points) {
		var round = L.Path.VML;

		for (var j = 0, len2 = points.length, str = '', p, r, a; j < len2; j++) {
			p = points[j];
			if (round) {
				p._round();
			}
			if ( !j ){
				str += 'M' + p.x + ' ' + p.y;
			} else {
				r = .5*Math.sqrt( (p.x - points[j-1].x)*(p.x - points[j-1].x) + (p.y - points[j-1].y)*(p.y - points[j-1].y) );
				a = -(L.LatLng.RAD_TO_DEG * Math.atan2( p.x-points[j-1].x, p.y-points[j-1].y ) - 90);
				str += 'A' + (r*1.1) + ' ' + (r*.5) + ' ' + a + ' 0 1 ' + p.x + ' ' +p.y; 
			}
		}
		return str;
	},
});