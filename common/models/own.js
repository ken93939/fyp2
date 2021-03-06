var path = require('path');
var app = require(path.resolve(__dirname, '../../server/server'));
var loopback=require('loopback');

module.exports = function(Own) {
	Own.getVehicle=function(cb){
		try{
			var ctx=loopback.getCurrentContext();
			// console.log(ctx);
			var accessToken=ctx.get('accessToken');
			// console.log(accessToken);
			var currentUser = ctx && ctx.get('currentUser');
			// console.log('currentUser.username: ', currentUser);

			var veh_array=[];

			Own.find({where: {"memberId": currentUser.id}},function(err,owns){
				if(err)
					console.log(err)
				console.log(owns);
				if(owns.length==0){
					console.log("lol");
					cb(null,veh_array);
				}
				owns.forEach(function(eachown,index,array){
					console.log(currentUser.id);
					console.log(eachown);

					eachown.vehicle(function(err,veh){
						if(err)
							console.log(err);
						console.log(veh.license_number);
						veh_array.push(veh.license_number);
						// if(index==array.length-1){
						// 	cb(null,veh_array);
						// }

						if(veh_array.length==array.length){
							cb(null,veh_array);
						}
					});	
				});
			});
		}
		catch(err){
			console.log(err);
			cb(null,{});
		}
	}

	Own.remoteMethod(
		'getVehicle',
		{
			http: {path: '/getVehicle', verb: 'get'},
			returns: {arg: 'vehicle', type: 'object'}
		}
	);
};
