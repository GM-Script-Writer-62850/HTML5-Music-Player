var music=Array(),
	track,audio,pic,title,shuffle,repeat,err,playlist,offset;
function getId(id){
	return document.getElementById(id);
}
function randInt(min,max){
	var rand=Math.round(Math.random()*(max-min+1)+min);
	if(rand==max+1){
		return min;
	}
	return rand;
}
function sendEvt(element,event){
	evt = document.createEvent("HTMLEvents");
	evt.initEvent(event, true, true );
	return !element.dispatchEvent(evt);
}
function extToMime(ext){
	switch(ext){
		case "mp3":return "audio/mpeg";
		case "ogg":return "audio/ogg";
		case "aac":return "audio/aac";
		case "wav":return "audio/wave";
		default: "audio/"+ext;
	}
}
function wait4It(fn){// Dirty trick
	try{
		fn();
	}
	catch(e){
		setTimeout(function(){
			wait4It(fn);
		},7);
	}
}
function populateList(arr,e,dir){
	var li,i,x,cover;
	for(i in arr){
		if(i!="/"){
			li=document.createElement('li');
			li.className="folder";
			li.textContent=i;
			e.appendChild(li);
			li.addEventListener('click',function(event){
				event.stopPropagation();
				if(this.className.indexOf("open")==-1){
					this.className="open "+this.className;
				}
				else{
					this.className=this.className.substr(5);
				}
			},false);
			li.appendChild(document.createElement('ul'))
			populateList(arr[i],li.childNodes[1],dir+i+'/');
		}
		else{
			cover=false;
			for(x in arr[i]){
				if(arr[i][x].slice(0,arr[i][x].lastIndexOf('.')).toLowerCase()=="cover"){
					cover=arr[i][x];
					arr[i].splice(x,1);
					break;
				}
			}
			for(x in arr[i]){
				li=document.createElement('li');
				li.id=music.length;
				li.className="song";
				li.textContent=arr[i][x].substr(0,arr[i][x].lastIndexOf('.'));
				li.setAttribute('file',dir+arr[i][x]);
				li.setAttribute('cover',cover?dir+cover:'/icons/sound2.png');
				li.addEventListener('click',function(event){
					event.stopPropagation();
					var file=this.getAttribute('file'),
						cover=this.getAttribute('cover'),
						s=document.createElement('source'),
						mime=extToMime(file.substr(-3)),
						last=music[track];
					if(last.className.indexOf('playing')>-1){
						while(last.id!='playlist'){
							last.className=last.className.slice(0,-8);
							last=last.parentNode.parentNode;
						}
					}
					pic.src=cover;
					title.textContent=this.textContent;
					if(!audio.canPlayType(mime)){
						err.textContent="This browser does not support "+mime.substr(mime.indexOf('/')+1).toUpperCase()+" audio."
						err.className='open';
					}
					else{
						err.removeAttribute('class');
					}
					s.type=mime;
					s.src=file;
					audio.appendChild(s);
					if(audio.childNodes.length>1){
						audio.removeChild(audio.childNodes[0]);
					}
					audio.load();
					audio.play();
					track=parseInt(this.id);
					last=music[track];
					while(last.id!='playlist'){
						last.className+=' playing';
						last=last.parentNode.parentNode;
					}
				},false);
				e.appendChild(li);
				music.push(li);
			}
		}
	}
}
function init(){
	var ul=document.createElement('ul'),
		config=localStorage.getItem("config");
	audio=getId('audio');
	title=getId('title');
	pic=getId('cover');
	shuffle=getId('shuffle');
	repeat=getId('repeat');
	err=getId('error');
	offset=getId('player').offsetHeight+32;
	playlist=getId('playlist');
	playlist.appendChild(ul);
	populateList(libary,ul,'library/');// Folder containing music
	config=config!=null?JSON.parse(config):{// Default player settings
		"volume":.25,
		"track":0,
		"state":false,
		"time":0,
		"shuffle":true,
		"repeat":false
	};
	audio.addEventListener("ended",function(){
		var next=track;
		if(!repeat.checked){
			if(shuffle.checked){
				next=randInt(0,music.length-1);
			}
			else if(track+1 < music.length){
				next++;
			}
			else{
				next=0;
			}
		}
		
		sendEvt(music[next],'click');
	},false);
	getId('next').addEventListener("click",function(){
		if(track==music.length-1){
			track=-1;
		}
		sendEvt(music[track+1],'click');
	},false);
	getId('back').addEventListener("click",function(){
		if(track==0){
			track=music.length;
		}
		sendEvt(music[track-1],'click');
	},false);
	shuffle.checked=config["shuffle"];
	repeat.checked=config["repeat"];
	track=config["track"];
	if(config['time']==0&&track==0){
		sendEvt(audio,'ended');
	}
	else{
		sendEvt(music[track],'click');
		audio.pause();
		wait4It(function(){
			audio.currentTime=config["time"];
			if(config["state"]===false){
				audio.play();
			}
		});
	}
	audio.volume=config["volume"];
	window.onunload=function(){
		if(	isNaN(track) || isNaN(audio.currentTime) || isNaN(audio.volume) ){
			return;
		}
		localStorage.setItem("config",JSON.stringify({
			"volume":audio.volume,
			"track":track,
			"state":audio.paused===true,
			"time":audio.currentTime,
			"shuffle":shuffle.checked===true,
			"repeat":repeat.checked===true
		}));
	}
}
window.onresize=function(){
	playlist.style.maxHeight=window.innerHeight-offset+'px';
}
