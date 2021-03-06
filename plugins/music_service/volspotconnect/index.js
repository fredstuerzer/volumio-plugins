'use strict';

var libQ = require('kew');
var libNet = require('net');
var libFast = require('fast.js');
var fs=require('fs-extra');
var config = new (require('v-conf'))();
var exec = require('child_process').exec;
var nodetools = require('nodetools');

// Define the ControllerVolspotconnect class
module.exports = ControllerVolspotconnect;
function ControllerVolspotconnect(context) {
	// This fixed variable will let us refer to 'this' object at deeper scopes
	var self = this;

	this.context = context;
	this.commandRouter = this.context.coreCommand;
	this.logger = this.context.logger;
	this.configManager = this.context.configManager;

}



ControllerVolspotconnect.prototype.onVolumioStart = function()
{
    var configFile=this.commandRouter.pluginManager.getConfigurationFile(this.context,'config.json');
    this.config = new (require('v-conf'))();
    this.config.loadFile(configFile);

}

ControllerVolspotconnect.prototype.getConfigurationFiles = function()
{
	return ['config.json'];
}


// Plugin methods -----------------------------------------------------------------------------

ControllerVolspotconnect.prototype.startVolspotconnectDaemon = function() {
	var self = this;

    var defer=libQ.defer();

	exec("/data/plugins/music_service/volspotconnect/spotify-connect-web/startconnect.sh", {uid:1000,gid:1000}, function (error, stdout, stderr) {
		if (error !== null) {
			self.commandRouter.pushConsoleMessage('The following error occurred while starting VOLSPOTCONNECT: ' + error);
            defer.reject();
		}
		else {
			self.commandRouter.pushConsoleMessage('Volspotconnect Daemon Started');
            defer.resolve();
		}
	});

    return defer.promise;
};


ControllerVolspotconnect.prototype.onStop = function() {
	var self = this;

    self.logger.info("Killing Spotify-connect-web daemon");
	exec("killall avahi-publish-service", function (error, stdout, stderr) { 

	});

    return libQ.defer();
};

ControllerVolspotconnect.prototype.onStart = function() {
    var self = this;

    var defer=libQ.defer();

  self.startVolspotconnectDaemon()
        .then(function(e)
        {
            setTimeout(function () {
                self.logger.info("Connecting to daemon");
                self.volspotconnectDaemonConnect(defer);
            }, 5000);
        })
        .fail(function(e)
        {
            defer.reject(new Error());
        });

	this.commandRouter.sharedVars.registerCallback('alsa.outputdevice', this.rebuildVOLSPOTCONNECTAndRestartDaemon.bind(this));

    return defer.promise;
};

// Volspotconnect stop
ControllerVolspotconnect.prototype.stop = function() {
	var self = this;
	self.commandRouter.pushConsoleMessage('[' + Date.now() + '] ' + 'ControllerVolspotconnect::stop');

	return self.sendVolspotconnectCommand('stop', []);
};

ControllerVolspotconnect.prototype.onRestart = function() {
	var self = this;
	//
};

ControllerVolspotconnect.prototype.onInstall = function() {
	var self = this;
	//Perform your installation tasks here
};

ControllerVolspotconnect.prototype.onUninstall = function() {
	var self = this;
	//Perform your installation tasks here
};

ControllerVolspotconnect.prototype.getUIConfig = function() {
	var defer = libQ.defer();
	var self = this;
	var rate;
                if(self.config.get('bitrate')===true)
                    rate="320";
		else rate="128"

	var lang_code = this.commandRouter.sharedVars.get('language_code');

        self.commandRouter.i18nJson(__dirname+'/i18n/strings_'+lang_code+'.json',
                __dirname+'/i18n/strings_en.json',
                __dirname + '/UIConfig.json')
        .then(function(uiconf)
        {

uiconf.sections[0].content[0].value = self.config.get('username');
uiconf.sections[0].content[1].value = self.config.get('password');
uiconf.sections[0].content[2].value = self.config.get('bitrate');
uiconf.sections[0].content[3].value = self.config.get('devicename');
            defer.resolve(uiconf);
            })
                .fail(function()
            {
                defer.reject(new Error());
        });

        return defer.promise;
};

ControllerVolspotconnect.prototype.setUIConfig = function(data) {
	var self = this;
	//Perform your installation tasks here
};

ControllerVolspotconnect.prototype.getConf = function(varName) {
	var self = this;
	//Perform your installation tasks here
};

