var CPComposite = function(comp){
	this.components = [];
	this.addComponent(comp);
};

CPComposite.prototype.addComponent = function(comp){
	if (Array.isArray(comp)){
		this.components = this.components.concat(comp);
	} else if (typeof comp == "object") {
		this.components.push(comp)
	}
};

CPComposite.prototype.calc = function(arg){
	var sum = 0;
	for(var c=0; c<this.components.length; c++){
		if (typeof this.components[c].calc == "function"){
			sum += this.components[c].calc(arg);
		}
	}
	return sum;
};

