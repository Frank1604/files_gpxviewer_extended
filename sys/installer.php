<?php
function check_mime(){
	// Nachschauen ob GPX bereits in der MIME-Datei hinterlegt ist
	$mime_file 		= file(__DIR__ .'/../../../lib/private/mimetypes.list.php');
	$search 		= 'gpx';
	$matches 		= array_filter($mime_file, function($var) use ($search) { return preg_match("/\b$search\b/i", $var); });
	
	if(!count($matches) > 0){ //Nicht gefunden, wird hinzugefuegt
		$key_gif 		= 'gif';
		$search_gif		= array_filter($mime_file, function($var) use ($key_gif) { return preg_match("/\b$key_gif\b/i", $var); });
		$key 			= array_keys($search_gif);
		$new_passed 	= 0;
		
		for($i = 0; $i < count($mime_file)+1; $i++){
			$old_i = $i;
			if($new_passed == 1){
				$old_i = $i - 1;
			}
			
			if($i == $key[0]+1){
				$new[$i] 	= "	'gpx' => array('application/gpx', null),";
				$new_passed = 1;
			} else {
				$new[$i] = rtrim($mime_file[$old_i],"\r\n");
			}
		}
		
		//TODO: catch errors for message
		file_put_contents(__DIR__ .'/../../../lib/private/mimetypes.list.php',implode("\r\n", $new));
		return 1;
	}
	return 0;
}

if(!file_exists(__DIR__ . '/installed')){
	if(check_mime() == 1){
		//Refresh filecache after adding GPX to MIME
		$query = \OC_DB::prepare('DELETE FROM oc_filecache');
		$query->execute();
	}
	touch(__DIR__ . '/installed'); 
}
