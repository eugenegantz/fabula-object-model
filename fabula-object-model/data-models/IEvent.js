"use strict";

// TODO IEvent

var IEvent = function(type) {
	if (typeof type != "string")
		throw new Error("1st argument suppose to be String");

	this.type               = type;
	this.timestamp          = Date.now();
	this.currentTarget      = null;
	this.cancelable         = false;
	this.detail             = null;
	this.eventPhase         = null;
	this.target             = null;
};

module.exports = IEvent;