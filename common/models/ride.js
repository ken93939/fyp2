var path = require('path');
var app = require(path.resolve(__dirname, '../../server/server'));
var loopback=require('loopback');

module.exports = function(Ride) {
	//addRide license_number, destination_name, beforeArrive, seatNumber
	//TODO: PAY THE DEBT  maybe not
	Ride.addRide=function(idk,cb){
		try{
			var ctx=loopback.getCurrentContext();
			// console.log(ctx);
			var accessToken=ctx.get('accessToken');
			// console.log(accessToken);
			var currentUser = ctx && ctx.get('currentUser');
			// console.log('currentUser.username: ', currentUser);

			// var d=new Date();
			// idk["time"]=new Date(d.getTime()+idk.beforeArrive*60000);

			idk["memberId"]=currentUser.id;
			if(idk.destination_name=="Hang Hau"){
	    		idk["pickup_name"]="North Gate";
	    	}
	    	else{
	    		idk["pickup_name"]="South Gate";
	    	}
	    	//TODO: fix the ownid done?
			var ownModel=app.models.Own;
			var veh=app.models.Vehicle;
			veh.findOne({where: {license_number: Ride.license_number}},function(err,vehModel){
				if(err){
					console.log(err);
					cb(err,null);
				}
				else if(vehModel.using){
					console.log("car is occupied");
					cb(null,{"using": true});
				}
				else{
					ownModel.find({where: {memberId: currentUser.id}},function(err,ownIns){
						ownIns.forEach(function(oIns){
							oIns.vehicle(function(err,veh){
								if(err){
									console.log(err);
									cb(err,null);					
								}
								if(idk.license_number==veh.license_number){
									idk["ownId"]=oIns.id;
									Ride.create(idk,function(err,ride){
										if(err){
											console.log(err);
											cb(err,null);						
										}
										console.log(ride);
										// Algorithm 
										var OfferQueue = app.models.OfferQueue;
										idk.rideId = ride.id;
										idk.member_gender = currentUser.gender;
										OfferQueue.create(idk, function(err, offerQ){
											if(err){
												console.log(err);
												cb(err, null);
											} else{
												var Icon = app.models.Icon;
												Icon.count({}, function(err, iconCount){
													if (err){
														console.log(err);
														cb(err, null);
													} else{
														Icon.find({"limit": 1, "skip": ride.id % iconCount}, function(err, icon){
															if (err){
																console.log(err);
																cb(err, null);
															} else{
																console.log("match_icon for driver: ", icon[0]);
																cb(null, {"matchicon": icon[0].match_icon});
															}
														});
													}
												});
												// push to first k possible matched passengers 
												Ride.checkAndPush(offerQ, ride, ride.seat_number, false, function(msg){
													console.log(msg);
												});
											}
										});
									});
								}
							});
						});
						// if(err){
						// 	console.log(err);
						// 	cb(err,null);					
						// }
						
						// idk["ownId"]=ownIns.id;
						// Ride.create(idk,function(err,ride){
						// 	if(err){
						// 		console.log(err);
						// 		cb(err,null);						
						// 	}
						// 	// Algorithm 
						// 	var OfferQueue = app.models.OfferQueue;
						// 	idk.rideId = ride.id;
						// 	OfferQueue.create(idk, function(err, offerQ){
						// 		cb(null, offerQ);
						// 	});
						// });
					});
				}
			});
		}
		catch(err){
			cb(null,err);
		}

	}
	Ride.push = function(ride, request, cb){
		var Request = app.models.Request;
		Request.push(ride, request, function(err, instance){
			if (err){
				console.log(err);
				cb(err, null);
			} else{
				cb(null, instance);
			}
		});
	}

	Ride.checkAndPush = function(offerQ, ride, remaining, err, cb){
		if (remaining > 0){
			var RequestQueue = app.models.RequestQueue;
			RequestQueue.possibleRequest(offerQ, function(err, requestQ){
				if (err){
					console.log(err);
					Ride.checkAndPush(offerQ, ride, remaining-1, true, cb);
				} else{
					if (requestQ != null){
						requestQ.request(function(err, req){
							if (err){
								console.log(err);
								Ride.checkAndPush(offerQ, ride, remaining-1, true, cb);
							} else{
								Ride.push(ride, req, function(err, instance){
									if (err){
										console.log(err);
										Ride.checkAndPush(offerQ, ride, remaining-1, true, cb);
									} else{
										console.log("Request: ", req);
										console.log("Ride: ", ride);
										Ride.checkAndPush(offerQ, ride, remaining-1, err, cb);
									}
								});
							}
						});
					} else{
						console.log("No requestQ");
						Ride.checkAndPush(offerQ, ride, remaining-1, err, cb);
					}
				}
			});
		} else{
			if (err){
				cb("Done with err");
			} else{
				cb("Done");
			}
		}
	}

	Ride.remoteMethod(
		'push',
		{
			http: {path: '/push', verb: 'post'},
			accepts: {arg: 'well', type: 'object', http:{source:'body'}},
			returns: {arg: 'status', type: 'string'}
		}
	);

	Ride.remoteMethod(
		'addRide',
		{
			http: {path: '/addRide', verb: 'post'},
			accepts: {arg: 'well', type: 'object', http:{source:'body'}},
			returns: {arg: 'status', type: 'object'}
		}
	);
};
