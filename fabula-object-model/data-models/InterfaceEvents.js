var EventsInterface = function(){
	this._events = {};
};

EventsInterface.prototype = {

	"trigger": function(eventName, e){

		var EventConstructor = Event || CustomEvent;

		if (typeof eventName != "string") return false;

		eventName = eventName.toLowerCase();

		if (
			typeof this._events[eventName] == "object"
			&& Array.isArray(this._events[eventName])
		){

			if (
				e instanceof CustomEvent == false
				&& e instanceof Event == false
			){
				e = new EventConstructor(eventName);
			}

			var events = this._events[eventName];

			for(var c=0; c<events.length; c++){

				if (typeof events[c] != "function") continue;

				var event = events[c];

				if (events[c].isOnce){
					this._removeListener(eventName, events[c]._unique_id);
				}

				event.apply(this,[this, e]);

				event = null;

			}

		}

	},


	"on": function(eventName, fx){
		// var c, self = this;

		if (
			typeof eventName != "string"
			|| typeof fx != "function"
		) {
			return false;
		}

		eventName = eventName.toLowerCase();

		if (
			typeof this._events[eventName] != "object"
			|| !Array.isArray(this._events[eventName])
		){

			this._events[eventName] = [];

		}

		fx._unique_id = Math.round(Math.random() * Math.pow(10,18));

		if (  typeof fx.isOnce == "undefined"  ) fx.isOnce = false;

		this._events[eventName].push(fx);

		return true;

	},


	"_removeListener": function(eventName, _unique_id){
		if (typeof _unique_id == "undefined"){
			this._events[eventName] = [];
			return;
		}
		if (
			typeof this._events[eventName] == "object"
			&& Array.isArray(this._events[eventName])
		){
			var tmp = [];
			var events = this._events[eventName];
			for(var c=0; c<events.length; c++){
				if (events[c]._unique_id == _unique_id){
					continue;
				}
				tmp.push(events[c])
			}
			this._events[eventName] = tmp;
		}
	},


	"getListeners": function(eventName){
		if (typeof eventName != "string"){
			return [];
		}
		if (  typeof this._events[eventName] != "object"  ){
			return [];
		}
		return this._events[eventName];
	},


	"once": function(eventName, fx){
		if (
			typeof fx != "function"
			|| typeof eventName != "string"
		){
			return false;
		}
		fx.isOnce = true;
		this.on(eventName, fx);
		return true;
	}

};

module.exports = EventsInterface;