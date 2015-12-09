function RequestQueue(requests) {
	this.queue = [];
	if (requests != null){
		this.queue = requests;
	}

	this.length = function(){
		return this.queue.length;
	}

	this.get = function(index){
		return this.queue[index];
	}

	this.enqueue = function(request){
		this.queue.push(request);
	}

	this.dequeue = function(){
		return this.queue.shift();
	}

	this.filter = function(type, content){
		return new RequestQueue(this.queue.filter(function(request){
			return (request[type] == content);
		}));
	}

};

module.exports = RequestQueue;