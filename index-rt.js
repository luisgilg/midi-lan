const defaultInMidiPort = 1;
const defaultOutMidiPort = 3;

const address = '192.168.0.4';
const defaulUTPPort = 14123;

var midi = require('midi');
var socket = require( "dgram" ).createSocket( "udp4" );
var dequeue = require('dequeue');

var input = new midi.input();
var output = new midi.output();
var fifoUdpIn = new dequeue();
var fifoUdpOut = new dequeue();

var listIn =[];
var listOut =[];

var inputCount =  input.getPortCount();
var outputCount =  output.getPortCount();

for (var i = 0; i < inputCount; i++) {
	var portName = input.getPortName(i);
	listIn.push(portName);
}

var str="MIDI Input devices found:\n\n";
str += listIn.join("\n");
console.log(str + '\n');

for (var i = 0; i < outputCount; i++) {
	var portName = output.getPortName(i);
	listOut.push(portName);
}

str="MIDI Output devices found:\n\n";
str += listOut.join("\n");
console.log(str + '\n');

input.openPort(defaultInMidiPort);
var name_in = listIn[defaultInMidiPort];
input.ignoreTypes(false, false, false);

output.openPort(defaultInMidiPort);
var name_out = listOut[defaultOutMidiPort];

socket.on(
    "message",
    function ( message, requestInfo ) {
		var buf = [];
		for(var value of message.values()){
			buf.push(value);
		}
		
		fifoUdpIn.push(buf);
		process.nextTick(fetcherUdpIn);
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

socket.bind(defaulUTPPort ,function(){
	process.nextTick(fetcherUdpIn);
	process.nextTick(fetcherUdpOut);
});

input.on('message', function(deltaTime, message) {
	fifoUdpOut.push(message);
	process.nextTick(fetcherUdpOut);	
});

if(name_in){
	console.log('Default MIDI-In port:', name_in);
} else {
	console.log('Cannot open default MIDI-In port!');
}

if(name_out){
	console.log('Default MIDI-Out port:', name_out);
}else{
	console.log('Cannot open default MIDI-Out port!');
}

function debugLog(msg){
	process.nextTick(function(){
		return console.log(msg);
	});
}

function fetcherUdpIn(){
	while(fifoUdpIn.length>0){
		var msg = fifoUdpIn.shift();
		
		output.sendMessage(msg);
		process.nextTick(fetcherUdpIn);		
		debugLog(msg);				
	}
}

function fetcherUdpOut(){
	while(fifoUdpOut.length>0){
		var msg = fifoUdpOut.shift();			
		var response = new Buffer(msg);

		socket.send(
			response,
			0,
			response.length,
			defaulUTPPort,
			address,
			log_output
		);

		process.nextTick(fetcherUdpOut);		
		debugLog(msg);				
	}
}

function log_output(error, byteLength){
  if(error){
    return console.log('error sending message'+error);
  }  
}

