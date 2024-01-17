const vorbis = document.getElementById('vorbis');
vorbis.volume = 0.5;

const btnPlay = document.getElementById('btnPlay');
btnPlay.addEventListener('click', () => {
    const className = btnPlay.getAttribute('data-toggle-class');
    const isActive = btnPlay.getAttribute('class');
    // const vorbis = document.getElementById('vorbis')
    if (!isActive) {
        btnPlay.textContent = '■'
            // SongList.update('');
        vorbis.load();
        vorbis.play();
    } else {
        btnPlay.textContent = '▶'
        vorbis.pause();
        vorbis.load();
    }
    // const target = elem.getAttribute('data-target').slice(1);
    btnPlay.classList.toggle(className);
});


function setVolume(id, value) {
    let vorbis = document.getElementById('vorbis');
    vorbis.volume = value / 100;
};



//https://github.com/wayou/HTML5_Audio_Visualizer
window.AudioContext = window.AudioContext || window.webkitAudioContext || window.mozAudioContext;

let start = function() {
    try {
        var audio = document.getElementById('vorbis');
        var ctx = new AudioContext();
        var analyser = ctx.createAnalyser();
        var audioSrc

        audioSrc = ctx.createMediaElementSource(audio);
		
		// create a gain node
		var gainNode = ctx.createGain();
		gainNode.gain.value = 2; // double the volume
		audioSrc.connect(gainNode);
		// connect the gain node to an output destination
		gainNode.connect(ctx.destination);
		
        audioSrc.connect(analyser);
        analyser.connect(ctx.destination);


        // we have to connect the MediaElementSource with the analyser 

        // we could configure the analyser: e.g. analyser.fftSize (for further infos read the spec)
        // analyser.fftSize = 64; //取樣預設是2048
        // frequencyBinCount tells you how many values you'll receive from the analyser
        var frequencyData = new Uint8Array(analyser.frequencyBinCount);

        // we're ready to receive some data!
        var canvas = document.getElementById('canvas'),
            cwidth = canvas.width,
            cheight = canvas.height - 2,
            meterWidth = 10, //width of the meters in the spectrum
            gap = 2, //gap between meters
            capHeight = 2,
            capStyle = '#fff', //頂部
            meterNum = 800 / (10 + 2), //count of the meters
            capYPositionArray = []; ////store the vertical position of hte caps for the preivous frame
        ctx = canvas.getContext('2d'),
            gradient = ctx.createLinearGradient(0, 0, 0, 300);

        gradient.addColorStop(1, '#e619e5');
        gradient.addColorStop(0.5, '#ff0');
        gradient.addColorStop(0.2, '#ff4500');
        gradient.addColorStop(0, '#f00');

        // loop
        function renderFrame() {
            var array = new Uint8Array(analyser.frequencyBinCount);
            analyser.getByteFrequencyData(array);
            var step = Math.round(array.length / meterNum); //sample limited data from the total array
            ctx.clearRect(0, 0, cwidth, cheight);
            for (var i = 0; i < meterNum; i++) {
                var value = array[i * step];
                if (capYPositionArray.length < Math.round(meterNum)) {
                    capYPositionArray.push(value);
                };
                ctx.fillStyle = capStyle;
                //draw the cap, with transition effect
                if (value < capYPositionArray[i]) {
                    ctx.fillRect(i * 12, cheight - (--capYPositionArray[i]), meterWidth, capHeight);
                } else {
                    ctx.fillRect(i * 12, cheight - value, meterWidth, capHeight);
                    capYPositionArray[i] = value;
                };
                ctx.fillStyle = gradient; //set the filllStyle to gradient for a better look
                ctx.fillRect(i * 12 /*meterWidth+gap*/ , cheight - value + capHeight, meterWidth, cheight); //the meter
            }
            requestAnimationFrame(renderFrame);
        }
        renderFrame();
        // audio.play();
    } catch (error) {

    }
};

vorbis.onplay = function() {
    start();
}


function receiveMessage(e) {
    if (e.origin !== 'http://tsuiokuyo.ddns.net:8767') {
        return false;
    } else {
        const rgb = e.data;
        // document.body.style.backgroundColor = 'rgb(' + rgb.r * 0.1 + ',' + rgb.g * 0.1 + ',' + rgb.b * 0.1 + ')';
        document.getElementById('playInfo').style.backgroundColor = 'rgba(' + rgb.r + ',' + rgb.g + ',' + rgb.b + ',0.5)';
        //  console.log(rgb)

    }
}

window.addEventListener('message', receiveMessage, false);

let OriginTitile = document.title;
let titleTime;
document.addEventListener("visibilitychange", function() {
    if (document.hidden) {
        document.title = "ლ(´•д• ̀ლ" + " - " + OriginTitile;
        clearTimeout(titleTime);
    } else {
        document.title = "( •́ _ •̀)？" + " - " + OriginTitile;
		
		ReqStatus.update('', true);
		
        titleTime = setTimeout(function() {
            document.title = OriginTitile;
        }, 3000);
    }
});