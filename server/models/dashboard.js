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
																				cb(null, "updateAll done");
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
