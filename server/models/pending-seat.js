var path = require('path');
var app = require(path.resolve(__dirname, '../../server/server'));
var loopback = require('loopback');

module.exports = function(PendingSeat) {

	PendingSeat.addPending = function(data, cb){
		PendingSeat.create(data, function(err, pendingS){
			if (err){
				console.log(err);
				cb(err, null);
			} else{
				PendingSeat.count({"rideId": pendingS.rideId}, function(err, occupied_seat_num){
					if (err){
						console.log(err);
						cb(err, null);
					} else{
						var OfferQueue = app.models.OfferQueue;
						OfferQueue.findOne({"where": {"rideId": pendingS.rideId}}, function(err, offerQ){
							if (err){
								console.log(err);
								cb(err, null);
							} else{
								console.log(pendingS.rideId+": {occupied_seat_num: "+occupied_seat_num+", offerQ.seat_number: "+offerQ.seat_number+"}");
								if (occupied_seat_num >= offerQ.seat_number){
									offerQ.updateAttributes({"is_full": true}, function(err, offer){
										if (err){
											console.log(err);
											cb(err, null);
										} else{
											console.log("Full now!");
											cb(null, pendingS);
										}
									});
								} else{
									cb(null, pendingS);
								}
							}
						});
					}
				});	
			}
		});
	}

	PendingSeat.remoteMethod('addPending', {
		http: {path: '/addPending', verb: 'post'},
		accepts: {arg: 'data', type: 'object', http: {source:'body'}},
		returns: {arg: 'pendingS', type: 'object'}
	});

};
