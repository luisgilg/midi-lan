const defaultInMidiPort = 2;
const defaultOutMidiPort = 4;

const address = '192.168.0.4';
const defaulUTPPort = 14123;

var jazz = require('jazz-midi');
var socket = require( "dgram" ).createSocket( "udp4" );
var dequeue = require('dequeue');

var midi = new jazz.MIDI();
var fifo = new dequeue();

var list = midi.MidiInList();
var str="MIDI Input devices found:\n\n";
str += list.join("\n");
console.log(str + '\n');

list = midi.MidiOutList();
str="MIDI Output devices found:\n\n";
str += list.join("\n");
console.log(str + '\n');

var name_in = midi.MidiInOpen(defaultInMidiPort);
var name_out = midi.MidiOutOpen(defaultOutMidiPort);

function debugLog(msg){
	return console.log(msg);
}

function fetcher(){
	while(fifo.length>0){
		var msg = fifo.shift();
		midi.MidiOutLong(msg);
		process.nextTick(fetcher);		
		debugLog(msg);				
	}
}

function log_output(error, byteLength){
  if(error){
    return console.log('error sending message'+error);
  }
  debugLog(byteLength + 'bytes sent');
}

socket.on(
    "message",
    function ( message, requestInfo ) {
		var buf = [];
		for(var value of message.values()){
			buf.push(value);
		}
		
		fifo.push(buf);
		process.nextTick(fetcher);
		debugLog(buf + " from " +  requestInfo.address + ":" + requestInfo.port );
    }
);

socket.on(
    "error",
    function ( error ) {
        socket.close();
    }
);

socket.on(
    "listening",
    function () {
        console.log( "socket listening " + address + ":" + defaulUTPPort );
    }
);

socket.bind( defaulUTPPort ,function(){
	process.nextTick(fetcher);
});

if(name_in){
  console.log('Default MIDI-In port:', name_in);
  
  setInterval(function(){
	 while(arr=midi.QueryMidiIn()){
		 var msg=arr.slice(1,arr.length);
		 if	(!address) return;
			var response = new Buffer(msg);
			
			socket.send(
				response,
				0,
				response.length,
				defaulUTPPort,
				address,
				log_output
			);
			debugLog( msg + " to " + address + ":" + defaulUTPPort );
	 }
  },0);
} else {
	console.log('Cannot open default MIDI-In port!');
}

if(name_out){
	console.log('Default MIDI-Out port:', name_out);
}else{
	console.log('Cannot open default MIDI-Out port!');
}
