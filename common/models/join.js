var path = require('path');
var app = require(path.resolve(__dirname, '../../server/server'));
var loopback = require('loopback');

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
									cb(null, join);
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

	Join.remoteMethod('addJoin', {
		http: {path: '/addJoin', verb: 'post'},
		accepts: {arg: 'data', type: 'object', http: {source:'body'}},
		returns: {arg: 'join', type: 'object'}
	});

};
