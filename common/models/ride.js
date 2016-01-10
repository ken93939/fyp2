var path = require('path');
var app = require(path.resolve(__dirname, '../../server/server'));
var loopback=require('loopback');
var req=require('request');

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

	Ride.cancelRide = function(cb){
		var ctx=loopback.getCurrentContext();
		var accessToken=ctx.get('accessToken');
		var currentUser = ctx && ctx.get('currentUser');
		if (currentUser != null){
			var OfferQueue = app.models.OfferQueue;
			OfferQueue.findOne({"where": {"memberId": currentUser.id}}, function(err, offerQ){
				if (err){
					console.log(err);
					cb(err, null);
				} else{
					if (offerQ != null){
						// remove from Ride & OfferQueue
						var OfferQueue = app.models.OfferQueue;
						var data = {};
						data.rideId = offerQ.rideId;
						OfferQueue.removeOffer(data, function(err, offerQIns){
							if (err){
								console.log(err);
								cb(err, null);
							} else{
								console.log("OfferQueue Removed: ", offerQIns);
								// update join records
								var Join = app.models.Join;
								Join.updateAll({"rideId": offerQ.rideId}, {"status": "cancelled"}, function(err, joins){
									if (err){
										console.log(err);
										cb(err, null);
									} else{
										// remove pending passenger
										var PendingSeat = app.models.PendingSeat;
										PendingSeat.find({"where": {"rideId": offerQ.rideId}}, function(err, pendingS){
											if (err){
												console.log(err);
												cb(err, null);
											} else{
												console.log("pendingSeat: ", pendingS.length);
												pendingS.forEach(function(item, index, array){
													var data = {};
													data.requestId = item.requestId;
													PendingSeat.removePending(data, function(err, pendS){
														if (err){
															console.log(err);
														} else{
															// create new requests(with original time)
															var Request = app.models.Request;
															Request.addRequestAgain(data, function(err, req){
																if (err){
																	console.log(err);
																} else{
																	// push to passenger
																	Ride.pushNewRequest(req, function(err, msg){
																		if (err){
																			console.log(err);
																		}
																	});
																}
															});
														}
													});
												});
												// remove matched passenger
												var MatchedSeat = app.models.MatchedSeat;
												MatchedSeat.find({"where": {"rideId": offerQ.rideId}}, function(err, matchedS){
													if (err){
														console.log(err);
														cb(err, null);
													} else{
														console.log("MatchedSeat: ", matchedS.length);
														matchedS.forEach(function(item, index, array){
															var data = {};
															data.requestId = item.requestId;
															MatchedSeat.removeMatched(data, function(err, matchS){
																if (err){
																	console.log(err);
																} else{
																	// create new requests(with original time)
																	var Request = app.models.Request;
																	Request.addRequestAgain(data, function(err, req){
																		if (err){
																			console.log(err);
																		} else{
																			// push to passenger
																			Ride.pushNewRequest(req, function(err, msg){
																				if (err){
																					console.log(err);
																				}
																			});
																		}
																	});
																}
															});
														});
														console.log("Done");
														cb(null, "Done");
													}
												});
											}
										});
									}
								});
							}
						});
						
					} else{
						cb(null, "Offer not found");
					}
				}
			});
		} else{
			cb(null, "Invalid User");
		}
	}

	Ride.pushNewRequest = function(data, cb){
		try{
			var obj = {};
			var Member = app.models.Member;
			var Request = app.models.Request;
			Request.findById(data.requestId, function(err, request){
				if (err){
					console.log(err);
					cb(err, null);
				} else{
					if (request != null){
						request.member(function(err, mem){
							if (err){
								console.log(err);
								cb(err, null);
							} else{
								var array = [];
								console.log(mem.deviceToken);
								array.push(mem.deviceToken+"");
								obj["tokens"] = array;
								obj["notification"] = {
									"alert": "Driver has cancelled the offer!",
									"android":{
										"payload":{
											"status": "cancel",
											"requestId": data.requestId,
											"newDesName": data.newDesName
										}
									}
								};
								var Base64={_keyStr:"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",encode:function(e){var t="";var n,r,i,s,o,u,a;var f=0;e=Base64._utf8_encode(e);while(f<e.length){n=e.charCodeAt(f++);r=e.charCodeAt(f++);i=e.charCodeAt(f++);s=n>>2;o=(n&3)<<4|r>>4;u=(r&15)<<2|i>>6;a=i&63;if(isNaN(r)){u=a=64}else if(isNaN(i)){a=64}t=t+this._keyStr.charAt(s)+this._keyStr.charAt(o)+this._keyStr.charAt(u)+this._keyStr.charAt(a)}return t},decode:function(e){var t="";var n,r,i;var s,o,u,a;var f=0;e=e.replace(/[^A-Za-z0-9\+\/\=]/g,"");while(f<e.length){s=this._keyStr.indexOf(e.charAt(f++));o=this._keyStr.indexOf(e.charAt(f++));u=this._keyStr.indexOf(e.charAt(f++));a=this._keyStr.indexOf(e.charAt(f++));n=s<<2|o>>4;r=(o&15)<<4|u>>2;i=(u&3)<<6|a;t=t+String.fromCharCode(n);if(u!=64){t=t+String.fromCharCode(r)}if(a!=64){t=t+String.fromCharCode(i)}}t=Base64._utf8_decode(t);return t},_utf8_encode:function(e){e=e.replace(/\r\n/g,"\n");var t="";for(var n=0;n<e.length;n++){var r=e.charCodeAt(n);if(r<128){t+=String.fromCharCode(r)}else if(r>127&&r<2048){t+=String.fromCharCode(r>>6|192);t+=String.fromCharCode(r&63|128)}else{t+=String.fromCharCode(r>>12|224);t+=String.fromCharCode(r>>6&63|128);t+=String.fromCharCode(r&63|128)}}return t},_utf8_decode:function(e){var t="";var n=0;var r=c1=c2=0;while(n<e.length){r=e.charCodeAt(n);if(r<128){t+=String.fromCharCode(r);n++}else if(r>191&&r<224){c2=e.charCodeAt(n+1);t+=String.fromCharCode((r&31)<<6|c2&63);n+=2}else{c2=e.charCodeAt(n+1);c3=e.charCodeAt(n+2);t+=String.fromCharCode((r&15)<<12|(c2&63)<<6|c3&63);n+=3}}return t}}
								//var auth="basic "+Base64.encode("83203dab26c5e0e1904d2d822f6eef3efb4eebc0b16bea7d"+":");
								var auth="basic "+Base64.encode("766e0edd8c6e41a81da5b8d141b4181b5b7d4f93d4c4a6ab"+":");

								console.log(obj.notification.android.payload);

								req.post({
									url: "https://push.ionic.io/api/v1/push",
									method: 'POST',
									headers: {
										'Content-Type': 'application/json',
										'X-Ionic-Application-Id': "d38fa26f", //"2d9c3ded",
										'Authorization': auth
									},
									json: obj
									},function(err,res,body){
										if(err){
											console.log("req error:",err);
											cb(err, null);
										} else{
											// console.log(res);
											console.log(res.statusCode);
											cb(null, "OK");
										}
								});
							}
						});
					} else{
						cb(null, "Request not found");
					}
				}
			});

		}
		catch (err){
			console.log(err);
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

	Ride.remoteMethod(
		'cancelRide',
		{
			http: {path: '/cancelRide', verb: 'get'},
			returns: {arg: 'status', type: 'string'}
		}
	);

	Ride.remoteMethod(
		'pushNewRequest',
		{
			http: {path: '/pushNewRequest', verb: 'post'},
			accepts:{arg: 'request', type: 'object', http:{source:'body'}},
			returns: {arg: 'status', type: 'string'}
		}
	);
};
