var path = require('path');
var app = require(path.resolve(__dirname, '../../server/server'));
var loopback = require('loopback');

module.exports = function(MatchedSeat) {

	MatchedSeat.removeMatched = function(data, cb){
		MatchedSeat.findOne({"where": {"requestId": data.requestId}}, function(err, matchedS){
			if (err){
				console.log(err);
				cb(err, null);
			} else{
				if (matchedS != null){
					var OfferQueue = app.models.OfferQueue;
					OfferQueue.findOne({"where": {"rideId": matchedS.rideId}}, function(err, offerQ){
						if (err){
							console.log(err);
							cb(err, null);
						} else{
							matchedS.destroy(function(err){
								if (err){
									console.log(err);
									cb(err, null);
								} else{
									offerQ.updateAttributes({"is_full": false}, function(err, offer){
										if (err){
											console.log(err);
											cb(err, null);
										} else{
											console.log("MatchedSeat removed: ", matchedS.id);
											cb(null, matchedS);
										}
									});
								}
							});
						}
					});
				} else{
					cb(null, matchedS);
				}
			}
		});
	}

	MatchedSeat.remoteMethod('removeMatched', {
		http: {path: '/removeMatched', verb: 'post'},
		accepts: {arg: 'data', type: 'object', http: {source:'body'}},
		returns: {arg: 'matchedS', type: 'object'}
	});

};
