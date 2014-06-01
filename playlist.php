<?php header("content-type: application/javascript"); ?>
var libary=<?php
	function tree($dir,$depth){
		$json=new stdClass();
		$scan=scandir($dir);
		$files=array();
		foreach($scan as $f){
			if(substr($f,0,1)=="."){// Skip hidden files (UNIX defination)
				continue;
			}
			if(is_dir("$dir/$f")){
				if($depth<10){// Max folder depth, this is to prevent a infinte loop
					$json->{$f}=tree("$dir/$f",$depth+1);
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
			$json->{"/"}=$files;
		}
		return $json;
	}
	echo json_encode(tree('library',0));
?>
