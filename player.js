"use strict";
var track,audio,audioUI,pic,title,ID3,shuffle,repeat,loop,err,playlist,offset,unPlayed,
	log=false,// Show messages in brower console
	music=Array(),
	hst={
		"log":[],
		"indx":0,
		"nav":false,
		"add":function(){
			var trim=hst.log.length;
			if(isNaN(audio.duration))
				return log("Do not add",track,"to history");
			log('Add track',track,'to history');
			hst.log.push(track);
			hst.log=hst.log.slice(music.length*-1);
			if(hst.indx>hst.log.length)
				hst.indx=hst.log.length;
			return trim==hst.log.length;
		}
	};
function getId(id){
	return document.getElementById(id);
}
function randInt(min,max){
	max++;
	var rand=Math.round(Math.random()*(max-min)+min);
	rand=rand==max?min:rand;
	log("RNG",{"min":min,"max":max-1,"int":rand});
	return rand;
}
function sendEvt(element,event){
	log('Send',event,'event to',element);
	//element.dispatchEvent(new Event(event));//This does not work in IE11
	var evt = document.createEvent("HTMLEvents");
	evt.initEvent(event, true, true );
	return !element.dispatchEvent(evt);
}
function sec2time(t){
	var min=Math.floor(t/60),
		sec=Math.round(t-min*60);
	if(sec==60){
		min++;
		sec=0
	}
	if(sec<10){
		sec='0'+sec;
	}
	return min+':'+sec;
}
function extToMime(ext){
	ext=ext.toLowerCase();
	log('File Extension:',ext);
	switch(ext){
		case "mp3":return "audio/mpeg";
		case "m4a":return "audio/mpeg";
		case "ogg":return "audio/ogg";
		case "oga":return "audio/ogg";
		case "aac":return "audio/aac";
		case "wav":return "audio/wave";
		case "webm":return "audio/webm";
		case "flac":return "audio/flac";
		default: return "audio/"+ext;
	}
}
function play(){
	var promise=audio.play();
	if(promise!==undefined){
		promise.then(function(){
			log('Audio playback started!');
		}).catch(function(){
			console.warn('Audio playback was prevented by browser. See https://goo.gl/xX8pDD');// Note that using => breaks IE
			sendEvt(audio,'pause');
		});
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
	repeat.parentNode.title="Played: 0/"+music.length;
}
function setPlayed(i,test){
	if(test===false){
		log('Track',i,'has been played');
		music[i].setAttribute('played','yes');
		return;
	}
	i=unPlayed.indexOf(i);
	if(unPlayed.length>0){
		log('Tracks not played:',unPlayed.length);
		if(audio.currentTime/audio.duration >= 0.15){// At least 15% of file was played
			setPlayed(track,false);
			if(i>-1){
				unPlayed.splice(i,1);
				repeat.parentNode.title="Played: "+(music.length-unPlayed.length)+"/"+music.length;
			}
			else{
				log('Said track was played already');
			}
		}
		else{
			log('Track',i,'was Skipped');
			i++;
		}
	}
	i=i==unPlayed.length?0:i;
	if(unPlayed.length==0){
		reloadUnPlayed(false);
	}
	return i;
}
function applyID3(id3){
	var unown='<Unknown>';
/*	if(id3.title){
		title.head.textContent=id3.title+" | "+title.page;
	}*/
	ID3.title.textContent=id3.title?id3.title:unown;
	ID3.artist.textContent=id3.artist?id3.artist:unown;
	ID3.album.textContent=id3.album?id3.album:unown;
	if(!id3.year&&id3.recording_time){
		id3.year=id3.recording_time;
	}
	ID3.year.textContent=id3.year?id3.year:unown;
}
function populateList(arr,e,dir){
	var li,i,x,cover;
	for(i in arr){
		if(i!="/"){
			log('Found Folder:',i);
			li=document.createElement('li');
			li.className="folder";
			li.setAttribute('path',dir+i);
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
			li.addEventListener('dblclick',function(event){
				event.stopPropagation();
				var p=this.getAttribute('path');
				p=p.substr(p.indexOf('/')+1);
				if(confirm('Only play from:\n\t'+p)){
					// Yes, it is possible to accomplish this via JavaScript, but this was quick and easy implementation for a feature I do not care about
					document.location.href=document.location.pathname+'?folder='+encodeURIComponent(p);
				}
			},false);
			li.appendChild(document.createElement('ul'))
			populateList(arr[i],li.childNodes[1],dir+i+'/');
		}
		else{
			cover=false;
			for(x in arr[i]){
				if(!arr[i][x] && x.slice(0,x.lastIndexOf('.')).toLowerCase()=="cover"){
					log('Found Cover:',x);
					cover=x;
					delete(arr[i][x]);
					break;
				}
			}
			for(x in arr[i]){
				log('Found Audio:',x);
				li=document.createElement('li');
				li.id=music.length;
				li.className="song";
				li.textContent=x.substr(0,x.lastIndexOf('.'));//title
				if(arr[i][x]){// id3 tags
					li.setAttribute('id3',JSON.stringify(arr[i][x]));
				}
				li.setAttribute('file',dir+x);
				li.setAttribute('cover',cover?dir+cover:'/icons/sound2.png');
				li.addEventListener('click',function(event){
					event.stopPropagation();
					if(hst.nav){// manual navigation
						hst.add();
						hst.indx=hst.log.length;
						setPlayed(track,true);
					}
					hst.nav=true;
					var file=this.getAttribute('file'),
						cover=this.getAttribute('cover'),
						s=document.createElement('source'),
						mime=extToMime(file.substr(file.lastIndexOf('.')+1)),
						last=music[track],
						id3=this.getAttribute('id3');
					log("Now Playing:",file);
					if(track==this.id && !isNaN(audio.duration)){
						audio.currentTime=0;
						return play();
					}
					if(last.className.indexOf('playing')>-1){
						while(last.id!='playlist'){
							last.className=last.className.slice(0,-8);
							last=last.parentNode.parentNode;
						}
					}
					pic.src=escape(cover);
					title.player.textContent=this.textContent;
					title.head.textContent=this.textContent+" | "+title.page;
					if(id3!==null){
						id3=JSON.parse(id3);
						applyID3(id3);
					}
					else if(library.id3===true){
						applyID3({});
					}
					showError(audio.canPlayType(mime)?false:"This browser does not support "+mime.substr(mime.indexOf('/')+1).toUpperCase()+" audio.");
					s.type=mime;
					s.src=escape(file);
					audio.appendChild(s);
					if(audio.childNodes.length>1){
						audio.removeChild(audio.childNodes[0]);
					}
					audio.load();// Let autoplay handle it
					track=parseInt(this.id);
					last=music[track];
					while(last.id!='playlist'){
						last.className+=' playing';
						last=last.parentNode.parentNode;
					}
					sendEvt(window,'resize');
					if(library.id3===true&&id3===null){
						var httpRequest=new XMLHttpRequest();
						httpRequest.onreadystatechange=function(){
							if(httpRequest.readyState==4){
								if(httpRequest.status==200){
									log("HTTP Request:",httpRequest.responseURL,"\n",httpRequest.responseText);
									if(httpRequest.responseText.length==0){
										return console.error("Non-UTF8 character in ID3 data at:\n",
											decodeURIComponent(httpRequest.responseURL.slice(httpRequest.responseURL.indexOf('=')+1,httpRequest.responseURL.indexOf('&'))));
									}
									var r=JSON.parse(httpRequest.responseText);
									if(!r.id3){
										return;
									}
									music[r.track].setAttribute('id3',JSON.stringify(r.id3));
									if(track==r.track){
										applyID3(r.id3);
									}
								}
								else if(httpRequest.status==404){
									showError("This Tack no longer exist!");
									var r=JSON.parse(httpRequest.responseText);
									log("404 Error:",music[r.track].getAttribute('file'));
								}
								else{
									console.error("HTTP Status Code:"+httpRequest.status+"\n"+httpRequest.responseText);
								}
							}
						};
						httpRequest.open('GET','playlist.php?file='+encodeURIComponent(file)+'&track='+track);
						httpRequest.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
						httpRequest.send(null);
					}
				},false);
				e.appendChild(li);
				music.push(li);
			}
		}
	}
}
function showError(msg){
	var a=audioUI?audioUI.ui:audio;
	if(!msg){
		if(!!a.style.display){
			a.removeAttribute('style');
		}
		if(!!err.className)
			err.removeAttribute('class');
	}
	else{
		console.error(msg);
		a.style.display='none';
		err.className="open";
		err.textContent=msg;
	}
}
function init(){
	log=log?console.log:function(){};
	log('Begin Main JavaScript File');
	var i,lst,
		config=localStorage.getItem("HTML5_music"),
		path=library.path.split('/'),
		ul=document.createElement('ul'),
		base={// Default player settings
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
	audio=getId('audio');
	title={
		"player":getId('title'),
		"head":getId('pageTitle'),
	}
	title.page=title.head.textContent;
	ID3={
		"title":getId('id3_title'),
		"artist":getId('id3_artist'),
		"album":getId('id3_album'),
		"year":getId('id3_year')
	};
	pic=getId('cover');
	shuffle=getId('shuffle');
	loop=getId('loop');
	repeat=getId('repeat');
	err=getId('error');
	err.addEventListener('click',function(){
		showError(false);
	},false);
	playlist=getId('playlist');
	playlist.appendChild(ul);
	if(path.length>2){
		log('Create partent directory folder');
		var path=library.path.split('/'),
			li=document.createElement('li');
		li.className="back";
		path=path.slice(1,-2);
		path=path.join('/');
		li.setAttribute('path',path);
		path=path.substr(path.lastIndexOf('/')+1);
		li.textContent=path==''?'All Music':path;
		ul.appendChild(li);
		li.addEventListener('click',function(event){
			event.stopPropagation();
			var p=this.getAttribute('path');
			if(confirm('Play from:\n\t'+(p==''?'All Music':p))){
				p=p==''?p:'?folder='+encodeURIComponent(p);
				document.location.href=document.location.pathname+p;
			}
		},false);
	}
	populateList(library.music,ul,library.path);
	if(!library.id3){
		getId('id3').style.display='none';
	}
	//config=config==null?base:JSON.parse(config);
	config=JSON.parse(config);
	for(i in base){
		if(config[i]===undefined){
			config[i]=base[i];
		}
	}
	log('Config Data:',config);
	unPlayed=config.unPlayed;
	if(config.tracks!=music.length){
		log('Playlist has changed');
		config.time=base.time;
		config.track=base.track;
		config.state=base.state;
		reloadUnPlayed(true);
	}
	else if(unPlayed.length==0){
		reloadUnPlayed(true);
	}
	if(unPlayed.length!=music.length){
		for(var i in music){
			i=parseInt(music[i].id);
			if(unPlayed.indexOf(i)==-1){
				setPlayed(i,false);
			}
		}
	}
	audio.addEventListener("error",function(e){
		console.error(
			"https://developer.mozilla.org/en-US/docs/Web/API/MediaError",
			"\n",
			this.error
		);
		showError([
				this.error.message,
				"The fetching of the associated resource was aborted by the user's request.",
				"Some kind of network error occurred which prevented the media from being successfully fetched, despite having previously been available.",
				"Despite having previously been determined to be usable, an error occurred while trying to decode the media resource, resulting in an error.",
				"The associated resource or media provider object (such as a MediaStream) has been found to be unsuitable."
			][this.error.message==""?this.error.code:0]
		);
	},false);
	audio.addEventListener("ended",function(){
		if(music.length==0){
			return showError(library.error||"Playlist is empty");
		}
		log('End Track:',track);
		var next=track,
			indx=setPlayed(track,true);
		if(loop.checked){
			log('Track Loop');
			audio.currentTime=0;
			return play();
		}
		hst.nav=false;
		hst.indx++;
		if(hst.log.length>hst.indx){
			log('Back feature was used:',hst.indx,'of',hst.log.length);
			sendEvt(music[hst.log[hst.indx]],'click');
			return true;
		}
		else if(hst.indx>hst.log.length){
			hst.add();
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
		if(next==track&&!!audio.childNodes[0].tagName){
			audio.currentTime=0;
			return play();
		}
		log("Next Track ID is: #",next);
		sendEvt(music[next],'click');
	},false);
	audioUI=getId('audioUI');
	if(!String.fromCodePoint&&audioUI){// The input event does not work in IE; Only IE does not have String.fromCodePoint
		audioUI.parentNode.removeChild(audioUI);
		audioUI=false;
	}
	if(audioUI){
		audioUI={
			"ui":audioUI,
			"state":getId('playPause'),
			"time":getId('current'),
			"now":getId('time'),
			"end":getId('length'),
			"mute":getId('mute'),
			"volume":getId('volume'),
			"seeking":false,
			"autoPause":false
		};
		// Play/Pause
		audioUI.state.addEventListener('click',function(){
			audio[audio.paused?'play':'pause']();
		},false);
		audio.addEventListener('pause',function(){
			audioUI.state.textContent=String.fromCharCode(9654);
			audioUI.state.title="Play";
		},false);
		audio.addEventListener('play',function(){
			audioUI.state.textContent=String.fromCharCode(10074,10074);
			audioUI.state.title="Pause";
		},false);
		// Time Slider and track Time
		audio.addEventListener('timeupdate',function(){
			if(audioUI.seeking) return;
			audioUI.time.value=(audio.currentTime/audio.duration).toFixed(8);
			audioUI.now.textContent=sec2time(audio.currentTime);
		},false);
		audioUI.time.addEventListener('change',function(){
			audio.currentTime=audio.duration*this.value;
			audioUI.seeking=false;
			if(audioUI.autoPause){
				play();
				audioUI.autoPause=false;
			}
		},false);
		audioUI.time.addEventListener('mouseup',function(){
			// Possible to not fire change if user leaves slider in the same point they started
			audioUI.seeking=false;
		},false);
		audioUI.time.addEventListener('input',function(){
			if(!audio.paused&&audio.duration-audio.currentTime<1){
				audioUI.autoPause=true;
				audio.pause();
			}
			audioUI.seeking=true;
			audioUI.now.textContent=sec2time(audio.duration*this.value);
		},false);
		audio.addEventListener('loadedmetadata',function(){
			audioUI.end.textContent=sec2time(audio.duration);
		},false);
		//Mute Button
		audioUI.mute.addEventListener('click',function(){
			audio.muted=!audio.muted;
		},false);
		// Volume Slider
		audio.addEventListener('volumechange',function(){
			audioUI.volume.value=audio.volume;
			if(audio.muted){
				audioUI.volume.title='Muted';
				//audioUI.mute.textContent=String.fromCodePoint(128264);
				audioUI.mute.textContent=String.fromCharCode(57559);
			}
			else{
				audioUI.volume.title=Math.round(audio.volume*100)+'%';
				//audioUI.mute.textContent=String.fromCodePoint(Math.round(audio.volume)==0?128265:128266);
				audioUI.mute.textContent=String.fromCharCode(Math.round(audio.volume)==0?57558:57557);
			}
		},false);
		audioUI.volume.addEventListener('input',function(){
			audio.volume=this.value;
			audio.muted=false;
		},false);
		audioUI.volume.addEventListener('dblclick',function(){
			var p=prompt('Desired volume level as a percentage',Math.round(audio.volume*100));
			if(!p) return;
			p=parseInt(p);
			if(isNaN(p)) return alert('Sorry that is not a whole number');
			if(p>=0&&p<=100){
				audio.volume=p/100;
			}
			else{
				alert(p+' is a percentage, it must be between 0 and 100');
			}
		},false);
		// Make sure volume slider matches player volume
		if(config.volume==1) sendEvt(audio,'volumechange');
	}
	else{
		audioUI=false;
		audio.controls=true;
	}
	offset=getId('player').offsetHeight+30;
	getId('next').addEventListener("click",function(){
		sendEvt(audio,'ended');
	},false);
	getId('back').addEventListener("click",function(){
		if(hst.indx==0){
			log('History:',hst.indx,'-',hst.log);
			return alert('Out of History');
		}
		if(hst.indx==hst.log.length){
			if(hst.add()){
				hst.indx--;
			}
		}
		hst.indx--;
		log('History:',hst.indx,'-',hst.log);
		hst.nav=false;
		sendEvt(music[hst.log[hst.indx]],'click');
	},false);
	getId('wipe').addEventListener("click",function(){
		if(music.length==unPlayed.length){
			return alert('No tracks have been played!');
		}
		if(confirm("All tracks will be marked as unplayed.\n\nTracks marked as played: "+(music.length-unPlayed.length)+" of "+music.length)){
			reloadUnPlayed(false);
		}
	},false);
	shuffle.checked=config.shuffle;
	loop.checked=config.loop;
	repeat.checked=config.repeat;
	repeat.parentNode.title="Played: "+(music.length-unPlayed.length)+"/"+music.length;
	if(loop.checked){
		repeat.disabled=true;
		shuffle.disabled=true;
	}
	loop.addEventListener('click',function(event){
		event.stopPropagation();
		repeat.disabled=this.checked;
		shuffle.disabled=this.checked;
		repeat.parentNode.className=this.checked;
		shuffle.parentNode.className=this.checked;
	},false);
	lst=[shuffle,repeat,loop];
	for(i in lst){// checkboxes are annoying on smart phones
		lst[i].parentNode.addEventListener('click',function(){
			this.childNodes[1].click();
		},false);
		if(lst[i]!==loop){
			lst[i].addEventListener('click',function(event){
				event.stopPropagation();
			},false);
		}
	}
	track=config.track>music.length-1?0:config.track;
	if(config.time==0&&track==0){
		sendEvt(audio,'ended');
	}
	else{
		audio.addEventListener('canplay',function fn(e){
			e.target.removeEventListener(e.type, fn);
			log('Restore track state from previous session');
			audio.currentTime=config.time;
			if(config.state===false){//audio[config.state===false?'play':'pause']();
				play();
			}
			else{
				audio.pause();
			}
		},false);
		sendEvt(music[track],'click');
	}
	audio.volume=config.volume;
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
		event.preventDefault();// Prevent scrolling main body
		switch(event.which){
			case 32:audio[audio.paused?'play':'pause']();return;// spacebar
			case 107:audio.volume=(audio.volume+.1>1?1:audio.volume+.1);return;// + (num pad)
			case 109:audio.volume=(audio.volume-.1<0?0:audio.volume-.1);return;// - (num pad)
			case 37:getId('back').click();return;// left arrow
			case 39:getId('next').click();return;// right arrow
			case 38:audio.currentTime+=5;return;// up arrow
			case 40:audio.currentTime-=5;return;// down arrow
			case 83:if(!event.ctrlKey) shuffle.checked=!shuffle.checked;return;// s
			case 82:if(!event.ctrlKey) repeat.checked=!repeat.checked;return;// r
			case 76:if(!event.ctrlKey) loop.click();return;// l
		}
		return false;
	},false);
	audio.addEventListener('focus',function(event){// for firefox
		this.blur();
	},false);
	hst.debug=getId('debugHst');// Potential use as play history viewer
	if(hst.debug){
		hst.debug.style.width='320px';
		hst.debugHst=function(e){
			e.textContent='hst.indx = '+hst.indx;
			for(var i in hst.log){
				e.appendChild(document.createElement('br'));
				e.appendChild(document.createTextNode(i+' : '+music[hst.log[i]].textContent));
			}
			setTimeout(function(){hst.debugHst(e);},100);
		}
		log=console.log;
		hst.debugHst(hst.debug);
		playlist.setAttribute('style','max-height:60px;min-height:30px;');// Let me see what I'm doing
	}
}
window.onresize=function(){
	playlist.style.maxHeight=window.innerHeight-offset+(window.innerWidth<=320?24:0)+'px';
}
