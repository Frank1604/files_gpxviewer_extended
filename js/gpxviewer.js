/**
 * Created by Wiesemann on 12.02.2016.
 */
GpxViewer = {
	trans : {},

	registerL: function(l) {
		this.trans = l || {};
	},
	/**
	 * @param text
	 * @returns {*}
	 */
	t: function(text) {
		return this.trans[text] || text;
	},
	/**
	 * @param milli
	 * @returns {string}
	 */
	millisecondsToTime: function(milli) {
		var seconds = Math.floor((milli / 1000) % 60);
		var minutes = Math.floor((milli / (60 * 1000)) % 60);
		var hours = Math.floor((milli / (60 * 60 * 1000)) % 60);
		return (hours > 0 ? ("00" + hours).slice(-2) + ':' : '') + ("00" + minutes).slice(-2) + ":" + ("00" + seconds).slice(-2);
	},
	/**
	 * @param query
	 * @returns {{}}
	 */
	parseQueryString: function(query) {
	  var parts = query.split('&');
	  var params = {};
	  for (var i = 0, ii = parts.length; i < ii; ++i) {
		var param = parts[i].split('=');
		var key = param[0];
		var value = param.length > 1 ? param[1] : '';
		params[decodeURIComponent(key)] = decodeURIComponent(value);
	  }
	  return params;
	},
	/**
	 *
	 */
	showMap: function() {
		var self = this;
		var params = self.parseQueryString(document.location.search.substring(1));
		var file = 'file' in params ? params.file : '';
		var map = new L.Map('gpx_canvas', {center: new L.LatLng(53, 8), zoom: 5});
		var protok = window.location.protocol;
		var Mapnik_OSM = L.tileLayer(protok + '//{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
			attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
		}).addTo(map);
		var MapQuestOpen_OSM = L.tileLayer(protok + '//otile{s}' + (protok == 'https:' ? '-s' : '') + '.mqcdn.com/tiles/1.0.0/map/{z}/{x}/{y}.jpeg', {
			attribution: 'Tiles Courtesy of <a href="http://www.mapquest.com/">MapQuest</a> &mdash; Map data &copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
			subdomains: '1234'
		});
		var Esri_WorldImagery = L.tileLayer(protok + '//server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
			attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
		});
		var Esri_WorldTopoMap = L.tileLayer(protok + '//server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}', {
			maxZoom: 16,
			attribution: 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ, TomTom, Intermap, iPC, USGS, FAO, NPS, NRCAN, GeoBase, Kadaster NL, Ordnance Survey, Esri Japan, METI, Esri China (Hong Kong), and the GIS User Community'
		});
		var Thunderforest_OpenCycleMap = L.tileLayer(protok + '//{s}.tile.thunderforest.com/cycle/{z}/{x}/{y}.png', {
			attribution: '&copy; <a href="http://www.opencyclemap.org">OpenCycleMap</a>, &copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
		});
		var cLegend = $('#gpx_legend');
		var cChart = $('#gpx_charts');

		cLegend.click(function () {
			$(this).toggleClass('expanded');
		});
		cChart.click(function () {
			$(this).toggleClass('expanded');
		});

		map.addControl(new L.Control.Layers({
			"Mapnik OSM": Mapnik_OSM,
			"MapQuest OSM": MapQuestOpen_OSM,
			"Esri Satellite": Esri_WorldImagery,
			"Esri Topographic": Esri_WorldTopoMap,
			"Thunderforest OpenCycleMap": Thunderforest_OpenCycleMap
		}, null, {position: 'topleft'}));

		new L.GPX(file, {async: true}).on('loaded', function (e) {
			$(".mask").hide();

			var gpx = e.target;
			var trackPoints = gpx.get_trackpoints();
			var elebounds = gpx.get_ele_bounds();
			var gpxDesc = gpx.get_desc();
			var gpxAutor = gpx.get_author();
			var gpxAvHr = gpx.get_average_hr();
			var customColors = {green: '#648452', orange: '#890200', blue: '#0071DB', purple: '#E00F78'};
			var showPoint = L.marker(trackPoints[0], {
				icon: L.divIcon({
					className: 'leaflet-div-icon showpoint',
					html: '',
					iconSize: 10
				})
			}).addTo(map).setOpacity(0);
			map.fitBounds(gpx.getBounds());
			var splitPoints = [], distancePoints = [], elevationPoints = [], speedPoints = [], tpIndex = [], hrPoints = [], last100time = 0, last100dist = 0;

			// Datenverarbeitung
			var multipl = 1;
			if (gpx.get_distance() > 30000) {
				multipl = 2
			}
			if (gpx.get_distance() > 50000) {
				multipl = 5
			}
			if (gpx.get_distance() > 100000) {
				multipl = 10
			}
			$.each(trackPoints, function (k, v) {
				if (k == 0) {
					splitPoints.push({distance: 0, pace: 0, speed: 0, tp: v});
					distancePoints.push(0);
					elevationPoints.push(v.meta.ele);
					hrPoints.push(v.meta.hr);
					speedPoints.push(0);
					tpIndex.push(0);
					last100time = v.meta.time
				} else {
					if (v.meta.distTotal >= (distancePoints.length * 100 * multipl) || k == trackPoints.length - 1) {
						distancePoints.push(v.meta.distTotal);
						elevationPoints.push(v.meta.ele);
						speedPoints.push((v.meta.time - last100time) / ((v.meta.distTotal - last100dist) / 1000));
						hrPoints.push(v.meta.hr);
						tpIndex.push(k);
						last100time = v.meta.time;
						last100dist = v.meta.distTotal
					}
					if (v.meta.distTotal >= (splitPoints.length * 1000 * multipl) || k == trackPoints.length - 1) {
						var d = v.meta.distTotal - splitPoints[splitPoints.length - 1].distance;
						splitPoints.push({
							distance: v.meta.distTotal,
							pace: self.millisecondsToTime((v.meta.time - splitPoints[splitPoints.length - 1].tp.meta.time) / (d / 1000)),
							speed: ((d / ((v.meta.time - splitPoints[splitPoints.length - 1].tp.meta.time) / 1000)) * 3.6).toFixed(1),
							tp: v
						})
					}
				}
			});
			if (speedPoints.length > 1)speedPoints[0] = speedPoints[1];
			splitPoints.shift();

			// Legende
			var lTable = new self.Table(self.t('Trackname') + ': ' + gpx.get_name());
			if (gpxAutor) {
				lTable.addToCaption('<br/>' + self.t('Author') + ': ' + gpxAutor)
			}
			if (gpxDesc) {
				lTable.addToCaption('<br/>' + self.t('Description') + ': ' + gpxDesc)
			}
			lTable.addRow([self.t('Date') + ':', trackPoints[0].meta.time.toLocaleDateString()]);
			lTable.addRow([self.t('Start') + ':', trackPoints[0].meta.time.toLocaleTimeString()]);
			lTable.addRow([self.t('Moving Time') + ':', self.millisecondsToTime(gpx.get_moving_time())]);
			lTable.addRow([self.t('Duration') + ':', self.millisecondsToTime(gpx.get_total_time())]);
			lTable.addRow([self.t('Distance') + ':', (gpx.get_distance() / 1000).toFixed(2).replace('.', ',') + ' km']);
			lTable.addRow(['&empty; ' + self.t('Pace') + ':', self.millisecondsToTime(gpx.get_moving_pace()) + ' min']);
			lTable.addRow(['&empty; ' + self.t('Speed') + ':', gpx.get_moving_speed().toFixed(1) + ' km/h']);
			if (gpxAvHr) {
				lTable.addRow(['&empty; ' + self.t('Heartrate') + ':', gpxAvHr + ' min<sup>-1</sup>'])
			}
			lTable.addRow([self.t('Total Ascend') + ':', (elebounds.max - elebounds.min).toFixed(0) + ' m']);
			$('<label></label>').append(lTable.getTable()).appendTo(cLegend);
			var splitTable = new self.Table(self.t('Lap times'));
			splitTable.addThead([self.t('Kilometer'), self.t('Pace'), self.t('Speed')]);
			splitTable.addRowCss(['text-align:center;', null, 'text-align:right;']);
			$.each(splitPoints, function (k, v) {
				splitTable.addRow([(v.distance / 1000).toFixed(1), v.pace, v.speed + ' km/h']);
				if (k < splitPoints.length - 1) {
					L.marker(v.tp, {
						title: self.t('Time') + ': ' + self.millisecondsToTime(Math.abs(trackPoints[0].meta.time - v.tp.meta.time)) + ', ' + self.t('Lap time') + ': ' + v.pace + ' min, ' + self.t('Speed') + ': ' + v.speed + ' km/h',
						icon: L.divIcon({html: (k + 1) * multipl, iconSize: 16})
					}).addTo(map)
				}
			});
			$('<label></label>').append(splitTable.getTable()).appendTo(cLegend);

			// Chart
			(function (H) {
				H.wrap(H.Tooltip.prototype, 'hide', function (a) {
					showPoint.setOpacity(0);
					a.apply(this)
				})
			}(Highcharts));
			cChart.find('label').highcharts({
				chart: {
					zoomType: 'x', events: {
						tooltipRefresh: function () {
							showPoint.setOpacity(1)
						}
					}
				},
				plotOptions: {
					area: {
						fillColor: {
							linearGradient: {x1: 0, y1: 0, x2: 0, y2: 1},
							stops: [[0, customColors.green], [1, Highcharts.Color(customColors.green).setOpacity(0).get('rgba')]]
						}, marker: {radius: 1}, lineWidth: 1, states: {hover: {lineWidth: 1}}
					}, spline: {marker: {radius: 1}, lineWidth: 1, states: {hover: {lineWidth: 1}}}
				},
				title: {text: ''},
				legend: {enabled: false},
				xAxis: [{
					categories: distancePoints,
					alternateGridColor: Highcharts.Color(customColors.blue).setOpacity(0.2).get('rgba'),
					labels: {
						formatter: function () {
							return (this.value / 1000).toFixed(0) + ' km'
						}
					},
					tickInterval: 10
				}],
				yAxis: [{
					labels: {
						formatter: function () {
							return self.millisecondsToTime(this.value) + ' min'
						}, style: {color: customColors.orange}
					},
					gridLineWidth: 0,
					title: {text: self.t('Pace'), style: {color: customColors.orange}},
					tickPixelInterval: 30,
					reversed: true
				}, {
					title: {
						text: self.t('Height'),
						style: {color: customColors.green}
					},
					labels: {format: '{value} m', style: {color: customColors.green}},
					opposite: true,
					tickPixelInterval: 20
				}, {gridLineWidth: 0, title: {text: null}, labels: {enabled: false}}],
				tooltip: {
					formatter: function () {
						var a = (this.x < 1000) ? this.x.toFixed(0) + ' m' : (this.x / 1000).toFixed(2) + ' km';
						var s = '<b>' + self.t('Distance') + ': ' + a;
						s += ', ' + self.t('Time') + ': ' + self.millisecondsToTime(trackPoints[tpIndex[this.points[0].point.index]].meta.time - trackPoints[0].meta.time) + '</b>';
						s += '<br/>' + this.points[0].series.name + ': ' + this.points[0].y.toFixed(0) + ' m';
						s += '<br/>' + this.points[1].series.name + ': ' + self.millisecondsToTime(this.points[1].y) + ' min';
						s += '<br/>' + self.t('Speed') + ': ' + (3600000 / this.points[1].y).toFixed(2) + ' km/h';
						if (gpxAvHr) {
							s += '<br/>' + this.points[2].series.name + ': ' + this.points[2].y + ' min<sup>-1</sup>'
						}
						showPoint.setLatLng(trackPoints[tpIndex[this.points[0].point.index]]).update();
						return s
					}, crosshairs: [true], shared: true
				},
				series: [{
					name: self.t('Height'),
					type: 'area',
					yAxis: 1,
					color: customColors.green,
					data: elevationPoints
				}, {
					name: self.t('Pace'),
					type: 'spline',
					color: customColors.orange,
					data: speedPoints
				}, {
					name: self.t('Heartrate'),
					type: 'spline',
					yAxis: 2,
					color: customColors.purple,
					data: hrPoints
				}]
			});
			var chart = cChart.find('label').highcharts();
			chart.xAxis[0].options.startOnTick = false;
			chart.xAxis[0].options.endOnTick = false;
			chart.yAxis[0].setExtremes(gpx.get_moving_pace() - 120000, gpx.get_moving_pace() + 120000);
			chart.yAxis[1].setExtremes(Math.abs(elebounds.min - (elebounds.min % 20) - 40), elebounds.max - (elebounds.max % 20) + 40);
			if (gpxAvHr) {
				chart.yAxis[2].setExtremes(50, 150)
			}
			setTimeout(function () {
				chart.yAxis[0].update()
			}, 500);
		}).addTo(map);
	},
	/**
	 *
	 * @param e
	 * @constructor
	 */
	Table: function (e) {
		this._caption = e;
		this._table = $("<table></table>");
		this._rowCss = null;
		this.addToCaption = function (e) {
			this._caption += e
		};
		this.addRowCss = function (e) {
			this._rowCss = e
		};
		this.addThead = function (e) {
			var t = "<thead><tr>";
			$.each(e, function (e, n) {
				t += "<th>" + n + "</th>"
			});
			t += "</tr></thead>";
			this._table.prepend(t)
		};
		this.addRow = function (e) {
			var t = "<tr>";
			var n = this;
			$.each(e, function (e, i) {
				t += "<td" + (n._rowCss && n._rowCss[e] != null ? ' style="' + n._rowCss[e] + '"' : "") + ">" + i + "</td>"
			});
			t += "<tr>";
			this._table.append(t)
		};
		this.getTable = function () {
			if (this._caption)this._table.prepend("<caption>" + this._caption + "</caption>");
			return this._table
		}
	}
};

window.onload = function () {
	var gpx = GpxViewer;
	gpx.showMap();
};