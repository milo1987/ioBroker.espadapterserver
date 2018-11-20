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
        adapter.log.debug('cleaned everything up...');
        callback();
    } catch (e) {
        callback();
    }
});

// is called if a subscribed object changes
adapter.on('objectChange', function (id, obj) {
    // Warning, obj can be null if it was deleted
    adapter.log.debug('objectChange ' + id + ' ' + JSON.stringify(obj));
});




// is called when databases are connected and adapter received configuration.
// start here!
adapter.on('ready', function () {
    main();
});

function main() {
	
	
	

    // The adapters config (in the instance object everything under the attribute "native") is accessible via
    // adapter.config:
    adapter.log.debug('config Port: '    + adapter.config.port);
    adapter.log.debug('config Webserver Update URL: '    + adapter.config.espupdateurl);
	adapter.log.debug('Ping Timeout Intervall: '    + adapter.config.pingtimeout);


	
	
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
		adapter.subscribeStates("*");
		
		setInterval(function() {
			
			//let zahl = adapter.getObject('').common.members;
			//adapter.log.debug("Anzahl " + zahl);
			
			
			let clients = adapter.getStatesOf(function(err, states) {
				
				
				for (var i in states) {
					
					let cl = states[i];
					
					//adapter.log.debug("Name: " + Object.keys(cl));
					if (cl.common.name.endsWith ("system.lastPing")) {
						

						
						adapter.getState(cl.common.name, function(err, state) {
							let split = cl.common.name.split(".");
							let clname = "";
						
							for (var x = 0; x < split.length-2; x++) {
								clname += split[x];
								
								if (x < split.length-3)
									clname += ".";
							}
							

							let d = new Date();
							let stamp = parseInt(state.val) + parseInt(adapter.config.pingtimeout);
							
							
							if ( stamp > d.getTime()) {
								
								adapter.log.debug("Client " + clname + " ist online, [Stamp: " + stamp + ", Time: " + d.getTime() + "]" );
								
								adapter.setState(clname + ".system.status", {val:true, ack:true});
								
								
							} else {
								adapter.log.debug("Client " + clname + " ist offline, [Stamp: " + stamp + ", Time: " + d.getTime() + "]" );
								adapter.setState(clname + ".system.status", {val:false, ack:true});
							}
						});
						
						
					}
					
					
				}
				
			
				 
				 		
				
			});
			
			

		}.bind(this), adapter.config.pingtimeout);
		
		
		
		
		console.log("ESP Socket Server running");
	}
	
	_initSocketIO() {
		this._io = socketIo(this._port, {
		  pingInterval: 10000,
		  pingTimeout: 10000,
		  cookie: false
		});
	
		
		
		
		
		
		// Bei Änderungen von Variabeln ausführen
		adapter.on('stateChange', function (id, state) {
    
		//adapter.log.debug("ID:" + id);
		//adapter.log.debug("ACK: " + state.ack);
	
			if (state != null && !state.ack) {
				
				adapter.log.debug("ID:" + id);
				let parts = id.split(".");
				let name = "";
				let varname = "";
				
				let isName = true;
				
				for (var x = 2; x < parts.length; x++) {
					let str = parts[x];
					
					if (isName) {
						
		
						if (parts[x+1] == "system" || parts[x+1] == "vars") {
							isName = false;
							name += str;
						} else
							name += str + ".";
					

					} else {
						
						if (str != "vars" && str != "system") {
							varname += str;
							
							if (x < parts.length - 1) {
						    varname += ".";
							}
						}
						
						
						
						
					}
						

				}
				
				

				adapter.log.debug("Parts Name: " + name);
				adapter.log.debug("Parts Varname: " + varname);
				
				if (parts[parts.length-1] === "webupdate") {
					
					if (state.val) {
					
						this._io.sockets.in(name).emit('webUpdate', adapter.config.espupdateurl);
						
						adapter.log.debug('Clientwebupdate: ' + name + ': ' + adapter.config.espupdateurl);
						//adapter.setState(id, false);
					
					}
					
				} else if (parts[parts.length-1] === "debug") {
				
					this._io.sockets.in(name).emit('debug', state.val);	
					adapter.log.debug('Debuglevel für: ' + name + ' aktiviert');
				
				} else if (parts[parts.length-1] === "reset") {
					if(state.val == true) {
						this._io.sockets.in(name).emit('reset', state.val);	
						adapter.log.debug('Resetbefehl gesendet für: ' + name + ' aktiviert');
						adapter.setState(varname + ".reset" , {val:false, ack:true});
					}
					
				} else if (parts[parts.length-1] === "gruppenname") {
					
					let s = state.val.split(":");
					
					if (s[0] != "" && s[1] != "") {
						
						this._io.sockets.in(name).emit('setGrpname', s[0] + ":" + s[1]);
						
						
					} else
						adapter.log.error("Fehler beim setzen der Gruppenvariabeln. Bitte format Gruppe:Name benutzen");
					
					
					
					
				} else {
				
				adapter.log.debug("Varänderung: " + varname);
					this._io.sockets.in(name).emit('command', varname + "~" + state.val);
					
					adapter.log.debug('Variabeländerung gesendet an ' + name + varname + ': ' + state.val);
			
			
				}
			
			
			
			}
			
		}.bind(this));
		
		
		
		
		
		
		
		
		
		
		
		// Bei Verbindung eines neuen Clients ausführen
		
		this._io.on('connection', socket => {
			//socket.ip = '';
			socket.name = '';
				
			
			
			socket.on('init', msg => {
				
				

				let parts =  msg.split("!*!");
				
				
				socket.name = parts[0];
				socket.version = parts[1];
				socket.ip = parts[2];
				socket.apiversion = parts[3];
				socket.grpchip = parts[4];
				socket.resetcounter = parts[5];
				
				socket.join(socket.name);
				
				
				let varname = socket.name + ".system";
				
				adapter.log.debug("Client Init: " + varname);
				
				
				if (varname != "") {
				
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

					
					// Letzter Sendestatus
					
					adapter.setObjectNotExists(varname + ".lastPing", {
							type: 'state',
							common: {
								name: varname + ".lastPing",
								type: 'mixed',
								role: 'indicator',
								ack:  'true'
							},
							native: {}
						});
						
					
					adapter.setState(varname + ".lastPing" , {val:new Date().getTime(), ack:true});
					
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
					
					// RESET Funktion
					
					adapter.setObjectNotExists(varname + ".reset", {
							type: 'state',
							common: {
								name: varname + ".reset",
								type: 'boolean',
								role: 'indicator',
								ack:  'true'
							},
							native: {}
						});
						
					adapter.setState(varname + ".reset" , {val:false, ack:true});	
					
					
					// Webupdate einfügen

					adapter.setObjectNotExists(varname + ".webupdate", {
							type: 'state',
							common: {
								name: varname + ".webupdate",
								type: 'boolean',
								role: 'indicator',
								ack:  'true'
							},
							native: {}
						});
							

					
					adapter.getState(varname + ".webupdate", function(err, state) {
					
						try {
							//adapter.log.info("ChWeb: " + state.val);
							if (state.val) {
								socket.emit('webUpdate', adapter.config.espupdateurl);
								
								adapter.log.info('Nach Reconnect: Clientwebupdate: ' + socket.name + ': ' + adapter.config.espupdateurl);
							}
							
						} catch (err) {
							adapter.log.error("Fehler beim Setzen des WebUpdate, Client: " + socket.name + ", Fehler: " + err);
						}
						
					});
									

					// Gruppenfunktionen aktivieren
					
					if (socket.grpchip == 1) {
						
						adapter.setObjectNotExists(varname + ".grp_function.gruppenname", {
							type: 'state',
							common: {
								name: varname + ".grp_function.gruppenname",
								type: 'mixed',
								role: 'indicator',
								ack:  'true'
							},
							native: {}
						});
						
						
						let vsplit = varname.split(".");
						adapter.setState(varname + ".grp_function.gruppenname", {val:vsplit[0] + ":" + vsplit[1], ack:true});
						
						
					}
					
					// Timeout Reset-Counter setzen:
					
					adapter.setObjectNotExists(varname + ".resetcounter", {
						type: 'state',
						common: {
							name: varname + ".resetcounter",
							type: 'mixed',
							role: 'indicator',
							ack:  'true'
						},
						native: {}
					});
						

					adapter.setState(varname + ".resetcounter", {val:socket.resetcounter, ack:true});
						
						
					
					
					
				}
				
				// Sende Uhrzeit				
				let zeit = new Date();
				socket.emit('timeSync', (zeit.getTime() / 1000 |0) + "#" + zeit.getTimezoneOffset() );
				
				
				// Loglevel
				
				adapter.setState(varname + ".loglevel" , {val:1, ack:true});
				
				
				
				
				adapter.log.debug("ClientInit: " + socket.name + " " + socket.version + " " + socket.ip + " " + socket.grpchip);
				
				
				
				
			});
			
			
			// PING FUNKTIONEN
			
			socket.on ('ping', msg => {
				adapter.setState(socket.name + ".system.lastPing", {val:new Date().getTime(), ack:true});	
				socket.emit('ping', "ping" );
			});

			
			// Variabeln INIT //
			
			
			socket.on ('initVars', msg => {
				
				let parts =  msg.split("!*!");
				let varname = socket.name + ".vars." + parts[0];
				
				if (varname != "") {
				
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
					
				}
				
					adapter.log.debug("Neue Variable angelegt: " + varname + " mit Wert: " + parts[1]);
					
				
				
				
			});

			
			socket.on('command', msg => { 
			
				let parts =  msg.split("~");
				let varname = socket.name + "." + "vars." + parts[0];
				//let varname = socket.name + "." + "vars.*";
				let wert = parts[1];
			
			
				adapter.log.debug("Variabel " + varname + ": " + wert); 
				adapter.setState(varname,  {val:wert, ack:true});
				
				adapter.setState(socket.name + ".system.lastPing", {val:new Date().getTime(), ack:true});
			
			
			});
			
			
			socket.on('logdebug', msg => { 
				adapter.log.info("Log-Debug " + socket.name + ": " + msg);
			});
			
			socket.on('logerror', msg => { 
				adapter.log.error("Log-Error " + socket.name + ": " + msg);
			});
			
			socket.on('webUpdate', msg => { 
				adapter.setState(socket.name + ".system.webupdate", false);
				adapter.log.info("Webupdate für " + socket.name + " wurde durchgeführt");
			});
			
			
			
			
			});
		
	}
	
	
}





