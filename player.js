"use strict";
var track,audio,pic,title,ID3,shuffle,repeat,loop,err,playlist,offset,unPlayed,
	log=false,// Show messages in brower console
	music=Array(),
	hst={
		"log":[],
		"indx":0,
		"nav":false,
		"add":function(){
			var trim=hst.log.length;
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
function extToMime(ext){
	ext=ext.toLowerCase();
	log('File Extension:',ext);
	switch(ext){
		case "mp3":return "audio/mpeg";
		case "ogg":return "audio/ogg";
		case "oga":return "audio/ogg";
		case "aac":return "audio/aac";
		case "wav":return "audio/wave";
		case "webm":return "audio/webm";
		case "flac":return "audio/flac";
		default: return "audio/"+ext;
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
			log('Tack',i,'was Skipped');
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
/*	if(id3.title&&id3.title[0]){
		title.head.textContent=id3.title+" | "+title.page;
	}*/
	ID3.title.textContent=id3.title&&id3.title[0]?id3.title[0]:unown;
	ID3.artist.textContent=id3.artist&&id3.artist[0]?id3.artist[0]:unown;
	ID3.album.textContent=id3.album&&id3.album[0]?id3.album[0]:unown;
	ID3.year.textContent=id3.year&&id3.year[0]?id3.year[0]:unown;
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
					if(last.className.indexOf('playing')>-1){
						while(last.id!='playlist'){
							last.className=last.className.slice(0,-8);
							last=last.parentNode.parentNode;
						}
					}
					pic.src=cover;
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
					s.addEventListener('error',function(e){
						console.error(e);
					},false);
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
					if(library.id3===true&&id3===null){
						var httpRequest=new XMLHttpRequest();
						httpRequest.onreadystatechange=function(){
							if(httpRequest.readyState==4){
								if(httpRequest.status==200){
									if(httpRequest.responseText.length==0){
										return console.error("An undefined error occured while fetching ID3 data");
									}
									log("HTTP Request:",httpRequest.responseText);
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
	if(!msg){
		if(!!audio.style.display){
			audio.removeAttribute('style');
		}
		if(!!err.className)
			err.removeAttribute('class');
	}
	else{
		console.error(msg);
		audio.style.display='none';
		err.className="open";
		err.textContent=msg;
	}
}
function init(){
	log=log?console.log:function(){};
	log('Begin Main JavaScript File');
	var config=localStorage.getItem("HTML5_music"),
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
	offset=getId('player').offsetHeight+30;
	playlist=getId('playlist');
	playlist.appendChild(ul);
	sendEvt(window,'resize');
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
	config=config==null?base:JSON.parse(config);
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
	audio.addEventListener("error",function(){
		console.error(arguments);
	},false);
	audio.addEventListener("ended",function(){
		log('End Track:',track);
		var next=track,
			indx=setPlayed(track,true);
		if(loop.checked){
			log('Track Loop');
			audio.currentTime=0;
			return audio.play();
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
			return audio.play();
		}
		log("Next Track ID is: #",next);
		sendEvt(music[next],'click');
	},false);
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
	loop.addEventListener('click',function(){
		repeat.disabled=this.checked;
		shuffle.disabled=this.checked;
	},false);
	track=config.track>music.length-1?0:config.track;
	if(config.time==0&&track==0){
		sendEvt(audio,'ended');
	}
	else{
		sendEvt(music[track],'click');
		audio.pause();
		wait4It(function(){
			audio.currentTime=config.time;
			if(config.state===false){
				audio.play();
			}
		});
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
			case 83:shuffle.checked=!shuffle.checkedn;return;// s
			case 82:repeat.checked=!repeat.checked;return;// r
			case 76:loop.click();return;// l
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
