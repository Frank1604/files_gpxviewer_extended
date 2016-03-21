<?php
namespace OCA\Files_Gpxviewer_Extended\AppInfo;

require_once (__DIR__ . '/../sys/installer.php');

use OCP\Util;
Util::addScript('files_gpxviewer_extended', 'main' );
Util::addStyle('files_pdfviewer', 'style');
