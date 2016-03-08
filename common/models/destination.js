var path = require('path');
var app = require(path.resolve(__dirname, '../../server/server'));
var loopback = require('loopback');

module.exports = function(Destination) {

	// TODO: fix bug: go to hkust
	Destination.getDestination = function(oriDesName, cb){
		if (oriDesName == "Hang Hau" || oriDesName == "Choi Hung"){
			console.log(oriDesName);
			cb(null, oriDesName);
		} else{
			var OfferQueue = app.models.OfferQueue;
			var currTime = Date.now();
			OfferQueue.count({"destination_name": "Choi Hung", "is_full": false, "time": {"gt": currTime}}, function(err, ch_count){
				if (err){
					console.log(err);
					cb(err, null);
				} else{
					OfferQueue.count({"destination_name": "Hang Hau", "is_full": false, "time": {"gt": currTime}}, function(err, hh_count){
						if (err){
							console.log(err);
							cb(err, null);
						} else{
							if (ch_count > hh_count){
								console.log("Choi Hung [H:"+hh_count+"] [C:"+ch_count+"]");
								cb(null, "Choi Hung");
							} else if (hh_count > ch_count){
								console.log("Hang Hau [H:"+hh_count+"] [C:"+ch_count+"]");
								cb(null, "Hang Hau");
							} else{
								var newDesName = (new Date() % 2 == 0)? "Choi Hung": "Hang Hau";
								console.log("Random: "+newDesName+" [H:"+hh_count+"] [C:"+ch_count+"]");
								cb(null, newDesName);
							}
						}
					});
				}
			});
		}
	}

	Destination.remoteMethod('getDestination', {
		http: {path: '/getDestination', verb: 'post'},
		accepts: {arg: 'oriDesName', type: 'string', http: {source:'body'}},
		returns: {arg: 'newDesName', type: 'string'}
	});

};
