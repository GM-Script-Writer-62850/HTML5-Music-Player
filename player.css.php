<?php
$expires=86400;//24 hrs
header('Content-type: text/css; charset=UTF-8');
header("Pragma: public");
header("Cache-Control: maxage=$expires");
header('Expires: '.gmdate('D, d M Y H:i:s',time()+$expires).' GMT');
echo "/* ----- Begin PHP Generated CSS ----- */";
$ele="\n#audioUI input::";
$thumb=[
	"-moz-range-thumb",
	"-webkit-slider-thumb"
];
$track=[
	"-moz-range-track",
	"-webkit-slider-runnable-track"
];
foreach($thumb as $i){
	echo "$ele$i{
		-moz-appearance:none;
		-webkit-appearance:none;
		transition:background-color 0.25s;
		background-color:#999;
		border:none;
		border-radius:50%;
		cursor:ew-resize;
		width:15px;
		height:15px;
		margin-top:-6px;
	}";
	echo "$ele$i:hover{
		background-color:white;
	}";
}
foreach($track as $i){
	echo "$ele$i{
		background-color:#999;
		border-radius:3px;
		height:3px;
		border:none;
	}";
}
echo "\n/* ----- End PHP Generated CSS ----- */\n";
include('player.css');
?>
