var path = require('path');
var app = require(path.resolve(__dirname, '../../server/server'));
var loopback = require('loopback');

module.exports = function(PendingSeatUST) {

	PendingSeatUST.addPending = function(data, cb){
		PendingSeatUST.create(data, function(err, pendingS){
			if (err){
				console.log(err);
				cb(err, null);
			} else{
				PendingSeatUST.count({"rideId": pendingS.rideId}, function(err, pendingS_num){
					if (err){
						console.log(err);
						cb(err, null);
					} else{
						var MatchedSeatUST = app.models.MatchedSeatUST;
						MatchedSeatUST.count({"rideId": pendingS.rideId}, function(err, matchedS_num){
							if (err){
								console.log(err);
								cb(err, null);
							} else{
								var RequestQueueUST = app.models.RequestQueueUST;
								RequestQueueUST.findOne({"where": {"requestId": pendingS.requestId}}, function(err, requestQ){
									if (err){
										console.log(err);
										cb(err, null);
									} else{
										requestQ.updateAttributes({"status": "pending"}, function(err, reqQ){
											if (err){
												console.log(err);
												cb(err, null);
											} else{
												var OfferQueueUST = app.models.OfferQueueUST;
												OfferQueueUST.findOne({"where": {"rideId": pendingS.rideId}}, function(err, offerQ){
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

	PendingSeatUST.removePending = function(data, cb){
		PendingSeatUST.findOne({"where": {"requestId": data.requestId}}, function(err, pendingS){
			if (err){
				console.log(err);
				cb(err, null);
			} else{
				if (pendingS != null){
					var OfferQueueUST = app.models.OfferQueueUST;
					OfferQueueUST.findOne({"where": {"rideId": pendingS.rideId}}, function(err, offerQ){
						if (err){
							console.log(err);
							cb(err, null);
						} else{
							pendingS.destroy(function(err){
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
												console.log("PendingSeatUST removed: ", pendingS.id);
												cb(null, pendingS);
											}
										});
									} else{
										console.log("PendingSeatUST removed: ", pendingS.id);
										cb(null, pendingS);
									}
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

	PendingSeatUST.toMatchedSeat = function(data, cb){
		PendingSeatUST.findOne({"where": {"requestId": data.requestId}}, function(err, pendingS){
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
							var MatchedSeatUST = app.models.MatchedSeatUST;
							var matchedSObj = {};
							matchedSObj.requestId = pendingS.requestId;
							matchedSObj.rideId = pendingS.rideId;
							MatchedSeatUST.create(matchedSObj, function(err, matchedS){
								if (err){
									console.log(err);
									cb(err, null);
								} else{
									console.log("Moved PendingSeatUST to MatchedSeatUST ", matchedS);
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

	PendingSeatUST.remoteMethod('addPending', {
		http: {path: '/addPending', verb: 'post'},
		accepts: {arg: 'data', type: 'object', http: {source:'body'}},
		returns: {arg: 'pendingS', type: 'object'}
	});

	PendingSeatUST.remoteMethod('removePending', {
		http: {path: '/removePending', verb: 'post'},
		accepts: {arg: 'data', type: 'object', http: {source:'body'}},
		returns: {arg: 'pendingS', type: 'object'}
	});

	PendingSeatUST.remoteMethod('toMatchedSeat', {
		http: {path: '/toMatchedSeat', verb: 'post'},
		accepts: {arg: 'data', type: 'object', http: {source:'body'}},
		returns: {arg: 'pendingS', type: 'object'}
	});

};
