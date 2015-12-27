var path = require('path');
var app = require(path.resolve(__dirname, '../../server/server'));
var loopback = require('loopback');

module.exports = function(OfferQueue) {

	OfferQueue.possibleOffer = function(requestQ, cb){
		OfferQueue.findOne({"where": {"destination_name": requestQ.destination_name}}, function(err, offerQ){
			if (err){
				console.log(err);
				cb(err, null);
			} else{
				var PendingSeat = app.models.PendingSeat;
				var data = {};
				data.rideId = offerQ.rideId;
				data.requestId = requestQ.requestId;
				PendingSeat.create(data, function(err, pendingS){
					cb(null, offerQ);
				});
			}
		});
	}

	OfferQueue.remoteMethod('possibleOffer', {
		http: {path: '/possibleOffer', verb: 'post'},
		accepts: {arg: 'request', type: 'object', http: {source:'body'}},
		returns: {arg: 'offer', type: 'object'}
	});

};
