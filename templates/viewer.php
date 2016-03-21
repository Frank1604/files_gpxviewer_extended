<?php
	/** @var array $_ */
	/** @var OCP\IURLGenerator $urlGenerator */
	$urlGenerator = $_['urlGenerator'];
	$version      = \OCP\App::getAppVersion('files_gpxviewer_extended');
?>
<html dir="ltr" mozdisallowselectionprint moznomarginboxes>
	<head>
		<meta charset="utf-8">
		<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">
		<meta name="google" content="notranslate">
		<meta name="referrer" content="never">
		<title>GPX Viewer</title>
		<script src="<?php p($urlGenerator->linkTo('files_gpxviewer_extended', 'js/jquery.min.js')) ?>?v=<?php p($version) ?>"></script>
		<script src="<?php p($urlGenerator->linkTo('files_gpxviewer_extended', 'js/leaflet.js')) ?>?v=<?php p($version) ?>"></script>
		<script src="<?php p($urlGenerator->linkTo('files_gpxviewer_extended', 'js/gpx.js')) ?>?v=<?php p($version) ?>"></script>
		<script src="<?php p($urlGenerator->linkTo('files_gpxviewer_extended', 'js/highcharts.js')) ?>?v=<?php p($version) ?>"></script>
		<script src="<?php p($urlGenerator->linkTo('files_gpxviewer_extended', 'js/gpxviewer.js')) ?>?v=<?php p($version) ?>"></script>
		<script src="<?php p($urlGenerator->linkTo('files_gpxviewer_extended', 'js/lang/' . $l->getLanguageCode() . '.js')) ?>?v=<?php p($version) ?>"></script>

		<link rel="stylesheet" href="<?php p($urlGenerator->linkTo('files_gpxviewer_extended', 'css/leaflet.css')) ?>?v=<?php p($version) ?>"/>
		<link rel="stylesheet" href="<?php p($urlGenerator->linkTo('files_gpxviewer_extended', 'css/leaflet.ie.css')) ?>?v=<?php p($version) ?>"/>
		<link rel="stylesheet" href="<?php p($urlGenerator->linkTo('files_gpxviewer_extended', 'css/gpxviewer.css')) ?>?v=<?php p($version) ?>"/>
	</head>

	<body tabindex="1">
	<div id="mask" class="mask" style="background-image: url(<?php p($urlGenerator->linkTo('core', 'img/loading.gif')) ?>); background-repeat: no-repeat;"></div>
	<div id="gpx_canvas">
		<div id="gpx_legend" class="expanded"></div>
	</div>
	<div id="gpx_charts" class="expanded"><label></label></div>
	<div id="gpx_close" title="<?php p($l->t('Close')); ?>"></div>
	</body>
</html>
