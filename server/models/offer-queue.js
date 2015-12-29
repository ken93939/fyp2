var path = require('path');
var app = require(path.resolve(__dirname, '../../server/server'));
var loopback = require('loopback');

module.exports = function(OfferQueue) {

	OfferQueue.possibleOffer = function(requestQ, cb){
		var offerQFilter = {
			"where": {
				"destination_name": requestQ.destination_name,
				"is_full": false,
				"time": {"gt": Date.now()}
			}, 
			"order": "time ASC"
		};
		OfferQueue.findOne(offerQFilter, function(err, offerQ){
			if (err){
				console.log(err);
				cb(err, null);
			} else{
				if (offerQ != null){
					var PendingSeat = app.models.PendingSeat;
					var data = {};
					data.rideId = offerQ.rideId;
					data.requestId = requestQ.requestId;
					PendingSeat.addPending(data, function(err, pendingS){
						if (err){
							console.log(err);
							cb(err, null);
						} else{
							cb(null, offerQ);
						}
					});
				} else{
					cb(null, offerQ);
				}
			}
		});
	}

	OfferQueue.remoteMethod('possibleOffer', {
		http: {path: '/possibleOffer', verb: 'post'},
		accepts: {arg: 'request', type: 'object', http: {source:'body'}},
		returns: {arg: 'offer', type: 'object'}
	});

};
