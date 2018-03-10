<?php
$F='library';// Name of folder containing music
$getID3='/usr/share/php/getid3/getid3.php';// Path to php getID3; Use non-existant file path to disable
$initGetID3=false;// Send ID3 data on page load *** DO NOT USE THIS ON SLOW SERVER LIKE A RASPBERRY PI ***
/* ---- PHP getID3 Notes -----
	* php-getid3 is not required
	Set $getID3 to the /path/to/getid3.php
	The php-getid3 package will install it to: /usr/share/php/getid3/getid3.php

	When initGetID3 is set to true ALL id3 data will be sent at page load, this takes over 100 times longer
	When initGetID3 is set to false the client will ask the server for id3 data if php-getid3 is installed
*/
if(isset($_GET['file'])&&isset($_GET['track'])){
	header("content-type: application/json; charset=utf-8");
	$file=explode('/',$_GET['file']);
	$track=(int)$_GET['track'];
	if(!file_exists($getID3)||array_search('..',$file)!==false||$file[0]!=$F){// Change in server config or theoretical attack on server
		die('{"id3":false,"track":'.$track.',"access":"denied"}');
	}
	$file=$_GET['file'];
	if(!file_exists($file)){
		header("HTTP/1.0 404 Not Found");
		die('{"id3":false,"track":'.$track.'}');
	}
	require_once($getID3);
	$getID3=new getID3;
	$getID3=$getID3->analyze($file)['tags']['id3v2'];
	die(json_encode((object)array(
		"id3"=>$getID3===null?false:$getID3,
		"track"=>$track
	)));
}
header("content-type: application/javascript; charset=utf-8");
?>
var library=<?php
	function tree($dir,$depth,$getID3){
		$json=new stdClass();
		$scan=scandir($dir);
		$files=array();
		$exclude=array('txt','rtf','m3u','pls','m3u8','wpl','asx','xml','asx','bio','fpl','kpl','pla','plc','aimppl','smil','vlc','xspf','zpl'); // https://en.wikipedia.org/wiki/Playlist#Types_of_playlist_files
		foreach($scan as $f){
			if(substr($f,0,1)=="."||// Skip hidden files (UNIX defination)
				in_array(strtolower(substr($f,strrpos($f,'.')+1)),$exclude)){// Skip playlist files and text file notes
				continue;
			}
			if(is_dir("$dir/$f")){
				if($depth<10){// Max folder depth, this is to prevent a infinte loop
					$json->{$f}=tree("$dir/$f",$depth+1,$getID3);
				}
				else{
					$json->{$f}=array("Error: Too Deep"=>array("Infinite loop prevention"=>array()));
				}
			}
			else{
				array_push($files,$f);
			}
		}
		if(count($files)>0){
			$mfiles=(object)array();
			foreach($files as $f){
				if(!$getID3){
					$mfiles->{$f}=false;
				}
				else if(strtolower(substr($f,0,-3))=='cover.'){
					$mfiles->{$f}=false;
				}
				else{
					$mfiles->{$f}=$getID3->analyze("$dir/$f")['tags']['id3v2'];
				}
			}
			$json->{"/"}=$mfiles;
		}
		return $json;
	}
	$mtime=microtime(true);
	if($initGetID3==true && file_exists($getID3)){
		require_once($getID3);
		$getID3=new getID3;
	}
	else{
		$initGetID3=file_exists($getID3);
		$getID3=false;
	}
	if(isset($_SERVER['HTTP_REFERER'])){
		parse_str(parse_url($_SERVER['HTTP_REFERER'], PHP_URL_QUERY), $REF_GET);
		if(isset($REF_GET['folder'])){
			$dir=$REF_GET['folder'];
			if(is_dir("$F/$dir")&&array_search('..',explode('/',$dir))===false){
				$F="$F/$dir";
			}
		}
	}
	echo json_encode(array(
		'music'=>tree($F,0,$getID3),
		'path'=>"$F/",
		'id3'=>$initGetID3||!is_bool($getID3),
		'loadTime'=>microtime(true)-$mtime
	));
?>;
if(console&&console.log){
	console.log("Playlist load time: "+library.loadTime);
}
else{
	var console={
		"log":function(){},
		"info":function(){},
		"warn":function(){},
		"error":function(){}
	};
}
