/**
 *
 * template adapter
 *
 *
 *  file io-package.json comments:
 *
 *  {
 *      "common": {
 *          "name":         "espadapterserver",                  // name has to be set and has to be equal to adapters folder name and main file name excluding extension
 *          "version":      "0.0.0",                    		// use "Semantic Versioning"! see http://semver.org/
 *          "title":        "Node.js ESP Adapter Server", 		 // Adapter title shown in User Interfaces
 *          "authors":  [                               		// Array of authord
 *              "M. Lanfermann <admin@milanworld.de>"
 *          ]
 *          "desc":         "ESP Adapter Server",         		 // Adapter description shown in User Interfaces. Can be a language object {de:"...",ru:"..."} or a string
 *          "platform":     "Javascript/Node.js",       		// possible values "javascript", "javascript/Node.js" - more coming
 *          "mode":         "daemon",                   		// possible values "daemon", "schedule", "subscribe"
 *          "materialize":  true,                       		// support of admin3
 *          "schedule":     "0 0 * * *"                 		// cron-style schedule. Only needed if mode=schedule
 *          "loglevel":     "info"                      		// Adapters Log Level
 *      },
 *      "native": {                                     		// the native object is available via adapter.config in your adapters code - use it for configuration
 *          "test1": true,
 *          "test2": 42,
 *          "mySelect": "auto"
 *      }
 *  }
 *
 */

/* jshint -W097 */// jshint strict:false
/*jslint node: true */
'use strict';

// you have to require the utils module and call adapter function
const utils =    require(__dirname + '/lib/utils'); // Get common adapter utils

// you have to call the adapter function and pass a options object
// name has to be set and has to be equal to adapters folder name and main file name excluding extension
// adapter will be restarted automatically every time as the configuration changed, e.g system.adapter.template.0
const adapter = new utils.Adapter('espadapterserver');

/*Variable declaration, since ES6 there are let to declare variables. Let has a more clearer definition where 
it is available then var.The variable is available inside a block and it's childs, but not outside. 
You can define the same variable name inside a child without produce a conflict with the variable of the parent block.*/
let variable = 1234;

// is called when adapter shuts down - callback has to be called under any circumstances!
adapter.on('unload', function (callback) {
    try {
        adapter.log.info('cleaned everything up...');
        callback();
    } catch (e) {
        callback();
    }
});

// is called if a subscribed object changes
adapter.on('objectChange', function (id, obj) {
    // Warning, obj can be null if it was deleted
    adapter.log.info('objectChange ' + id + ' ' + JSON.stringify(obj));
});




// is called when databases are connected and adapter received configuration.
// start here!
adapter.on('ready', function () {
    main();
});

function main() {
	
	
	

    // The adapters config (in the instance object everything under the attribute "native") is accessible via
    // adapter.config:
    adapter.log.info('config Port: '    + adapter.config.port);
    adapter.log.info('config Webserver Update URL: '    + adapter.config.espupdateurl);



	
	
	const espserver = new ESPSocketServer(adapter.config.port);
	espserver.start();
	
    
	 
    



}


const socketIo = require('socket.io');


class ESPSocketServer {
	constructor(port) {
		this._port = port;
	}
	
	start () {
		this._initSocketIO();
		
		
		
		
		
		
		
		console.log("ESP Socket Server running");
	}
	
