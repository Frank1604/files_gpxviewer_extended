(function(OCA) {

	OCA.FilesGpxViewer = OCA.FilesGpxViewer || {};

	/**
	 * @namespace OCA.FilesGpxViewer.PreviewPlugin
	 */
	OCA.FilesGpxViewer.PreviewPlugin = {

		/**
		 * @param fileList
		 */
		attach: function(fileList) {
			this._extendFileActions(fileList.fileActions);
		},

		hide: function() {
			$('#gpxframe').remove();
			FileList.setViewerMode(false);
			$('#controls').removeClass('hidden');
		},

		/**
		 * @param downloadUrl
		 * @param isFileList
		 */
		show: function(downloadUrl, isFileList) {
			var self = this;
			var $iframe;
			var viewer = OC.generateUrl('/apps/files_gpxviewer_extended/?file={file}', {file: downloadUrl});
			$iframe = $('<iframe id="gpxframe" style="width:100%;height:100%;display:block;position:absolute;top:0;" src="'+viewer+'" sandbox="allow-scripts allow-same-origin allow-popups" />');

			if(isFileList === true) {
				FileList.setViewerMode(true);
			}

			if ($('#isPublic').val()) {
				// force the preview to adjust its height
				$('#preview').append($iframe).css({height: '100%'});
				$('body').css({height: '100%'});
				$('footer').addClass('hidden');
				$('#imgframe').addClass('hidden');
				$('.directLink').addClass('hidden');
				$('.directDownload').addClass('hidden');
			} else {
				$('#app-content').append($iframe);
			}
			$('#controls').addClass('hidden');

			// if a filelist is present, the GPXViewer can be closed to go back there
			$('#gpxframe').load(function(){
				var iframe = $('#gpxframe').contents();
				if ($('#fileList').length) {
					iframe.find('#gpx_close').click(function() {
						self.hide();
					});
				} else {
					iframe.find("#gpx_close").hide();
				}
			});

			if(!$('html').hasClass('ie8')) {
				$(window).one('popstate', function (e) {
					self.hide();
				});
			}
		},

		/**
		 * @param fileActions
		 * @private
		 */
		_extendFileActions: function(fileActions) {
			var self = this;
			fileActions.registerAction({
				name: 'view',
				displayName: 'Favorite',
				mime: 'application/gpx',
				permissions: OC.PERMISSION_READ,
				actionHandler: function(fileName, context) {
					var downloadUrl = '';
					if($('#isPublic').val()) {
						var sharingToken = $('#sharingToken').val();
						downloadUrl = OC.generateUrl('/s/{token}/download?files={files}&path={path}', {
							token: sharingToken,
							files: fileName,
							path: context.dir
						});
					} else {
						downloadUrl = Files.getDownloadUrl(fileName, context.dir);
					}
					self.show(downloadUrl, true);
				}
			});
			fileActions.setDefault('application/gpx', 'view');
		}
	};

})(OCA);

if(!$.browser.msie || ($.browser.msie && $.browser.version >= 9)){
	OC.Plugins.register('OCA.Files.FileList', OCA.FilesGpxViewer.PreviewPlugin);
}

$(document).ready(function(){
	// Doesn't work with IE below 9
	if(!$.browser.msie || ($.browser.msie && $.browser.version >= 9)){
		if ($('#isPublic').val() && $('#mimetype').val() === 'application/gpx') {
			var sharingToken = $('#sharingToken').val();
			var downloadUrl = OC.generateUrl('/s/{token}/download', {token: sharingToken});
			var viewer = OCA.FilesGpxViewer.PreviewPlugin;
			viewer.show(downloadUrl, false);
		}
	}
});
