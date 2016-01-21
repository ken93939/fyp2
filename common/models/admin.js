var path = require('path');
var app = require(path.resolve(__dirname, '../../server/server'));
var loopback=require('loopback');
var config = require('../../server/config.json');
var bcrypt=require('bcryptjs');

module.exports = function(Admin) {

	Admin.adminDisplay=function(cb){
		var Member=app.models.Member;
		var array=[];
		Member.find({},function(err,models){
			if(err){
				console.log(err);
				cb(err,null);
			}
			else{
				var counter=0;
				var object={};
				models.forEach(function(mem,index,arr){
					object.id=mem.id;
					object.first_name=mem.first_name;
					object.last_name=mem.last_name;
					object.phone_number=mem.phone_number;
					object.gender=mem.gender;
					object.gender_preference=mem.gender_preference;
					object.isDriver=mem.isDriver;
					object.authroized=mem.authroized;
					object.email=mem.email;
					object.emailVerified=mem.emailVerified;
					array.push(object);
					if(index==arr.length){
						cb(null,array);
					}
				});
			}
		});
	}

	Admin.adminChange=function(idk,cb){
		var Member=app.models.Member;
		Member.findById(idk.id,{},function(err,instance){
			if(err){
				console.log(err);
				cb(err,null);
			}
			else if(instance==null){
				console.log("missing instance");
				cb("missing");
			}
			else{
				instance.updateAttributes(instance,function(err,updated){
					if(err){
						console.log(err);
						cb(err,null);
					}
					else{
						console.log(updated);
						cb(null,"ok");
					}
				});
			}
		});
	}
	Admin.adminAddVehicle=function(idk,cb){
		var Member=app.models.Member;
		var veh=app.models.Vehicle;
		var okay="ok";
		Member.findById(idk.memberId,function(err,memIns){
			if(err){
				console.log(err);
				cb(err,null);
			}
			else{
				veh.findOne({where: {license_number: idk.car.license_number}},function(err,vehIns){
					if(err){
						console.log(err);
						cb(err,null);
					}
					//create a new car
					else if(vehIns==null){
						veh.create(idk.car,function(err,createdVeh){
							if(err){
								console.log(err);
								cb(err,null);
							}
							else{
								createdVeh.owns.create({},function(err,createdOwn){
									if(err){
										console.log(err);
										cb(err,null);
									}
									else{
										createdOwn.updateAttribute("memberId",memIns.id,function(err,updatedOwn){
											if(err){
												console.log(err);
												cb(err,null);
											}
											else{
												okay=createdVeh.id;
												cb(null,okay);
											}
										});
									}
								});
							}
						});
					}
					//add a new owner
					else{
						vehIns.owns.create({},function(err,createdOwn){
							if(err){
								console.log(err);
								cb(err,null);
							}
							else{
								createdOwn.updateAttribute("memberId",memIns.id,function(err,updatedOwn){
									if(err){
										console.log(err);
										cb(err,null);
									}
									else{
										cb(null,okay);
									}
								});
							}
						});
					}
				});
			}
		});
	}

	/*
	{
		id:123
	}
	*/

	Admin.adminViewVehicle=function(idk,cb){
		var Member=app.models.Member;
		var array=[];
		Member.findById(idk.id,function(err,memIns){
			if(err){
				console.log(err);
				cb(err,null);
			}
			else{
				var counter=0;
				memIns.owns({},function(err,allOwns){
					allOwns.forEach(function(ownIns){
						ownIns.vehicle(function(err,vehIns){
							if(err){
								console.log(err);
								cb(err,null);
							}
							else{
								array.push(vehIns);
								if(counter==allOwns.length){
									cb(null,array);
								}
							}
						});
					});
				});
			}
		});
	}


	/*
	[
	{
		"phone"......
		"car":[
			{
				license_number:____
				.......
			}
		]
	},
	{
	
	}
	]
	*/
	Admin.adminMassImport=function(idk,cb){
		var Member=app.models.Member;

	}

	Admin.remoteMethod(
		'adminDisplay',
		{
			http: {path: '/adminDisplay', verb: 'get'},
			returns: {arg: 'status', type: 'object'}			
		}
	);

	Admin.remoteMethod(
		'adminChange',
		{
			http: {path: '/adminDisplay', verb: 'post'},
			accepts: {arg: 'well', type: 'object', http:{source:'body'}},
			returns: {arg: 'status', type: 'string'}			
		}
	);

	Admin.remoteMethod(
		'adminAddVehicle',
		{
			http: {path: '/adminAddVehicle', verb: 'post'},
			accepts: {arg: 'well', type: 'object', http:{source:'body'}},
			returns: {arg: 'status', type: 'string'}			
		}
	);

	Admin.remoteMethod(
		'adminViewVehicle',
		{
			http: {path: '/adminViewVehicle', verb: 'post'},
			accepts: {arg: 'well', type: 'object', http:{source:'body'}},
			returns: {arg: 'status', type: 'object'}			
		}
	);

	Admin.remoteMethod(
		'adminMassImport',
		{
			http: {path: '/adminMassImport', verb: 'post'},
			accepts: {arg: 'well', type: 'object', http:{source:'body'}},
			returns: {arg: 'status', type: 'string'}			
		}
	);
};
