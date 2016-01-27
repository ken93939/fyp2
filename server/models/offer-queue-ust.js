var path = require('path');
var app = require(path.resolve(__dirname, '../../server/server'));
var loopback = require('loopback');

module.exports = function(OfferQueueUST) {

	OfferQueueUST.possibleOffer = function(requestQ, cb){
		requestQ.member(function(err, mem){
			if (err){
				console.log(err);
				cb(err, null);
			} else{
				var offerQFilter = {
					"where": {
						"and": [
							{"pickup_name": requestQ.pickup_name},
							{"is_full": false},
							{"time": {"gt": Date.now() + 60*1000}},
							{"or": [
								{"and": [
									{"gender_preference": true}, 
									{"member_gender": mem.gender}
								]},
								{"gender_preference": false}
							]}
						]
					}, 
					"order": "time ASC"
				};
				requestQ.member(function(err, mem){
					if (err){
						console.log(err);
						cb(err, null);
					} else{
						if (requestQ.gender_preference == true){
							offerQFilter.where.and.push({"member_gender": mem.gender});
						}
						OfferQueueUST.findOne(offerQFilter, function(err, offerQ){
							if (err){
								console.log(err);
								cb(err, null);
							} else{
								if (offerQ != null){
									var PendingSeatUST = app.models.PendingSeatUST;
									var data = {};
									data.rideId = offerQ.rideId;
									data.requestId = requestQ.requestId;
									PendingSeatUST.addPending(data, function(err, pendingS){
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
				});
			}
		});
	}

	OfferQueueUST.removeOffer = function(data, cb){
		OfferQueueUST.findOne({"where": {"rideId": data.rideId}}, function(err, offerQ){
			if (err){
				console.log(err);
				cb(err, null);
			} else{
				console.log(offerQ);
				if (offerQ != null){
					offerQ.destroy(function(err){
						if (err){
							console.log(err);
							cb(err, null);
						} else{
							// set ride status to inactive
							offerQ.ride(function(err, ride){
								if (err){
									console.log(err);
									cb(err, null);
								} else{
									ride.updateAttributes({"status": "inactive"}, function(err, req){
										if (err){
											console.log(err);
											cb(err, null);
										} else{
											cb(null, offerQ);
										}
									});
								}
							});
						}
					});
				} else{
					cb(null, offerQ);
				}
			}
		});
	}

	OfferQueueUST.getAvalSeatNumber = function(offerQ, cb){
		if (offerQ != null){
			var PendingSeatUST = app.models.PendingSeatUST;
			PendingSeatUST.count({"rideId": offerQ.rideId}, function(err, pendingS_num){
				if (err){
					console.log(err);
					cb(err, null);
				} else{
					var MatchedSeatUST = app.models.MatchedSeatUST;
					MatchedSeatUST.count({"rideId": offerQ.rideId}, function(err, matchedS_num){
						if (err){
							console.log(err);
							cb(err, null);
						} else{
							cb(null, offerQ.seat_number-pendingS_num-matchedS_num);
						}
					});
				}
			});
		} else{
			console.log("No such offerQ: ", offerQ);
			cb(null, 0);
		}
	}

	OfferQueueUST.remoteMethod('possibleOffer', {
		http: {path: '/possibleOffer', verb: 'post'},
		accepts: {arg: 'request', type: 'object', http: {source:'body'}},
		returns: {arg: 'offerQ', type: 'object'}
	});

	OfferQueueUST.remoteMethod('removeOffer', {
		http: {path: '/removeOffer', verb: 'post'},
		accepts: {arg: 'data', type: 'object', http: {source:'body'}},
		returns: {arg: 'offerQ', type: 'object'}
	});

	OfferQueueUST.remoteMethod('getAvalSeatNumber', {
		http: {path: '/getAvalSeatNumber', verb: 'post'},
		accepts: {arg: 'data', type: 'object', http: {source:'body'}},
		returns: {arg: 'seatNum', type: 'number'}
	});

};