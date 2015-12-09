var gb = require('../boot/gb.js');

module.exports = {

	printGb: function(){
		console.log(gb);
	},

	addOffer: function(offer, callback){
		gb.offerQueue.enqueue(offer);
		console.log("addOffer");
		console.log(offer);
		callback(null, offer);
	},

	checkPossibleOffer: function(request, callback){
		gb.requestQueue.enqueue(request);
		console.log(gb.requestQueue);
		// return possible offer
		// ...
		var desList = gb.offerQueue.filter("destination_name", request.destination_name);

		var offer = desList.dequeue();
		// console.log(offer);
		callback(null, offer);
	}

};