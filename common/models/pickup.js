var path = require('path');
var app = require(path.resolve(__dirname, '../../server/server'));
var loopback = require('loopback');

module.exports = function(Pickup) {

	Pickup.getPickup = function(oriPuName, cb){
		if (oriPuName == "Hang Hau" || oriPuName == "Choi Hung"){
			console.log(oriPuName);
			cb(null, oriPuName);
		} else{
			var OfferQueueUST = app.models.OfferQueueUST;
			var currTime = Date.now();
			OfferQueueUST.count({"pickup_name": "Choi Hung", "is_full": false, "time": {"gt": currTime}}, function(err, ch_count){
				if (err){
					console.log(err);
					cb(err, null);
				} else{
					OfferQueueUST.count({"pickup_name": "Hang Hau", "is_full": false, "time": {"gt": currTime}}, function(err, hh_count){
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
								var newPuName = (new Date() % 2 == 0)? "Choi Hung": "Hang Hau";
								console.log("Random: "+newPuName+" [H:"+hh_count+"] [C:"+ch_count+"]");
								cb(null, newPuName);
							}
						}
					});
				}
			});
		}
	}

	Pickup.remoteMethod('getPickup', {
		http: {path: '/getPickup', verb: 'post'},
		accepts: {arg: 'oriPuName', type: 'string', http: {source:'body'}},
		returns: {arg: 'newPuName', type: 'string'}
	});

};
