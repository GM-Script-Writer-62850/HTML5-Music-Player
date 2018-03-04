"use strict";
var music=Array(),
	cLog=false,// show messages in brower console
	hst={"log":[],"indx":0},
	track,audio,pic,title,TITLE,shuffle,repeat,loop,err,playlist,offset,unPlayed;
function getId(id){
	return document.getElementById(id);
}
function log(msg){
	if(cLog)
		console.log(msg);
	return cLog;
}
function randInt(min,max){
	var rand=Math.round(Math.random()*(max-min+1)+min);
	if(rand==max+1){
		return min;
	}
	return rand;
}
function sendEvt(element,event){
	log('Event: '+event.substr(0,1).toUpperCase()+event.substr(1)+' on #'+element.id);
	element.dispatchEvent(new Event(event));
	/*var evt = document.createEvent("HTMLEvents");
	evt.initEvent(event, true, true );
	return !element.dispatchEvent(evt);*/
}
function extToMime(ext){
	log('File Extension: '+ext);
	switch(ext){
		case "mp3":return "audio/mpeg";
		case "ogg":return "audio/ogg";
		case "aac":return "audio/aac";
		case "wav":return "audio/wave";
		case "webm":return "audio/webm";
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
		},50);
	}
}
function reloadUnPlayed(init){
	log('Reset UnPlayed');
	var x,i=0;
	unPlayed=[];
	for(x in music){
		unPlayed.push(i);
		if(!init){
			music[x].removeAttribute('played');
		}
		i++;
	}
}
function populateList(arr,e,dir){
	var li,i,x,cover;
	for(i in arr){
		if(i!="/"){
			log('Found Folder: '+i);
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
					log('Found Cover: '+arr[i][x]);
					cover=arr[i][x];
					arr[i].splice(x,1);
					break;
				}
			}
			for(x in arr[i]){
				log('Found Audio: '+arr[i][x]);
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
					log("Now Playing: "+file);
					if(last.className.indexOf('playing')>-1){
						while(last.id!='playlist'){
							last.className=last.className.slice(0,-8);
							last=last.parentNode.parentNode;
						}
					}
					pic.src=cover;
					title.textContent=this.textContent;
					TITLE.textContent='Music Player: '+this.textContent;
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
	log('Begin Main JavaScript File');
	var config=localStorage.getItem("HTML5_music"),
		ul=document.createElement('ul');
	audio=getId('audio');
	title=getId('title');
	TITLE=getId('pageTitle');
	pic=getId('cover');
	shuffle=getId('shuffle');
	loop=getId('loop');
	repeat=getId('repeat');
	err=getId('error');
	offset=getId('player').offsetHeight+32;
	playlist=getId('playlist');
	playlist.appendChild(ul);
	sendEvt(window,'resize');
	populateList(library['music'],ul,library['path']);
	if(config==null){
		log('Reset config');
		config=null;
	}
	config=config!=null?JSON.parse(config):{// Default player settings
		"volume":.25,
		"track":0,
		"state":false,
		"time":0,
		"shuffle":true,
		"repeat":true,
		"loop":false,
		"tracks":0,
		"unPlayed":[]
	};
	log('Config Data:');
	log(config);
	unPlayed=config.unPlayed;
	if(unPlayed.length==0||config.tracks!=music.length){
		reloadUnPlayed(true);
	}
	if(unPlayed.length!=music.length){
		var i,id;
		for(i in music){
			id=parseInt(music[i].id);
			if(unPlayed.indexOf(id)==-1){
				log('#'+id+' has been played');
				music[i].setAttribute('played','yes');
			}
		}
	}
	audio.addEventListener("ended",function(){
		log('End Track: #'+track);
		var next=track,
			indx=unPlayed.indexOf(next);
		if(unPlayed.length>0){
			log('Tracks not played: '+unPlayed.length);
			if(audio.currentTime/audio.duration >= 0.15){ // At least 15% of file was played
				log('Tack #'+track+' was Played');
				music[track].setAttribute('played','yes');
				if(indx>-1){
					unPlayed.splice(indx,1);
				}
				else{
					log('Said track was played already');
				}
			}
			else{
				log('Tack #'+track+' was Skipped');
				indx++;
			}
		}
		else{
			reloadUnPlayed(false);
		}
		if(loop.checked){
			log('Track Loop');
			audio.currentTime=0;
			return audio.play();
		}
		hst.indx++;
		if(hst.log.length>hst.indx){
			log('Back feature was used: '+hst.indx+'/'+hst.log.length);
			sendEvt(music[hst.log[hst.indx]],'click');
			return true;
		}
		else if(hst.indx>hst.log.length){
			hst.log.push(track);
			hst.log=hst.log.slice(music.length*-1);
			if(hst.indx>hst.log.length)
				hst.indx=hst.log.length;
		}
		if(shuffle.checked){
			log('Shuffle Tracks');
			if(repeat.checked){
				log('Allow Repeats');
				next=randInt(0,music.length-1);
			}
			else{
				next=randInt(0,unPlayed.length-1);
				next=unPlayed[next];
			}
		}
		else if(!repeat.checked){
			log('Ordered Tracks w/ No Repeats');
			next=unPlayed[indx>-1?indx:0];
		}
		else{
			log('Ordered Tracks w/ Repeats');
			if(track+1 < music.length){
				next++;
			}
			else{
				next=0;
			}
		}
		if(next==track){
			audio.currentTime=0;
			return audio.play();
		}
		sendEvt(music[next],'click');
	},false);
	getId('next').addEventListener("click",function(){
		sendEvt(audio,'ended');
	},false);
	getId('back').addEventListener("click",function(){
		if(hst.indx==0){
			log('History: '+hst.indx+' - '+JSON.stringify(hst.log));
			return alert('Out of History');
		}
		if(hst.indx==hst.log.length){
			hst.log.push(track);
			if(hst.log.length>music.length)
				hst.indx--;
			log('Add this track to history');
			hst.log=hst.log.slice(music.length*-1);
		}
		hst.indx--;
		log('History: '+hst.indx+' - '+JSON.stringify(hst.log));
		sendEvt(music[hst.log[hst.indx]],'click');
	},false);
	shuffle.checked=config["shuffle"];
	loop.checked=config["loop"];
	repeat.checked=config["repeat"];
	if(loop.checked){
		repeat.disabled=true;
		shuffle.disabled=true;
	}
	loop.addEventListener('click',function(){
		repeat.disabled=this.checked;
		shuffle.disabled=this.checked;
	},false);
	track=config["track"]>music.length-1?0:config["track"];
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
		if( isNaN(track) || isNaN(audio.currentTime) || isNaN(audio.volume) ){
			log('Abort save');
			return;
		}
		localStorage.setItem("HTML5_music",JSON.stringify({
			"volume":audio.volume,
			"track":track,
			"state":audio.paused===true,
			"time":audio.currentTime,
			"shuffle":shuffle.checked===true,
			"repeat":repeat.checked===true,
			"loop":loop.checked===true,
			"tracks":music.length,
			"unPlayed":unPlayed
		}));
		log('Session Saved');
	}
	document.addEventListener('keyup',function(event){// keyboard shortcuts
		switch(event.which){
			case 32:audio[audio.paused?'play':'pause']();return;// spacebar
			case 107:audio.volume=audio.volume+.1>1?1:audio.volume+.1;return;// + (num pad)
			case 109:audio.volume=audio.volume-.1<0?0:audio.volume-.1;return;// - (num pad)
			case 37:getId('back').click();return;// left arrow
			case 39:getId('next').click();return;// right arrow
			case 38:audio.currentTime+=5;return;// up arrow
			case 40:audio.currentTime-=5;return;// down arrow
			case 83:shuffle.checked=!shuffle.checked;return;// s
			case 82:repeat.checked=!repeat.checked;return;// r
			case 76:loop.click();return;// l
		}
	},false);
	audio.addEventListener('keyup',function(event){// for firefox
		if(event.which==32)
			event.stopPropagation();
	},false);
}
window.onresize=function(){
	playlist.style.maxHeight=window.innerHeight-offset+'px';
}
