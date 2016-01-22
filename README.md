GPX-Viewer for OwnCloud v 7.x, 8.xaaaa
==================================

This Plugin allows you to show .GPX files directly in the Browser. It's a fork from the Plugin by [Restless123][3].

This Plugin is using [LeafletJS][0], a fork of the [GPX plugin by Maxime Petazzoni][2] and [highcharts][4].

==================================


HowTo Use
---------
**OC8.2**
To get this working with OC8.2 you have to add an entry in your /config/mimetypemapping.json
"gpx": ["application/gpx"]

If this file dont exist, create it. It shoud look like:
{
"gpx": ["application/gpx"]
}

Then running "php occ files:scan --all

** **IMPORTANT** **
This App modifies the `mimetypes.list.php` (`lib/private/mimetypes.list.php`) to enable .gpx support
Please check the Permissions for writing, at the moment the Installationroutine does **NOT** care about success or fail while overwrite the file.

Attention: When installing this app, oc_filecache is flushed and this breaks all shares.

If you **DON'T** want that the installer to modifies your `mimetypes.list.php`, create a file called `installed` located in the app-folder `sys` (`apps/files_gpxviewer_extended/sys/`). This prevents the app to run the automatic-installation and flushing oc_filecache.

If you want to add the gpx support by yourself:

- Open the `mimetypes.list.php` and add

	```
	'gpx' => array('application/gpx', null),
	```

- Clear the filecache in the Database
	e.g. Sqlite3-Database on *nix:

	```
	sqlite3 /{path}/{to}/owncloud/data/owncloud.db 'DELETE FROM oc_filecache;'
	```


Normal-Installation:
---------
- Download Master as Zip.
- Unzip
- Rename the Folder to `files_gpxviewer_extended`
- Upload to owncloud/apps
- Activate


[0]: http://leafletjs.com/
[1]: http://owncloud.org/
[2]: https://github.com/mpetazzoni/leaflet-gpx
[3]: https://github.com/Restless123/Owncloud-GPXviewer
[4]: http://www.highcharts.com/
