var path = require('path');
var app = require(path.resolve(__dirname, '../../server/server'));
var loopback = require('loopback');

module.exports = function(RequestQueue) {

	RequestQueue.setInactive = function(data, cb){
		// remove pendingSeat
		var PendingSeat = app.models.PendingSeat;
		PendingSeat.removePending(data, function(err, pendingS){
			if (err){
				console.log(err);
				cb(err, null);
			} else{
				// set requestQ inactive
				RequestQueue.findOne({"where": {"requestId": data.requestId}}, function(err, requestQ){
					if (err){
						console.log(err);
						cb(err, null);
					} else{
						if (requestQ != null){
							requestQ.updateAttributes({"status": "inactive"}, function(err, reqQ){
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

	RequestQueue.remoteMethod('setInactive', {
		http: {path: '/setInactive', verb: 'post'},
		accepts: {arg: 'data', type: 'object', http: {source:'body'}},
		returns: {arg: 'requestQ', type: 'object'}
	});

};
