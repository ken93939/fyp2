var path = require('path');
var app = require(path.resolve(__dirname, '../../server/server'));
var loopback = require('loopback');
var req=require('request');

module.exports = function(Join) {

	Join.addJoin = function(joinObj, cb){
		joinObj.time = new Date();
		Join.create(joinObj, function(err, join){
			if (err){
				console.log(err);
				cb(err, null);
			} else{
				var Request = app.models.Request;
				Request.findById(join.requestId, function(err, req){
					if (err){
						console.log(err);
						cb(err, null);
					} else{
						if (req != null){
							req.updateAttributes({"joinId": join.id}, function(err, req){
								if (err){
									console.log(err);
									cb(err, null);
								} else{
									console.log("Join created: ", join);
									// push matched number to driver
									Join.pushMatchedNumber({"rideId": join.rideId}, function(err, str){
										if(err){
											console.log(err);
											cb(err, null);
										} else{
											cb(null, join);
										}
									});
								}
							});
						} else{
							cb(null, req);
						}
					}
				});
			}
		});
	}

	Join.pushMatchedNumber = function(data, cb){
		try{
			var obj = {};
			var Member = app.models.Member;
			var Ride = app.models.Ride;
			Ride.findById(data.rideId, function(err, ride){
				if (err){
					console.log(err);
					cb(err, null);
				} else{
					if (ride != null){
						ride.member(function(err, mem){
							if (err){
								console.log(err);
								cb(err, null);
							} else{
								var filter = {
									"and": [
										{"rideId": data.rideId}, 
										{"status": "inProgress"}
									]
								};
								Join.count(filter, function(err, joinNum){
									if (err){
										console.log(err);
										cb(err, null);
									} else{
										console.log(data.rideId+": "+joinNum);
										obj["to"] = mem.deviceToken;
										obj["collapse_key"] = "numOfPassenger";
										obj["data"] = {
											"status": "A0",
											"joinNum": joinNum
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
													cb(err, null);
												} else{
													// console.log(res);
													console.log(res.statusCode, ((res.statusCode/100) | 0));
													if (((res.statusCode/100) | 0) == 2){
														cb(null, "OK");
													} else{
														Join.pushMatchedNumber(data, cb);
													}
												}
										});
									}
								});
							}
						});
					} else{
						cb(null, "Ride not found");
					}
				}
			});

		}
		catch (err){
			console.log(err);
		}

	}

	Join.remoteMethod('addJoin', {
		http: {path: '/addJoin', verb: 'post'},
		accepts: {arg: 'data', type: 'object', http: {source:'body'}},
		returns: {arg: 'join', type: 'object'}
	});

	Join.remoteMethod('pushMatchedNumber', {
		http: {path: '/pushMatchedNumber', verb: 'post'},
		accepts: {arg: 'data', type: 'object', http: {source:'body'}},
		returns: {arg: 'num', type: 'number'}
	});

};
