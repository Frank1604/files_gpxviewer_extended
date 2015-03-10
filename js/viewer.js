function viewGpx(file, data) {
	var dir = data.dir;
	var location = data.fileList.getDownloadUrl(file, dir);
	var loadMask = $('<div class="mask" style="background-image: url(' + OC.imagePath('core', 'loading.gif') + '); background-repeat: no-repeat;"></div>').appendTo('body');

	OC.addStyle('files_gpxviewer_extended', 'leaflet');
	OC.addStyle('files_gpxviewer_extended', 'leaflet.ie');
	OC.addStyle('files_gpxviewer_extended', 'gpxviewer');
	OC.addScript('files_gpxviewer_extended', 'leaflet', function () {
		OC.addScript('files_gpxviewer_extended', 'gpx', function () {
			OC.addScript('files_gpxviewer_extended', 'highcharts', function () {
				var cMain = $('#content');
				var cLegend = $('<div id="gpx_legend" class="expanded"></div>');
				var cMap = $('<div id="gpx-canvas"></div>');
				var cChart = $('<div id="gpx_charts" class="expanded"><label></label></div>');
				var cClose = $('<div id="gpx-close" title="' + t('files_gpxviewer_extended', 'Close') + '"></div>');

				$('#app-navigation, #app-content, form.searchbox, #preview, footer').fadeOut('slow').promise().done(function () {
					if ($('#preview').length) {
						cMain.css({position: 'absolute', top: '45px', height: ($(window).height() - 45) + 'px'});
						cChart.css('width', ($(window).width() - 280) + 'px');
						location = filename.ownerDocument.location.href + '&download';
						if ($('#fileList').length) {
							location += '&files=' + file.toString();
						}
						else {
							cClose.addClass('hidden');
						}
					}
					cMain.append(cMap.append(cLegend)).append(cChart).append(cClose);

					cClose.click(closeGpxViewer);
					cLegend.click(function () {
						$(this).toggleClass('expanded');
					});
					cChart.click(function () {
						$(this).toggleClass('expanded');
					});

					// Karte
					var map = new L.Map('gpx-canvas', {center: new L.LatLng(53, 8), zoom: 5});
					var Mapnik_OSM = L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
						attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
					}).addTo(map);
					var MapQuestOpen_OSM = L.tileLayer('http://otile{s}.mqcdn.com/tiles/1.0.0/map/{z}/{x}/{y}.jpeg', {
						attribution: 'Tiles Courtesy of <a href="http://www.mapquest.com/">MapQuest</a> &mdash; Map data &copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
						subdomains: '1234'
					});
					var Esri_WorldImagery = L.tileLayer('http://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
						attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
					});
					var Esri_WorldTopoMap = L.tileLayer('http://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}', {
						maxZoom: 16,
						attribution: 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ, TomTom, Intermap, iPC, USGS, FAO, NPS, NRCAN, GeoBase, Kadaster NL, Ordnance Survey, Esri Japan, METI, Esri China (Hong Kong), and the GIS User Community'
					});
					var Thunderforest_OpenCycleMap = L.tileLayer('http://{s}.tile.thunderforest.com/cycle/{z}/{x}/{y}.png', {
						attribution: '&copy; <a href="http://www.opencyclemap.org">OpenCycleMap</a>, &copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
					});

					map.addControl(new L.Control.Layers({
						"Mapnik OSM":Mapnik_OSM,
						"MapQuest OSM":MapQuestOpen_OSM,
						"Esri Satellite":Esri_WorldImagery,
						"Esri Topographic":Esri_WorldTopoMap,
						"Thunderforest OpenCycleMap":Thunderforest_OpenCycleMap
					}, null, {position:'topleft'}));

					new L.GPX(location, {async: true}).on('loaded', function (e) {
						loadMask.remove();
						// Variablen
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
										pace: millisecondsToTime((v.meta.time - splitPoints[splitPoints.length - 1].tp.meta.time) / (d / 1000)),
										speed: ((d / ((v.meta.time - splitPoints[splitPoints.length - 1].tp.meta.time) / 1000)) * 3.6).toFixed(1),
										tp: v
									})
								}
							}
						});
						if (speedPoints.length > 1)speedPoints[0] = speedPoints[1];
						splitPoints.shift();

						// Legende
						var lTable = new Table('Trackname: ' + gpx.get_name());
						if (gpxAutor) {
							lTable.addToCaption('<br/>Autor: ' + gpxAutor)
						}
						if (gpxDesc) {
							lTable.addToCaption('<br/>' + t('files_gpxviewer_extended', 'Description') + ': ' + gpxDesc)
						}
						lTable.addRow([t('files_gpxviewer_extended', 'Date') + ':', trackPoints[0].meta.time.toLocaleDateString()]);
						lTable.addRow([t('files_gpxviewer_extended', 'Start') + ':', trackPoints[0].meta.time.toLocaleTimeString()]);
						lTable.addRow([t('files_gpxviewer_extended', 'Duration') + ':', millisecondsToTime(gpx.get_moving_time())]);
						lTable.addRow([t('files_gpxviewer_extended', 'Distance') + ':', (gpx.get_distance() / 1000).toFixed(2).replace('.', ',') + ' km']);
						lTable.addRow(['&empty; ' + t('files_gpxviewer_extended', 'Pace') + ':', millisecondsToTime(gpx.get_moving_pace()) + ' min']);
						lTable.addRow(['&empty; ' + t('files_gpxviewer_extended', 'Speed') + ':', gpx.get_moving_speed().toFixed(1) + ' km/h']);
						if (gpxAvHr) {
							lTable.addRow(['&empty; ' + t('files_gpxviewer_extended', 'Heartrate') + ':', gpxAvHr + ' min<sup>-1</sup>'])
						}
						lTable.addRow([t('files_gpxviewer_extended', 'Altitude') + ':', (elebounds.max - elebounds.min).toFixed(0) + ' m']);
						$('<label></label>').append(lTable.getTable()).appendTo(cLegend);
						var splitTable = new Table(t('files_gpxviewer_extended', 'Lap times'));
						splitTable.addThead(['Kilometer', 'Pace', 'Speed']);
						splitTable.addRowCss(['text-align:center;', null, 'text-align:right;']);
						$.each(splitPoints, function (k, v) {
							splitTable.addRow([(v.distance / 1000).toFixed(1), v.pace, v.speed + ' km/h']);
							if (k < splitPoints.length - 1) {
								L.marker(v.tp, {
									title: t('files_gpxviewer_extended', 'Time') + ': ' + millisecondsToTime(Math.abs(trackPoints[0].meta.time - v.tp.meta.time)) + ', ' + t('files_gpxviewer_extended', 'Lap time') + ': ' + v.pace + ' min, ' + t('files_gpxviewer_extended', 'Speed') + ': ' + v.speed + ' km/h',
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
										return millisecondsToTime(this.value) + ' min'
									}, style: {color: customColors.orange}
								},
								gridLineWidth: 0,
								title: {text: 'Pace', style: {color: customColors.orange}},
								tickPixelInterval: 30,
								reversed: true
							}, {
								title: {
									text: t('files_gpxviewer_extended', 'Height'),
									style: {color: customColors.green}
								},
								labels: {format: '{value} m', style: {color: customColors.green}},
								opposite: true,
								tickPixelInterval: 20
							}, {gridLineWidth: 0, title: {text: null}, labels: {enabled: false}}],
							tooltip: {
								formatter: function () {
									var a = (this.x < 1000) ? this.x.toFixed(0) + ' m' : (this.x / 1000).toFixed(2) + ' km';
									var s = '<b>' + t('files_gpxviewer_extended', 'Distance') + ': ' + a;
									s += ', ' + t('files_gpxviewer_extended', 'Time') + ': ' + millisecondsToTime(trackPoints[tpIndex[this.points[0].point.index]].meta.time - trackPoints[0].meta.time) + '</b>';
									s += '<br/>' + this.points[0].series.name + ': ' + this.points[0].y.toFixed(0) + ' m';
									s += '<br/>' + this.points[1].series.name + ': ' + millisecondsToTime(this.points[1].y) + ' min';
									if (gpxAvHr) {
										s += '<br/>' + this.points[2].series.name + ': ' + this.points[2].y + ' min<sup>-1</sup>'
									}
									showPoint.setLatLng(trackPoints[tpIndex[this.points[0].point.index]]).update();
									return s
								}, crosshairs: [true], shared: true
							},
							series: [{
								name: t('files_gpxviewer_extended', 'Height'),
								type: 'area',
								yAxis: 1,
								color: customColors.green,
								data: elevationPoints
							}, {
								name: 'Pace',
								type: 'spline',
								color: customColors.orange,
								data: speedPoints
							}, {name: 'HR', type: 'spline', yAxis: 2, color: customColors.purple, data: hrPoints}]
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
				});
			});
		});
	});
}

function millisecondsToTime(milli) {
	var seconds = Math.floor((milli / 1000) % 60);
	var minutes = Math.floor((milli / (60 * 1000)) % 60);
	var hours = Math.floor((milli / (60 * 60 * 1000)) % 60);
	return (hours > 0 ? ("00" + hours).slice(-2) + ':' : '') + ("00" + minutes).slice(-2) + ":" + ("00" + seconds).slice(-2);
}
function closeGpxViewer() {
	$('#gpx-canvas, #gpx_charts, #gpx-close, #gpx-page-loader').remove();
	if ($('#preview').length) {
		$('#content').css({position: 'relative', top: '0', height: 'auto'});
	}
	$('#app-navigation, #app-content, form.searchbox, #preview, footer').fadeIn('slow');
}

$(document).ready(function () {
	if (typeof OCA !== 'undefined'
			&& typeof OCA.Files !== 'undefined'
			&& typeof OCA.Files.fileActions !== 'undefined'
	) {
		var mime = 'application/gpx';
		OCA.Files.fileActions.register(mime, 'View', OC.PERMISSION_READ, '', viewGpx);
		OCA.Files.fileActions.setDefault(mime, 'View');
	}
});

Table = function (e) {
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
};
