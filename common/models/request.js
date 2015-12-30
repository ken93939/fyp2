var path = require('path');
var app = require(path.resolve(__dirname, '../../server/server'));
var loopback=require('loopback');
var req=require('request');

module.exports = function(Request) {
	Request.addRequest=function(idk,cb){
		try{
			var ctx=loopback.getCurrentContext();
			// console.log(ctx);
			var accessToken=ctx.get('accessToken');
			// console.log(accessToken);
			var currentUser = ctx && ctx.get('currentUser');
			console.log('currentUser.username: ', currentUser);

			idk["memberId"]=currentUser.id;
			idk["time"]=new Date();

			var Destination = app.models.Destination;
			Destination.getDestination(idk.destination_name, function(err, newDesName){
				if (err) console.log(err);
				idk.destination_name = newDesName;
				
				if(idk.destination_name=="Hang Hau"){
					idk["pickup_name"]="North Gate";
				}
				else{
					idk["pickup_name"]="South Gate";
				}

				Request.create(idk,function(err,request){
					if(err)
						console.log(err);
					// Algorithm 
					var RequestQueue = app.models.RequestQueue;
					idk.requestId = request.id;
					RequestQueue.create(idk, function(err, requestQ){
						if (err) console.log(err);
						var OfferQueue = app.models.OfferQueue;
						OfferQueue.possibleOffer(requestQ, function(err, offerQ){
							if (offerQ != null){
								// check if the request is already cancelled
								Request.findById(request.id, function (err, req){
									if (err) console.log(err);
									if (req != null && req.status != "inactive"){
										offerQ.ride(function(err, offer){
											if (err) console.log(err);
											Request.push(offer, request, function(err, instance){
												if (err) console.log(err);
												console.log(offer);
												// check if the request exist in RequestQueue after 20+5 seconds. If so, cancel.
												setTimeout(function(){
													RequestQueue.findOne({"where": {"requestId": request.id}}, function(err, reqQ){
														if (err) console.log(err);
														if (reqQ != null){
															var reqIdObj = {};
															reqIdObj.requestId = request.id;
															Request.cancelMatch(reqIdObj, function(err, reqObj){
																if (err) console.log(err);
																console.log("(Cancelled by server)");
															});
														}
													});
												}, (20+5)*1000);
											});
										});
									} else{
										var reqIdObj = {};
										reqIdObj.requestId = request.id;
										Request.cancelMatch(reqIdObj, function(err, reqObj){
											if (err) console.log(err);
										});
									}
								});
							}
						});
					});
					cb(null, request.id);
				});
			});
		}
		catch(error){
			console.log(error);
		}
	}

	//userId,matchicon,ridetime,destination
	//header: X-Ionic-Application-Id: d38fa26f
	//Content type: application/json

	//pay the debt should be solved
	//TODO: PUSH problem remaining.
	Request.push=function(ride,idk,cb){
		try{
			var obj={};
			var Ride=app.models.Ride;
			var Member=app.models.Member;
			
			console.log(ride);
			console.log("123");
			console.log(idk);
			console.log(idk.memberId);

			Member.findById(idk.memberId,function(err,Mem){	
				if(err){
					console.log(err);
					cb(err,null);
				}

				Ride.findById(ride.id,function(err,rideIns){
					if(err){
						console.log(err);
						cb(err,null);
					}
					rideIns.own(function(err,ownIns){
						ownIns.vehicle(function(err,vehicleIns){
							var array=[];
							console.log(Mem.deviceToken);
							array.push(Mem.deviceToken+"");
							obj["tokens"]=array;

							obj["notification"]={
								"alert":"Found a match!",
								"android":{
									"payload":{
										"matchicon": "FUCKUPKHIN",
										"ridetime": ride.time,
										"destination": ride.destination_name,
										"license_number": vehicleIns.license_number	//debt solved?,
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
										cb(err,null);
									}
									// console.log(res);
									console.log(res.statusCode);
									cb(null,"OK");
							});
						});
					});
				});

			});

		}
		catch(err){
			console.log(err);
		}
	}

	Request.confirmMatch=function(idk,cb){
		// check if the request is still valid
		var RequestQueue = app.models.RequestQueue;
		RequestQueue.findOne({"where": {"requestId": idk.requestId}}, function(err, reqQ){
			if (err){
				console.log(err);
				cb(err, null);
			} else{
				if (reqQ != null){
					// move PendingSeat record to MatchedSeat
					var PendingSeat = app.models.PendingSeat;
					PendingSeat.toMatchedSeat(idk, function(err, matchedS){
						if (err){
							console.log(err);
							cb(err, null);
						} else{
							if (matchedS != null){
								// create new join record
								var Join = app.models.Join;
								var joinObj = {};
								joinObj.rideId = matchedS.rideId;
								joinObj.requestId = matchedS.requestId;
								joinObj.iconId = 1; // TODO
								Join.create(joinObj, function(err, join){
									if (err){
										console.log(err);
										cb(err, null);
									} else{
										console.log("Join created: ", join);
										// remove RequestQueue record
										RequestQueue.removeRequest(idk, function(err, requestQ){
											if (err){
												console.log(err);
												cb(err, null);
											} else{
												if (requestQ != null){
													console.log("Joined");
													cb(null, "Joined");
													// TODO: check if OfferQueue record is full after 20+5 seconds. If so, remove Offer.

												} else{
													console.log("No such requestId");
													cb(null, "No such requestId");
												}
											}
										});
									}
								});
							} else{
								console.log("No such requestId");
								cb(null, "No such requestId");
							}
						}
					});
				} else{
					console.log("No such requestId");
					cb(null, "No such requestId");
				}
			}
		})
	}

	Request.cancelMatch=function(idk,cb){
		console.log("Cancelling Match...", idk);
		// remove PendingSeat record
		var PendingSeat = app.models.PendingSeat;
		PendingSeat.removePending(idk, function(err, pendingS){
			if (err){
				console.log(err);
				cb(err, null);
			} else{
				// remove RequestQueue record
				var RequestQueue = app.models.RequestQueue;
				RequestQueue.removeRequest(idk, function(err, requestQ){
					if (err){
						console.log(err);
						cb(err, null);
					} else{
						if (requestQ != null){
							console.log("Cancelled");
							cb(null, "Cancelled");
						} else{
							console.log("No such requestId");
							cb(null, "No such requestId");
						}
					}
				});
			}
		});
	}

	Request.cancelConfirmMatch = function(idk, cb){
		console.log("Cancelling confirmed match...", idk);
		// remove join record
		var Join = app.models.Join;
		Join.findOne({"where": {"requestId": idk.requestId}}, function(err, join){
			if (err){
				console.log(err);
				cb(err, null);
			} else{
				if (join != null){
					join.updateAttributes({"status": "cancelled"}, function(err, joinC){
						if (err){
							console.log(err);
							cb(err, null);
						} else{
							// remove MatchedSeat Record
							var MatchedSeat = app.models.MatchedSeat;
							MatchedSeat.removeMatched(idk, function(err, matchedS){
								if (err){
									console.log(err);
									cb(err, null);
								} else{
									console.log("Cancelled");
									cb(null, "Cancelled");									
								}
							});
						}
					});
				} else{
					console.log("No such requestId");
					cb(null, "No such requestId");
				}
			}
		});
	}

	Request.remoteMethod(
		'confirmMatch',
		{
			http: {path: '/confirmMatch', verb: 'post'},
			accepts: {arg: 'ride', type: 'object', http:{source:'body'}},
			returns: {arg: 'status', type: 'string'}
		}
	);

	Request.remoteMethod(
		'cancelMatch',
		{
			http: {path: '/cancelMatch', verb: 'post'},
			accepts: {arg: 'ride', type: 'object', http:{source:'body'}},
			returns: {arg: 'status', type: 'string'}
		}
	);

	Request.remoteMethod(
		'cancelConfirmMatch',
		{
			http: {path: '/cancelConfirmMatch', verb: 'post'},
			accepts: {arg: 'ride', type: 'object', http:{source:'body'}},
			returns: {arg: 'status', type: 'string'}
		}
	);

	Request.remoteMethod(
		'addRequest',
		{
			http: {path: '/addRequest', verb: 'post'},
			accepts: {arg: 'ride', type: 'object', http:{source:'body'}},
			returns: {arg: 'requestId', type: 'number'}
		}
	);

	Request.remoteMethod(
		'push',
		{
			http: {path: '/push', verb: 'post'},
			accepts: {arg: 'idk', type: 'object', http:{source:'body'}},
			accepts:{arg: 'request', type: 'object', http:{source:'body'}},
			returns: {arg: 'status', type: 'string'}
		}
	);
}
