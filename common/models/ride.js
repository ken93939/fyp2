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
										// push to first k possible matched passengers 
										Ride.checkAndPush(offerQ, offerQ.seat_number, false, function(msg){
											console.log(msg);
											cb(null, msg);
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

	Ride.checkAndPush = function(offerQ, remaining, err, cb){
		if (remaining > 0){
			var RequestQueue = app.models.RequestQueue;
			RequestQueue.possibleRequest(offerQ, function(err, requestQ){
				if (err){
					console.log(err);
					Ride.checkAndPush(offerQ, remaining-1, true, cb);
				} else{
					if (requestQ != null){
						requestQ.request(function(err, request){
							if (err){
								console.log(err);
								Ride.checkAndPush(offerQ, remaining-1, true, cb);
							} else{
								Ride.push(ride, request, function(err, instance){
									if (err) console.log(err);
									console.log(ride);
									Ride.checkAndPush(offerQ, remaining-1, err, cb);
								});
							}
						});
					} else{
						Ride.checkAndPush(offerQ, remaining-1, true, cb);
					}
				}
			});
		} else{
			if (err){
				cb("All pushed with err");
			} else{
				cb("All pushed");
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
