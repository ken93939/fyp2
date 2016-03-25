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
			console.log('currentUser.email: ', currentUser.email);
			if (idk["memberId"] == null){
				idk["memberId"] = currentUser.id;
			}
			if (idk["time"] == null){
				idk["time"] = new Date();
			}

			var returnObj = {};

			Request.CheckLocation(idk, function(err, newName){
				if (err) console.log(err);
				idk.destination_name = newName;
				returnObj.newDesName = newName;
				if (idk.leaveUst){
					if (idk.destination_name == "Hang Hau"){
						idk["pickup_name"] = "North Gate";
					} else if (idk.destination_name == "Choi Hung"){
						idk["pickup_name"] = "South Gate";
					}
				} else{
					idk["pickup_name"] = idk.destination_name;
					idk["destination_name"] = "HKUST";
				}

				Request.create(idk,function(err,request){
					if(err)
						console.log(err);
					// Algorithm 
					var RequestQueue = idk.leaveUst? app.models.RequestQueue: app.models.RequestQueueUST;
					idk.requestId = request.id;
					idk.member_gender = currentUser.gender;
					returnObj.requestId = request.id;
					RequestQueue.create(idk, function(err, requestQ){
						if (err) console.log(err);
						var OfferQueue = idk.leaveUst? app.models.OfferQueue: app.models.OfferQueueUST;
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
											});
										});
									} else{
										var reqIdObj = {};
										reqIdObj.requestId = request.id;
										reqIdObj.leaveUst = idk.leaveUst;
										Request.cancelMatch(reqIdObj, function(err, reqObj){
											if (err) console.log(err);
										});
									}
								});
							}
						});
					});
					cb(null, returnObj);
				});
			});
		}
		catch(error){
			console.log(error);
		}
	}

	Request.CheckLocation = function(idk, cb){
		if (idk.leaveUst){
			var Destination = app.models.Destination;
			Destination.getDestination(idk.destination_name, function(err, newDesName){
				if (err){
					console.log(err);
					cb(err, null);
				} else{
					cb(null, newDesName);
				}
			});
		} else{
			var Pickup = app.models.Pickup;
			Pickup.getPickup(idk.pickup_name, function(err, newPuName){
				if (err){
					console.log(err);
					cb(err, null);
				} else{
					cb(null, newPuName);
				}
			});
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
			
			// console.log(ride);
			// console.log("123");
			// console.log(idk);
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
							// var array=[];
							// // console.log(Mem.deviceToken);
							// array.push(Mem.deviceToken+"");
							// obj["tokens"]=array;

							// obj["notification"]={
							// 	"alert":"Found a match!",
							// 	"android":{
							// 		"payload":{
							// 			"status": "match",
							// 			"ridetime": ride.time,
							// 			"destination": ride.destination_name,
							// 			"license_number": vehicleIns.license_number	//debt solved?,
							// 		}
							// 	}
							// };

							// var Base64={_keyStr:"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",encode:function(e){var t="";var n,r,i,s,o,u,a;var f=0;e=Base64._utf8_encode(e);while(f<e.length){n=e.charCodeAt(f++);r=e.charCodeAt(f++);i=e.charCodeAt(f++);s=n>>2;o=(n&3)<<4|r>>4;u=(r&15)<<2|i>>6;a=i&63;if(isNaN(r)){u=a=64}else if(isNaN(i)){a=64}t=t+this._keyStr.charAt(s)+this._keyStr.charAt(o)+this._keyStr.charAt(u)+this._keyStr.charAt(a)}return t},decode:function(e){var t="";var n,r,i;var s,o,u,a;var f=0;e=e.replace(/[^A-Za-z0-9\+\/\=]/g,"");while(f<e.length){s=this._keyStr.indexOf(e.charAt(f++));o=this._keyStr.indexOf(e.charAt(f++));u=this._keyStr.indexOf(e.charAt(f++));a=this._keyStr.indexOf(e.charAt(f++));n=s<<2|o>>4;r=(o&15)<<4|u>>2;i=(u&3)<<6|a;t=t+String.fromCharCode(n);if(u!=64){t=t+String.fromCharCode(r)}if(a!=64){t=t+String.fromCharCode(i)}}t=Base64._utf8_decode(t);return t},_utf8_encode:function(e){e=e.replace(/\r\n/g,"\n");var t="";for(var n=0;n<e.length;n++){var r=e.charCodeAt(n);if(r<128){t+=String.fromCharCode(r)}else if(r>127&&r<2048){t+=String.fromCharCode(r>>6|192);t+=String.fromCharCode(r&63|128)}else{t+=String.fromCharCode(r>>12|224);t+=String.fromCharCode(r>>6&63|128);t+=String.fromCharCode(r&63|128)}}return t},_utf8_decode:function(e){var t="";var n=0;var r=c1=c2=0;while(n<e.length){r=e.charCodeAt(n);if(r<128){t+=String.fromCharCode(r);n++}else if(r>191&&r<224){c2=e.charCodeAt(n+1);t+=String.fromCharCode((r&31)<<6|c2&63);n+=2}else{c2=e.charCodeAt(n+1);c3=e.charCodeAt(n+2);t+=String.fromCharCode((r&15)<<12|(c2&63)<<6|c3&63);n+=3}}return t}}
							// //var auth="basic "+Base64.encode("83203dab26c5e0e1904d2d822f6eef3efb4eebc0b16bea7d"+":");
							// var auth="basic "+Base64.encode("766e0edd8c6e41a81da5b8d141b4181b5b7d4f93d4c4a6ab"+":");

							// console.log(obj.notification.android.payload);

							// req.post({
							// 	url: "https://push.ionic.io/api/v1/push",
							// 	method: 'POST',
							// 	headers: {
							// 		'Content-Type': 'application/json',
							// 		'X-Ionic-Application-Id': "d38fa26f", //"2d9c3ded",
							// 		'Authorization': auth
							// 	},
							// 	json: obj
							// 	},function(err,res,body){
							// 		if(err){
							// 			console.log("req error:",err);
							// 			cb(err,null);
							// 		} else{
							// 			// console.log(res);
							// 			console.log(res.statusCode);
							// 			cb(null,"OK");
							// 		}
							// });
							
							obj["to"]= Mem.deviceToken;
							obj["collapse_key"] = "Ride";
							obj["data"]={
								"status": "match",
								"ridetime": ride.time,
								"destination": ride.destination_name,
								"license_number": vehicleIns.license_number,	//debt solved?,
								"title": "Found a match",
								"message": "Click here to see the details",
								"image": "icon"
							};
							console.log("obj: ", obj);
							req.post({
								url: "https://gcm-http.googleapis.com/gcm/send",
								method: 'POST',
								headers: {
									'Content-Type': 'application/json',
									'Authorization': 'key=' + 'AIzaSyAmLirUryoDgIh4siI9I2MIOcGiE1NszU4' 
								},
								json: obj
								},function(err,res,body){
									if(err){
										console.log("req error:",err);
										cb(err,null);
									} else{
										// console.log(res);
										console.log(res.statusCode, ((res.statusCode/100) | 0));
										if (((res.statusCode/100) | 0) == 2){
											cb(null, "OK");
										} else{
											Request.push(ride, idk, cb);
										}
									}
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
		var RequestQueue = idk.leaveUst? app.models.RequestQueue: app.models.RequestQueueUST;
		RequestQueue.findOne({"where": {"requestId": idk.requestId}}, function(err, reqQ){
			if (err){
				console.log(err);
				cb(err, null);
			} else{
				if (reqQ != null){
					// move PendingSeat record to MatchedSeat
					var PendingSeat = idk.leaveUst? app.models.PendingSeat: app.models.PendingSeatUST;
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
								var Icon = app.models.Icon;
								Icon.count({}, function(err, iconCount){
									if (err){
										console.log(err);
										cb(err, null);
									} else{
										Icon.find({"limit": 1, "skip": joinObj.rideId % iconCount}, function(err, icon){
											if (err){
												console.log(err);
												cb(err, null);
											} else{
												console.log(icon[0]);
												joinObj.iconId = icon[0].id;
												Join.addJoin(joinObj, function(err, join){
													if (err){
														console.log(err);
														cb(err, null);
													} else{
														// remove RequestQueue record
														RequestQueue.removeRequest(idk, function(err, requestQ){
															if (err){
																console.log(err);
																cb(err, null);
															} else{
																if (requestQ != null){
																	console.log("Joined");
																	cb(null, icon[0].match_icon);
																	// check if OfferQueue record is full after 20+60 seconds. If so, remove Offer.
																	console.log("server starts counting... (OfferQueue inactive?)");
																	setTimeout(function(){
																		console.log("server stops counting (OfferQueue inactive?)");
																		var OfferQueue = idk.leaveUst? app.models.OfferQueue: app.models.OfferQueueUST;
																		OfferQueue.findOne({"where": {"rideId": join.rideId, "is_full": true}}, function(err, offerQ){
																			if (err) console.log(err);
																			if (offerQ != null){
																				if (offerQ.is_full){
																					offerQ.ride(function(err, ride){
																						if (err) console.log(err);
																						if (ride != null){
																							ride.updateAttributes({"status": "inactive"}, function(err, rid){
																								if (err) console.log(err);
																								// offerQ.destroy(function(err){
																								// 	if (err) console.log(err);
																								// 	console.log("Removed from OfferQueue: ", offerQ);
																								// });
																							});
																						}
																					});
																				}
																			}
																		});
																	}, (20+60)*1000);
																} else{
																	console.log("No such requestId");
																	cb(null, null);
																}
															}
														});
													}
												});
											}
										});
									}
								});
							} else{
								console.log("No such requestId");
								cb(null, null);
							}
						}
					});
				} else{
					console.log("No such requestId");
					cb(null, null);
				}
			}
		})
	}

	Request.cancelMatch=function(idk,cb){
		console.log("Cancelling Match...", idk);
		// remove PendingSeat record
		var PendingSeat = idk.leaveUst? app.models.PendingSeat: app.models.PendingSeatUST;
		PendingSeat.removePending(idk, function(err, pendingS){
			if (err){
				console.log(err);
				cb(err, null);
			} else{
				// remove RequestQueue record
				var RequestQueue = idk.leaveUst? app.models.RequestQueue: app.models.RequestQueueUST;
				RequestQueue.removeRequest(idk, function(err, requestQ){
					if (err){
						console.log(err);
						cb(err, null);
					} else{
						if (requestQ != null){
							console.log("Cancelled");
							cb(null, "Cancelled");
							// push offer to another possible matched passenger
							if (pendingS != null){
								var OfferQueue = idk.leaveUst? app.models.OfferQueue: app.models.OfferQueueUST;
								OfferQueue.findOne({"where": {"rideId": pendingS.rideId}}, function(err, offQ){
									if (err) console.log(err);
									if (offQ != null){
										RequestQueue.possibleRequest(offQ, function(err, reqQ){
											if (reqQ != null){
												reqQ.request(function(err, req){
													if (err) console.log(err);
													offQ.ride(function(err, rid){
														if (err) console.log(err);
														Request.push(rid, req, function(err, instance){
															if (err) console.log(err);
															console.log(rid);
														});
													});
												});
											}
										});
									}
								});
							}
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
							var MatchedSeat = idk.leaveUst? app.models.MatchedSeat: app.models.MatchedSeatUST;
							MatchedSeat.removeMatched(idk, function(err, matchedS){
								if (err){
									console.log(err);
									cb(err, null);
								} else{
									console.log("Cancelled");
									// push matched number to driver 
									Join.pushMatchedNumber({"rideId": joinC.rideId}, function(err, str){
										if (err){
											console.log(err);
											cb(err, null);
										} else{
											cb(null, "Cancelled");
											// push offer to another possible matched passenger
											if (matchedS != null){
												var OfferQueue = idk.leaveUst? app.models.OfferQueue: app.models.OfferQueueUST;
												OfferQueue.findOne({"where": {"rideId": matchedS.rideId}}, function(err, offQ){
													if (err) console.log(err);
													if (offQ != null){
														var RequestQueue = idk.leaveUst? app.models.RequestQueue: app.models.RequestQueueUST;
														RequestQueue.possibleRequest(offQ, function(err, reqQ){
															if (reqQ != null){
																reqQ.request(function(err, req){
																	if (err) console.log(err);
																	offQ.ride(function(err, rid){
																		if (err) console.log(err);
																		Request.push(rid, req, function(err, instance){
																			if (err) console.log(err);
																			console.log(rid);
																		});
																	});
																});
															}
														});
													}
												});
											}
										}
									});
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

	Request.checkAutoCancel = function(data, cb){
		// check if the request exist in RequestQueue after 20+2 seconds. If so, cancel.
		console.log("server starts counting... (Auto Cancel?)");
		setTimeout(function(){
			console.log("server stops counting (Auto Cancel?)");
			var RequestQueue = data.leaveUst? app.models.RequestQueue: app.models.RequestQueueUST;
			RequestQueue.findOne({"where": {"requestId": data.requestId}}, function(err, reqQ){
				if (err) console.log(err);
				if (reqQ != null){
					var reqIdObj = {};
					reqIdObj.requestId = reqQ.requestId;
					reqIdObj.leaveUst = data.leaveUst;
					Request.cancelMatch(reqIdObj, function(err, reqObj){
						if (err) console.log(err);
						console.log("(Cancelled by server)");
					});
				}
			});
		}, (20+2)*1000);
		cb(null, "working");
	}

	Request.addRequestAgain = function(data, cb){
		Request.findById(data.requestId, function(err, req){
			if (err){
				console.log(err);
				cb(err, null);
			} else{
				if (req != null){
					var newReqObj = {};
					newReqObj.destination_name = req.destination_name;
					newReqObj.pickup_name = req.pickup_name;
					newReqObj.gender_preference = req.gender_preference;
					newReqObj.time = req.time;
					newReqObj.memberId = req.memberId;
					newReqObj.leaveUst = data.leaveUst;
					Request.addRequest(newReqObj, function(err, newReq){
						if (err){
							console.log(err);
							cb(err, null);
						} else{
							console.log("Request added again ", newReq);
							cb(null, newReq);
						}
					});
				} else{
					console.log("No such requestId");
					cb(null, null);
				}
			}
		});
	}

	Request.getQueueSeatNumber = function(data, cb){
		var ctx = loopback.getCurrentContext();
		var accessToken = ctx.get('accessToken');
		var currentUser = ctx && ctx.get('currentUser');
		var returnObj = {};
	
	// var Member = app.models.Member;
	// Member.findById(3, function(err, mem){
	// currentUser = mem;

		if (currentUser != null){
			var i = 0;
			var r = 4;
			var anyErr = false;
			var bDebug = true;
			if (bDebug) console.log("Testing memberId: ", currentUser.id);
			var RequestQueue = data.leaveUst? app.models.RequestQueue: app.models.RequestQueueUST;
			var requestQFilter = {
				"and": [
					{"status": "active"}
				]
			};
			var hhRFilter = JSON.parse(JSON.stringify(requestQFilter));
			hhRFilter.and.push(data.leaveUst? {"destination_name": "Hang Hau"}: {"pickup_name": "Hang Hau"});
			RequestQueue.count(hhRFilter, function(err, hhCount){
				if (err){
					console.log(err);
					anyErr = true;
					cb(err, null);
				} else{
					returnObj.hhCount = hhCount;
					if (bDebug) console.log("hhCount: ", hhCount);
					if (++i == r && !anyErr){
						cb(null, returnObj);
					}
				}
			});
			var chRFilter = JSON.parse(JSON.stringify(requestQFilter));
			chRFilter.and.push(data.leaveUst? {"destination_name": "Choi Hung"}: {"pickup_name": "Choi Hung"});
			RequestQueue.count(chRFilter , function(err, chCount){
				if (err){
					console.log(err);
					anyErr = true;
					cb(err, null);
				} else{
					returnObj.chCount = chCount;
					if (bDebug) console.log("chCount: ", chCount);
					if (++i == r && !anyErr){
						cb(null, returnObj);
					}
				}
			});
			var OfferQueue = data.leaveUst? app.models.OfferQueue: app.models.OfferQueueUST;
			var currTime = Date.now();
			var offerQFilter = {
				"where": {
					"and": [
						{"or": [
							{"and": [
								{"gender_preference": true}, 
								{"member_gender": currentUser.gender}
							]},
							{"gender_preference": false}
						]},
						{"is_full": false},
						{"time": {"gt": currTime + 60*1000}}
					]
				}
			};
			if (currentUser.gender_preference == true){
				offerQFilter.where.and.push({"member_gender": currentUser.gender});
			}
			var hhOFilter = JSON.parse(JSON.stringify(offerQFilter));
			hhOFilter.where.and.push(data.leaveUst? {"destination_name": "Hang Hau"}: {"pickup_name": "Hang Hau"});
			// console.log(JSON.stringify(hhOFilter));
			var hhSeatNum = 0;
			var j = 0;
			OfferQueue.find(hhOFilter, function(err, offerQs){
				if (err){
					console.log(err);
					anyErr = true;
					cb(err, null);
				} else{
					if (offerQs.length == 0){
						returnObj.hhSeatNum = hhSeatNum;
						if (bDebug) console.log("hhSeatNum: ", hhSeatNum);
						if (++i == r && !anyErr){
							cb(null, returnObj);
						}
					} else{
						offerQs.forEach(function(offerQ, index, array){
							OfferQueue.getAvalSeatNumber(offerQ, function(err, seatNum){
								if (err){
									console.log(err);
									anyErr = true;
								} else{
									hhSeatNum += seatNum;
									if (++j == array.length){
										returnObj.hhSeatNum = hhSeatNum;
										if (bDebug) console.log("hhSeatNum: ", hhSeatNum);
										if (++i == r && !anyErr){
											cb(null, returnObj);
										}
									}
								}
							});
						});
					}
				}
			});
			var chOFilter = JSON.parse(JSON.stringify(offerQFilter));
			chOFilter.where.and.push(data.leaveUst? {"destination_name": "Choi Hung"}: {"pickup_name": "Choi Hung"});
			// console.log(JSON.stringify(chOFilter));
			var chSeatNum = 0;
			var k = 0;
			OfferQueue.find(chOFilter, function(err, offerQs){
				if (err){
					console.log(err);
					anyErr = true;
					cb(err, null);
				} else{
					if (offerQs.length == 0){
						returnObj.chSeatNum = chSeatNum;
						if (bDebug) console.log("chSeatNum: ", chSeatNum);
						if (++i == r && !anyErr){
							cb(null, returnObj);
						}
					} else{
						offerQs.forEach(function(offerQ, index, array){
							OfferQueue.getAvalSeatNumber(offerQ, function(err, seatNum){
								if (err){
									console.log(err);
									anyErr = true;
								} else{
									chSeatNum += seatNum;
									if (++k == array.length){
										returnObj.chSeatNum = chSeatNum;
										if (bDebug) console.log("chSeatNum: ", chSeatNum);
										if (++i == r && !anyErr){
											cb(null, returnObj);
										}
									}
								}
							});
						});
					}
				}
			});

		} else{
			cb("Invalid Current User", null);
		}

	// });
		

	}

	Request.checkValid = function(data, cb){
		if (data != null && data.requestId != null){
			var Join = app.models.Join;
			Join.findOne({where: {requestId: data.requestId}}, function(err, join){
				if (err){
					console.log(err);
					cb(err, null);
				} else{
					var inJoin = (join!=null && join.status=="inProgress");
					if (inJoin){
						cb(null, true);
					} else{
						Request.findById(data.requestId, function(err, request){
							if (err){
								console.log(err);
								cb(err, null);
							} else{
								if (request != null && request.status == "active"){
									var RequestQueue = request.destination_name != "HKUST"? app.models.RequestQueue: app.models.RequestQueueUST;
									RequestQueue.findOne({requestId: data.requestId}, function(err, requestQ){
										if (err){
											console.log(err);
											cb(err, null);
										} else{
											cb(null, requestQ != null);
										}
									});
								} else{
									cb(null, false);
								}
							}
						});
					}
				}
			});
			
		} else{
			cb(null, false);
		}
	}

	Request.checkPending = function(data, cb){
		if (data != null && data.requestId != null && data.leaveUst != null){
			var PendingSeat = data.leaveUst? app.models.PendingSeat: app.models.PendingSeatUST;
			PendingSeat.findOne({"where": {"requestId": data.requestId}}, function(err, pendingS){
				if (err){
					console.log(err);
					cb(err, null);
				} else{
					if (pendingS != null){
						pendingS.ride(function(err, ride){
							if (err){
								console.log(err);
								cb(err, null);
							} else{
								ride.own(function(err, own){
									if (err){
										console.log(err);
										cb(err, null);
									} else{
										own.vehicle(function(err, vehicle){
											if (err){
												console.log(err);
												cb(err, null);
											} else{
												ride.license_number = vehicle.license_number;
												cb(null, ride);
											}
										});
									}
								});
							}
						});
					} else{
						cb(null, null);
					}
				}
			});
		}
	}

	Request.remoteMethod(
		'confirmMatch',
		{
			http: {path: '/confirmMatch', verb: 'post'},
			accepts: {arg: 'ride', type: 'object', http:{source:'body'}},
			returns: {arg: 'matchicon', type: 'number'}
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
			returns: {arg: 'req', type: 'obj'}
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

	Request.remoteMethod(
		'checkAutoCancel',
		{
			http: {path: '/checkAutoCancel', verb: 'post'},
			accepts: {arg: 'data', type: 'object', http:{source:'body'}},
			returns: {arg: 'status', type: 'string'}
		}
	);

	Request.remoteMethod(
		'addRequestAgain',
		{
			http: {path: '/addRequestAgain', verb: 'post'},
			accepts: {arg: 'data', type: 'object', http:{source:'body'}},
			returns: {arg: 'req', type: 'obj'}
		}
	);

	Request.remoteMethod(
		'getQueueSeatNumber',
		{
			http: {path: '/getQueueSeatNumber', verb: 'post'},
			accepts: {arg: 'data', type: 'object', http:{source:'body'}},
			returns: {arg: 'num', type: 'obj'}
		}
	);

	Request.remoteMethod(
		'checkValid',
		{
			http: {path: '/checkValid', verb: 'post'},
			accepts: {arg: 'data', type: 'object', http:{source:'body'}},
			returns: {arg: 'valid', type: 'boolean'}
		}
	);

	Request.remoteMethod(
		'checkPending',
		{
			http: {path: '/checkPending', verb: 'post'},
			accepts: {arg: 'data', type: 'object', http:{source:'body'}},
			returns: {arg: 'request', type: 'object'}
		}
	);
}
