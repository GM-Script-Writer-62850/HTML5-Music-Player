This is a basic HTML5 music player<br/>
This was made to be a simple music player with all the basic features a music player should have as well as have a mobile friendly layout<br/>

Features:<br/>
Loop: Play the current track over and over again.<br/>
Shuffle: Play tracks at random instead of in order.<br/>
Repeat: Allow tracks to repeat (When un-checked every track much be played once before it can be played again; saved between sessions; Played tracks are marked as &#x2714; in the playlist)<br/>
Next/Back: This feature now uses a play history log, this is not saved between sessions (max length is the size of your playlist)<br/>
Note: Clicking on a track after using the back feature will bump your historic playback to the present, for example say you hit back 5 times<sup>(history at -5)</sup> and you click a track, your history will be bumped back up to the present<sup>(history at 0)</sup><br/>
Note: Changing the number of tracks in the playlist will reset session data<br/>
Note: Tracks will not mark a track as played unless it is at least 15% complete<br/>
Note: ID3 (meta data from audio files) data is not displayed on very low screen widths (tiny smart phone)<br/>
Note: Playback can be restricted to a single folder by double clicking it

Overview:<br/>
<img src="https://raw.githubusercontent.com/GM-Script-Writer-62850/HTML5-Music-Player/master/overview.png"/>

Keyboard shortcuts:<br/>
<pre>
pause          - Spacebar
volume up      - Plus on the number keypad
volume down    - Minus on the number keypad
next song      - Left arrow key
previous song  - Right arrow key
skip 5s        - Up arrow key
rewind 5s      - Down arrow key
toggle shuffle - S key
toggle repeat  - R key
toggle loop    - L key</pre>

Setup:<br/>
1. Add the index.html, player.js, player.css, and playlist.php files to a folder on your web server<br/>
2. Create a folder called library in that folder, this folder should contain your music<br/>
this folder can be a symlink to your main music folder<br/>
3. If you would like to have have ID3 support look in playlist.php for the notes (it is a optional feature)

Any files/folders starting with a "." will be ignored in addition to ".txt" files<br/>
Cover images should be named cover (not case sensitive), they should be in png, jpg/jpeg, or gif format, basically anything a web browser can display<br/>
Cover images are optional<br/>
Any file not called cover will be treated as a audio file<br/>
All files should have a file extension (eg .png, .mp3, .ogg, etc)<br/>
This uses 5 icons from the apache web server, if you are using a different web service, grab these icons and save them as the following:<br/>
<a href="http://www.apache.org/icons/open.folder.png" target="_blank">/icons/open.folder.png</a><br/>
<a href="http://www.apache.org/icons/folder.png" target="_blank">/icons/folder.png</a><br/>
<a href="http://www.apache.org/icons/sound2.png" target="_blank">/icons/sound2.png</a><br/>
<a href="http://www.apache.org/icons/small/back.png" target="_blank">/icons/small/back.png</a>
<a href="http://www.apache.org/icons/down.png" target="_blank">/icons/down.png</a>
