var path = require('path');
var app = require(path.resolve(__dirname, '../../server/server'));
var loopback = require('loopback');

module.exports = function(Dashboard) {

	Dashboard.getDashboard = function(cb){
		Dashboard.findById(1, function(err, dashboard){
			if (err){
				console.log(err);
				cb(err, null);
			} else{
				if (dashboard != null){
					cb(null, dashboard);
				} else{
					Dashboard.create({id: 1}, function(err, db){
						if (err){
							console.log(err);
							cb(err, null);
						} else{
							cb(null, db);
						}
					});
				}
			}
		});
	}

	Dashboard.updateCount = function(model, filter, attrName, cb){
		model.count(filter, function(err, _count){
			if (err){
				console.log(err);
				cb(err, null);
			} else{
				Dashboard.getDashboard(function(err, dashboard){
					if (err){
						console.log(err);
						cb(err, null);
					} else{
						if (dashboard[attrName] != _count){
							var attr = {};
							attr[attrName] = _count;
							dashboard.updateAttributes(attr, function(err, db){
								if (err){
									console.log(err);
									cb(err, null);
								} else{
									cb(null, db);
								}
							});
						} else{
							cb(null, dashboard);
						}
					}
				});
			}
		});
	}

	Dashboard.updateArray = function(cb){
		var Admin = app.models.Admin;
		var object = {};
		Admin.rideRequestBetween(1, 8, object, function(err, object){
			if (err){
				console.log(err);
				cb(err, null);
			} else{
				var today = new Date();
            	var oneDay = 24*60*60*1000;
            	var pastRequests = [];
            	var pastOffers = [];
	            for (var i=7; i>0; i--){
	                var currDay = new Date(today-i*oneDay);
	                var nextDay = new Date(currDay.getTime()+oneDay);
	                pastOffers.push(object[currDay.getDate()+"between_rideCount"+nextDay.getDate()]);
	                pastRequests.push(object[currDay.getDate()+"between_requestCount"+nextDay.getDate()]);
	            }
	            Dashboard.getDashboard(function(err, dashboard){
					if (err){
						console.log(err);
						cb(err, null);
					} else{
						dashboard.updateAttributes({pastOffers: pastOffers, pastRequests: pastRequests}, function(err, db){
							if (err){
								console.log(err);
								cb(err, null);
							} else{
								cb(null, db);
							}
						});
					}
				});
			}
		});
	};

	Dashboard.getTimelineObj = function(obj, requestIds, rideIds, count, cb){
		if (count >= 5){
			cb(null, obj);
		} else{
			var max = 0;
			var maxType = "";
			var maxObj = null;
			var RequestQueue = app.models.RequestQueue;
			RequestQueue.findOne({where: {requestId: {nin: requestIds}}, order: "time DESC"}, function(err, requestQ){
				if (err){
					console.log(err);
					cb(err, null);
				} else{
					// console.log(count, requestQ);
					if (requestQ != null && requestQ.time > max){
						max = requestQ.time;
						maxType = "Request";
						maxObj = requestQ;
					}
					var RequestQueueUST = app.models.RequestQueueUST;
					RequestQueueUST.findOne({where: {requestId: {nin: requestIds}}, order: "time DESC"}, function(err, requestQUst){
						if (err){
							console.log(err);
							cb(err, null);
						} else{
							// console.log(count, requestQUst);
							if (requestQUst != null && requestQUst.time > max){
								max = requestQUst.time;
								maxType = "Request";
								maxObj = requestQUst;
							}
							var OfferQueue = app.models.OfferQueue;
							OfferQueue.findOne({where: {rideId: {nin: rideIds}}, order: "created DESC"}, function(err, offerQ){
								if (err){
									console.log(err);
									cb(err, null);
								} else{
									// console.log(count, offerQ);
									if (offerQ != null && offerQ.created > max){
										max = offerQ.created;
										maxType = "Offer";
										maxObj = offerQ;
									}
									var OfferQueueUST = app.models.OfferQueueUST;
									OfferQueueUST.findOne({where: {rideId: {nin: rideIds}}, order: "created DESC"}, function(err, offerQUst){
										if (err){
											console.log(err);
											cb(err, null);
										} else{
											// console.log(count, offerQUst);
											if (offerQUst != null && offerQUst.created > max){
												max = offerQUst.created;
												maxType = "Offer";
												maxObj = offerQUst;
											}
											if (maxObj != null){
												// console.log(max, maxType, maxObj);
												var item = {};
												item.type = maxType;
												item.from = maxObj.pickup_name;
												item.to = maxObj.destination_name;
												if (maxType == "Request"){
													requestIds.push(maxObj.requestId);
													item.time = maxObj.time;
												} else{
													rideIds.push(maxObj.rideId);
													item.time = maxObj.created;
												}
												maxObj.member(function(err, mem){
													if (err){
														console.log(err);
														cb(err, null);
													} else{
														item.email = mem.email;
														obj.push(item);
														Dashboard.getTimelineObj(obj, requestIds, rideIds, count+1, cb);
													}
												});
											} else{
												Dashboard.getTimelineObj(obj, requestIds, rideIds, count+1, cb);
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
	}

	Dashboard.updateTimeline = function(cb){
		var requestIds = [];
		var rideIds = [];
		var obj = [];
		Dashboard.getTimelineObj(obj, requestIds, rideIds, 0, function(err, returnObj){
			if (err){
				console.log(err);
				cb(err, null);
			} else{
				Dashboard.getDashboard(function(err, dashboard){
					if (err){
						console.log(err);
						cb(err, null);
					} else{
						// console.log(returnObj);	
						dashboard.updateAttributes({timeline: returnObj}, function(err, db){
							if (err){
								console.log(err);
								cb(err, null);
							} else{
								cb(null, db);
							}
						});
					}
				});
			}
		})
	}

	Dashboard.updateAllInfo = function(cb){
		var Member = app.models.Member;
		var request = app.models.request;
		var Ride = app.models.Ride;
		var Join = app.models.Join;
		var curTime = new Date();
		var today = new Date(curTime.getFullYear(), curTime.getMonth(), curTime.getDate());

		Dashboard.updateCount(Member, {created: {gte: today}}, "memCount", function(err, db){
			if (err){
				console.log(err);
				cb(err, null);
			} else{
				Dashboard.updateCount(Ride, {time: {gte: today}}, "rideCount", function(err, db){
					if (err){
						console.log(err);
						cb(err, null);
					} else{
						Dashboard.updateCount(request, {time: {gte: today}}, "requestCount", function(err, db){
							if (err){
								console.log(err);
								cb(err, null);
							} else{
								Dashboard.updateCount(Join, {time: {gte: today}}, "joinCount", function(err, db){
									if (err){
										console.log(err);
										cb(err, null);
									} else{
										Dashboard.updateCount(Member, {isDriver: "no"}, "passengerCount", function(err, db){
											if (err){
												console.log(err);
												cb(err, null);
											} else{
												Dashboard.updateCount(Member, {isDriver: "yes"}, "driverCount", function(err, db){
													if (err){
														console.log(err);
														cb(err, null);
													} else{
														Dashboard.updateCount(Member, {gender: "male"}, "maleCount", function(err, db){
															if (err){
																console.log(err);
																cb(err, null);
															} else{
																Dashboard.updateCount(Member, {gender: "female"}, "femaleCount", function(err, db){
																	if (err){
																		console.log(err);
																		cb(err, null);
																	} else{
																		Dashboard.updateArray(function(err, db){
																			if (err){
																				console.log(err);
																				cb(err, null);
																			} else{
																				Dashboard.updateTimeline(function(err, db){
																					if (err){
																						console.log(err);
																						cb(err, null);
																					} else{
																						cb(null, db);
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
								});
							}
						});
					}
				});
			}
		});
	}

};
