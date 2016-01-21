var path = require('path');
var app = require(path.resolve(__dirname, '../../server/server'));
var loopback = require('loopback');

module.exports = function(RequestQueueUST) {

	RequestQueueUST.possibleRequest = function(offerQ, cb){
		offerQ.member(function(err, mem){
			if (err){
				console.log(err);
				cb(err, null);
			} else{
				var requestQFilter = {
					"where": {
						"and": [
							{"pickup_name": offerQ.pickup_name},
							{"status": "active"},
							{"or": [
								{"and": [
									{"gender_preference": true}, 
									{"member_gender": mem.gender}
								]},
								{"gender_preference": false}
							]}
						]
					}, 
					"order": "time ASC"
				};
				if (offerQ.gender_preference == true){
					requestQFilter.where.and.push({"member_gender": mem.gender});
				}
				RequestQueueUST.findOne(requestQFilter, function(err, requestQ){
					if (err){
						console.log(err);
						cb(err, null);
					} else{
						if (requestQ != null){
							var PendingSeatUST = app.models.PendingSeatUST;
							var data = {};
							data.rideId = offerQ.rideId;
							data.requestId = requestQ.requestId;
							PendingSeatUST.addPending(data, function(err, pendingS){
								if (err){
									console.log(err);
									cb(err, null);
								} else{
									cb(null, requestQ);
								}
							});
						} else{
							cb(null, requestQ);
						}
					}
				});
			}
		});
	}

	RequestQueueUST.removeRequest = function(data, cb){
		RequestQueueUST.findOne({"where": {"requestId": data.requestId}}, function(err, requestQ){
			if (err){
				console.log(err);
				cb(err, null);
			} else{
				if (requestQ != null){
					requestQ.destroy(function(err){
						if (err){
							console.log(err);
							cb(err, null);
						} else{
							// set request status to inactive
							requestQ.request(function(err, request){
								if (err){
									console.log(err);
									cb(err, null);
								} else{
									request.updateAttributes({"status": "inactive"}, function(err, req){
										if (err){
											console.log(err);
											cb(err, null);
										} else{
											cb(null, requestQ);
										}
									});
								}
							});
						}
					});
				} else{
					cb(null, requestQ);
				}
			}
		});
	}

	RequestQueueUST.remoteMethod('possibleRequest', {
		http: {path: '/possibleRequest', verb: 'post'},
		accepts: {arg: 'offerQ', type: 'object', http: {source:'body'}},
		returns: {arg: 'requestQ', type: 'object'}
	});

	RequestQueueUST.remoteMethod('removeRequest', {
		http: {path: '/removeRequest', verb: 'post'},
		accepts: {arg: 'data', type: 'object', http: {source:'body'}},
		returns: {arg: 'requestQ', type: 'object'}
	});

};