ControllerVolspotconnect.prototype.setConf = function(varName, varValue) {
	var self = this;
	//Perform your installation tasks here
};

// Public Methods ---------------------------------------------------------------------------------------
// These are 'this' aware, and return a promise



// Rebuild a library of user's playlisted Spotify tracks


// Define a method to clear, add, and play an array of tracks


// Internal methods ---------------------------------------------------------------------------
// These are 'this' aware, and may or may not return a promise



// Volspotconnect get state
ControllerVolspotconnect.prototype.getState = function() {
	var self = this;
	self.commandRouter.pushConsoleMessage('[' + Date.now() + '] ' + 'ControllerVolspotconnect::getState');

	return self.sendVolspotconnectCommand('status', []);
};


// Announce updated Volspotconnect state




ControllerVolspotconnect.prototype.logDone = function(timeStart) {
	var self = this;
	self.commandRouter.pushConsoleMessage('[' + Date.now() + '] ' + '------------------------------ ' + (Date.now() - timeStart) + 'ms');
	return libQ.resolve();
};

ControllerVolspotconnect.prototype.logStart = function(sCommand) {
	var self = this;
	self.commandRouter.pushConsoleMessage('\n' + '[' + Date.now() + '] ' + '---------------------------- ' + sCommand);
	return libQ.resolve();
};



ControllerVolspotconnect.prototype.createVOLSPOTCONNECTFile = function () {
    var self = this;

    var defer=libQ.defer();


    try {

        fs.readFile(__dirname + "/volspotconnect.tmpl", 'utf8', function (err, data) {
            if (err) {
                defer.reject(new Error(err));
                return console.log(err);
            }
			var rate;
                if(self.config.get('bitrate')===true)
                    rate="320";
		else rate="128"
			var outdev = self.commandRouter.sharedVars.get('alsa.outputdevice');
			var mixer = self.commandRouter.sharedVars.get('alsa.outputdevicemixer');
			var hwdev = 'hw:' + outdev;
			var  bitrate = self.config.get('bitrate');
			var bitratevalue = 'true';
			if (bitrate == false ) {
				bitratevalue = 'false';
			}

		var conf1 = data.replace("${username}", self.config.get('username'));
		var conf2 = conf1.replace("${password}", self.config.get('password'));
		var conf3 = conf2.replace("${rate}", rate);
		var conf4 = conf3.replace("${devicename}", self.config.get('devicename'));
		var conf5 = conf4.replace("${outdev}", hwdev);
		var conf6 = conf5.replace("${mixer}", mixer);
		var conf7 = conf6.replace("${mixind}", outdev);
		var conf8 = conf7.replace("${devicename}", self.config.get('devicename'));

	            fs.writeFile("/data/plugins/music_service/volspotconnect/spotify-connect-web/startconnect.sh", conf8, 'utf8', function (err) {
                if (err)
                    defer.reject(new Error(err));
                else defer.resolve();
            });


        });


    }
    catch (err) {


    }

    return defer.promise;

};

ControllerVolspotconnect.prototype.saveVolspotconnectAccount = function (data) {
    var self = this;

    var defer = libQ.defer();

    self.config.set('username', data['username']);
    self.config.set('password', data['password']);
   self.config.set('bitrate', data['bitrate']);
    self.config.set('devicename', data['devicename']);

    self.rebuildVOLSPOTCONNECTAndRestartDaemon()
        .then(function(e){
            self.commandRouter.pushToastMessage('success', "Configuration update", 'The configuration has been successfully updated');
            defer.resolve({});
        })
        .fail(function(e)
        {
            defer.reject(new Error());
        })


    return defer.promise;

};


ControllerVolspotconnect.prototype.rebuildVOLSPOTCONNECTAndRestartDaemon = function () {
    var self=this;
    var defer=libQ.defer();

    self.createVOLSPOTCONNECTFile()
        .then(function(e)
        {
            var edefer=libQ.defer();
            exec("killall avahi-publish-service", function (error, stdout, stderr) { //not done in a elegant way
                edefer.resolve();
            });
            return edefer.promise;
        })
        .then(self.startVolspotconnectDaemon.bind(self))
        .then(function(e)
        {
            setTimeout(function () {
                self.logger.info("Connecting to daemon");
                self.volspotconnectDaemonConnect(defer);
            }, 5000);
        });

    return defer.promise;
}

