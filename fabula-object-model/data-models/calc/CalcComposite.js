/**
 * @constructor
 * @param {Object | Array} comp
 * @param {Object} arg
 * */
var CPComposite = function(comp, arg){
	this.components = [];
	this.arguments = arg;
	this.addComponent(comp);
};

CPComposite.prototype.addComponent = function(comp){
	if (Array.isArray(comp)){
		this.components = this.components.concat(comp);

	} else if (typeof comp == "object") {
		this.components.push(comp);

	}
};

CPComposite.prototype.setArgument = function(arg){
	this.arguments = arg;
};

CPComposite.prototype.getArgument = function(){
	return this.arguments;
};

CPComposite.prototype.setArg = CPComposite.prototype.setArgument;

CPComposite.prototype.getArg = CPComposite.prototype.getArgument;

CPComposite.prototype.calc = function(arg){
	var sum = 0, tmp;
	var _arg = arg || this.getArg();
	for(var c=0; c<this.components.length; c++){
		if (typeof this.components[c].calc == "function"){
			tmp = this.components[c].calc(_arg);
			if (tmp instanceof Error){
				return tmp;
			}
			sum += tmp;
		}
	}
	return sum;
};

CPComposite.compCalc =CPComposite.prototype.calc;

module.exports = CPComposite;

