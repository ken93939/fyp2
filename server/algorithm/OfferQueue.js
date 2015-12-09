function OfferQueue(offers) {
	this.queue = [];
	if (offers != null){
		this.queue = offers;
	}

	this.length = function(){
		return this.queue.length;
	}

	this.get = function(index){
		return this.queue[index];
	}

	this.enqueue = function(offer){
		this.queue.push(offer);
	}

	this.dequeue = function(){
		return this.queue.shift();
	}

	this.filter = function(type, content){
		return new OfferQueue(this.queue.filter(function(offer){
			return (offer[type] == content);
		}));
	}
};

module.exports = OfferQueue;