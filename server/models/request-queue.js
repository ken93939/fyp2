var path = require('path');
var app = require(path.resolve(__dirname, '../../server/server'));
var loopback = require('loopback');

module.exports = function(RequestQueue) {

	RequestQueue.possibleRequest = function(offerQ, cb){
		// TODO: include !pending status in filter
		var requestQFilter = {
			"where": {
				"destination_name": offerQ.destination_name,
				"status": "active"
			}, 
			"order": "time ASC"
		};
		RequestQueue.findOne(requestQFilter, function(err, requestQ){
			if (err){
				console.log(err);
				cb(err, null);
			} else{
				if (requestQ != null){
					var PendingSeat = app.models.PendingSeat;
					var data = {};
					data.rideId = offerQ.rideId;
					data.requestId = requestQ.requestId;
					PendingSeat.addPending(data, function(err, pendingS){
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

	RequestQueue.removeRequest = function(data, cb){
		RequestQueue.findOne({"where": {"requestId": data.requestId}}, function(err, requestQ){
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

	RequestQueue.remoteMethod('possibleRequest', {
		http: {path: '/possibleRequest', verb: 'post'},
		accepts: {arg: 'offerQ', type: 'object', http: {source:'body'}},
		returns: {arg: 'requestQ', type: 'object'}
	});

	RequestQueue.remoteMethod('removeRequest', {
		http: {path: '/removeRequest', verb: 'post'},
		accepts: {arg: 'data', type: 'object', http: {source:'body'}},
		returns: {arg: 'requestQ', type: 'object'}
	});

};
