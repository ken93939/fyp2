var path = require('path');
var app = require(path.resolve(__dirname, '../../server/server'));
var loopback = require('loopback');

module.exports = function(MatchedSeatUST) {

	MatchedSeatUST.removeMatched = function(data, cb){
		MatchedSeatUST.findOne({"where": {"requestId": data.requestId}}, function(err, matchedS){
			if (err){
				console.log(err);
				cb(err, null);
			} else{
				if (matchedS != null){
					var OfferQueueUST = app.models.OfferQueueUST;
					OfferQueueUST.findOne({"where": {"rideId": matchedS.rideId}}, function(err, offerQ){
						if (err){
							console.log(err);
							cb(err, null);
						} else{
							matchedS.destroy(function(err){
								if (err){
									console.log(err);
									cb(err, null);
								} else{
									if (offerQ != null){
										offerQ.updateAttributes({"is_full": false}, function(err, offer){
											if (err){
												console.log(err);
												cb(err, null);
											} else{
												console.log("MatchedSeatUST removed: ", matchedS.id);
												cb(null, matchedS);
											}
										});
									} else{
										console.log("MatchedSeatUST removed: ", matchedS.id);
										cb(null, matchedS);
									}
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

	MatchedSeatUST.remoteMethod('removeMatched', {
		http: {path: '/removeMatched', verb: 'post'},
		accepts: {arg: 'data', type: 'object', http: {source:'body'}},
		returns: {arg: 'matchedS', type: 'object'}
	});

};
