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
				PendingSeat.count({"rideId": pendingS.rideId}, function(err, pendingS_num){
					if (err){
						console.log(err);
						cb(err, null);
					} else{
						var MatchedSeat = app.models.MatchedSeat;
						MatchedSeat.count({"rideId": pendingS.rideId}, function(err, matchedS_num){
							if (err){
								console.log(err);
								cb(err, null);
							} else{
								var RequestQueue = app.models.RequestQueue;
								RequestQueue.findOne({"where": {"requestId": pendingS.requestId}}, function(err, requestQ){
									if (err){
										console.log(err);
										cb(err, null);
									} else{
										requestQ.updateAttributes({"status": "pending"}, function(err, reqQ){
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
														var occupied_seat_num = pendingS_num + matchedS_num;
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
						});	
					}
				});	
			}
		});
	}

	PendingSeat.removePending = function(data, cb){
		PendingSeat.findOne({"where": {"requestId": data.requestId}}, function(err, pendingS){
			if (err){
				console.log(err);
				cb(err, null);
			} else{
				if (pendingS != null){
					var OfferQueue = app.models.OfferQueue;
					OfferQueue.findOne({"where": {"rideId": pendingS.rideId}}, function(err, offerQ){
						if (err){
							console.log(err);
							cb(err, null);
						} else{
							pendingS.destroy(function(err){
								if (err){
									console.log(err);
									cb(err, null);
								} else{
									offerQ.updateAttributes({"is_full": false}, function(err, offer){
										if (err){
											console.log(err);
											cb(err, null);
										} else{
											console.log("PendingSeat removed: ", pendingS.id);
											cb(null, pendingS);
										}
									});
								}
							});
						}
					});
				} else{
					cb(null, pendingS);
				}
			}
		});
	}

	PendingSeat.toMatchedSeat = function(data, cb){
		PendingSeat.findOne({"where": {"requestId": data.requestId}}, function(err, pendingS){
			if (err){
				console.log(err);
				cb(err, null);
			} else{
				if (pendingS != null){
					pendingS.destroy(function(err){
						if (err){
							console.log(err);
							cb(err, null);
						} else{
							var MatchedSeat = app.models.MatchedSeat;
							var matchedSObj = {};
							matchedSObj.requestId = pendingS.requestId;
							matchedSObj.rideId = pendingS.rideId;
							MatchedSeat.create(matchedSObj, function(err, matchedS){
								if (err){
									console.log(err);
									cb(err, null);
								} else{
									console.log("Moved PendingSeat to MatchedSeat ", matchedS);
									cb(null, matchedS);
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

	PendingSeat.remoteMethod('addPending', {
		http: {path: '/addPending', verb: 'post'},
		accepts: {arg: 'data', type: 'object', http: {source:'body'}},
		returns: {arg: 'pendingS', type: 'object'}
	});

	PendingSeat.remoteMethod('removePending', {
		http: {path: '/removePending', verb: 'post'},
		accepts: {arg: 'data', type: 'object', http: {source:'body'}},
		returns: {arg: 'pendingS', type: 'object'}
	});

	PendingSeat.remoteMethod('toMatchedSeat', {
		http: {path: '/toMatchedSeat', verb: 'post'},
		accepts: {arg: 'data', type: 'object', http: {source:'body'}},
		returns: {arg: 'pendingS', type: 'object'}
	});

};