	_initSocketIO() {
		this._io = socketIo(this._port, {
		  pingInterval: 10000,
		  pingTimeout: 1000,
		  cookie: false
		});
	
		
		
		
		
		
		// Bei Änderungen von Variabeln ausführen
		adapter.on('stateChange', function (id, state) {
    
			if (state != null) {
				
				
				let parts = id.split(".");
				let name = parts[2];
				
				let varname = parts[4];
				//adapter.log.info("Parts: " + parts[parts.length-1]);
				
				if (parts[parts.length-1] === "webupdate") {
					
					if (state.val) {
					
						this._io.sockets.in(name).emit('webUpdate', adapter.config.espupdateurl);
						
						adapter.log.info('Clientwebupdate: ' + name + ': ' + adapter.config.espupdateurl);
						adapter.setState(id, false);
					
					}
					
				} else if (parts[parts.length-1] === "debug") {
				
					this._io.sockets.in(name).emit('debug', state.val);	
					adapter.log.debug('Debuglevel für: ' + name + ' aktiviert');
				
				} else {
				

					this._io.sockets.in(name).emit('command', varname + "~" + state.val);
					
					adapter.log.debug('Variabeländerung gesendet an ' + name + ': ' + state.val);
			
			
				}
			
			
			
			}
			
		}.bind(this));
		
		
		
		
		
		
		
		
		
		
		
		// Bei Verbindung eines neuen Clients ausführen
		
		this._io.on('connection', socket => {
			//socket.ip = '';
			socket.name = '';
			let subscribers = [];
			
			
			
			
			
			socket.on('init', msg => {
				
				

				let parts =  msg.split("!*!");
				
				
				socket.name = parts[0];
				socket.version = parts[1];
				socket.ip = parts[2];
				socket.apiversion = parts[3];
				
				socket.join(socket.name);
				
				
				let varname = socket.name + ".system";
				
				
				
				
				
				// Clientname für die Onlinetabelle anlegen
				
				adapter.setObjectNotExists(varname + ".status", {
						type: 'state',
						common: {
							name: varname + ".status",
							type: 'boolean',
							role: 'indicator',
							ack:  'true'
						},
						native: {}
					});
					
				adapter.setState(varname + ".status" , {val:true, ack:true});	
				
				
				// Version
				
				adapter.setObjectNotExists(varname + ".version", {
						type: 'state',
						common: {
							name: varname + ".version",
							type: 'mixed',
							role: 'indicator',
							ack:  'true'
						},
						native: {}
					});
					
				adapter.setState(varname + ".version" , {val:socket.version, ack:true});	
				
				// API - Version
				
				adapter.setObjectNotExists(varname + ".apiversion", {
						type: 'state',
						common: {
							name: varname + ".apiversion",
							type: 'mixed',
							role: 'indicator',
							ack:  'true'
						},
						native: {}
					});
					
				adapter.setState(varname + ".apiversion" , {val:socket.apiversion, ack:true});	
				
				// IP Adresse
				
				adapter.setObjectNotExists(varname + ".ip", {
						type: 'state',
						common: {
							name: varname + ".ip",
							type: 'mixed',
							role: 'indicator',
							ack:  'true'
						},
						native: {}
					});
					
				adapter.setState(varname + ".ip" , {val:socket.ip, ack:true});
				
				
				
				// DEBUG Level
				
				adapter.setObjectNotExists(varname + ".debug", {
						type: 'state',
						common: {
							name: varname + ".debug",
							type: 'boolean',
							role: 'indicator',
							ack:  'true'
						},
						native: {}
					});
					
				adapter.setState(varname + ".debug" , {val:false, ack:true});	
				adapter.subscribeStates(varname + ".debug");
				
				// Webupdate einfügen
				
				varname = varname + ".webupdate";

				adapter.setObjectNotExists(varname, {
						type: 'state',
						common: {
							name: varname,
							type: 'boolean',
							role: 'indicator',
							ack:  'true'
						},
						native: {}
					});
						
				adapter.setState(varname, {val:false, ack:true});	
				adapter.subscribeStates(varname);
				

				// Ende Webupdate
				
				
				// Sende Uhrzeit				
				let zeit = new Date();
				socket.emit('timeSync', (zeit.getTime() / 1000 |0) + "#" + zeit.getTimezoneOffset() );
				
				
				// Loglevel
				
				adapter.setState(varname + ".loglevel" , {val:1, ack:true});
				
				
				
				adapter.log.info("ClientInit: " + socket.name + " " + socket.version + " " + socket.ip);
				
			});
			
			socket.on ('initVars', msg => {
				
				let parts =  msg.split("!*!");
				let varname = socket.name + ".vars." + parts[0];
				
				
				if (parts[1] == "true" || parts[1] == "false") {
					
					adapter.setObjectNotExists(varname, {
						type: 'state',
						common: {
							name: varname,
							type: 'boolean',
							role: 'indicator',
							ack:  'true'
						},
						native: {}
					});
					
				} else {
					
					adapter.setObjectNotExists(varname, {
						type: 'state',
						common: {
							name: varname,
							type: 'mixed',
							role: 'indicator',
							ack:  'true'
						},
						native: {}
					});
					
				}
					
					adapter.setState(varname,  {val:parts[1], ack:true});
					
					adapter.subscribeStates(varname);
					subscribers.push(varname);
					adapter.log.info("Neue Variable angelegt: " + varname + " mit Wert: " + parts[1]);
					
				
				
				
			});

			socket.on ('disconnect', msg => {
				
				
					
					if (!socket.connected) {
					
						
						adapter.setState(socket.name + ".system.status", {val:false, ack:true});
						
						for (var x=0; x<subscribers.length; x++) {
							
							adapter.unsubscribeStates(subscribers[x]);
							
						}
					
						adapter.unsubscribeStates(socket.name + ".system.webupdate");
						adapter.unsubscribeStates(socket.name + ".system.debug");
						adapter.log.info("Client " + socket.name + " disconnected");
						
						socket.disconnect(true);
						
					} else 
						adapter.log.info ("Client disconnected, obwohl noch online");
					
					
			
				
			});

			
			socket.on('command', msg => { 
			
				let parts =  msg.split("~");
				let varname = socket.name + "." + "vars." + parts[0];
				let wert = parts[1];
			
				adapter.unsubscribeStates(varname);
				adapter.log.info("Variabel " + varname + ": " + wert); 
				adapter.setState(varname,  {val:wert, ack:true});
				adapter.subscribeStates(varname);
				
			
			
			});
			
			
			socket.on('logdebug', msg => { 
				adapter.log.info("Log-Debug " + socket.name + ": " + msg);
			});
			
			socket.on('logerror', msg => { 
				adapter.log.error("Log-Error " + socket.name + ": " + msg);
			});
			
			
			
			
			adapter.log.info("Client " + socket.name + " erfolgreich verbunden");
			
			});
		
	}
	
	
}





