var path = require('path');
var app = require(path.resolve(__dirname, '../../server/server'));
var loopback=require('loopback');
var config = require('../../server/config.json');
var bcrypt=require('bcryptjs');

module.exports = function(Member) {
	//firstname,last_name,phoneno,gender,genderpreference,authroized,isDriver,email,pw,car
	//email,phone,car.license_number
	Member.validationandregister=function(idk,cb){
		try{
			var veh=app.models.Vehicle;
			//check conflict of email, phone number and car
			Member.findOne({where: {email:idk.email}},function(err,memIns){
				console.log(memIns);
				if(err){
					console.log(err);
					cb(err,null);
				}
				else if(memIns==null){
					Member.findOne({where: {phone_number: idk.phone_number}},function(err,mmIns){
						console.log(mmIns);
						if(err){
							console.log(err);
							cb(err,null);
						}
						else if(mmIns==null){
							var counter=0;
							idk.car.forEach(function(ka,index,array){
								veh.findOne({where: {license_number: ka.license_number}},function(err,vehIns){
									console.log(vehIns);
									if(err){
										console.log(err);
										cb(err,null);
									}
									else if(vehIns==null){
										counter++;
										if(counter==array.length){
											Member.register(idk,cb);
											cb(null,"success");
										}
									}
									else{
										if(counter==array.length){
											cb(null,"fail");
										}
									}
								});
							});
						}
						else{
							cb(null,"fail");
						}
					})
				}
				else{
					cb(null,"fail");
				}
			});
		}
		catch(err){
			console.log(err);
			cb(err,null);
		}
	}

	//TODO: possible debt
	Member.register=function(idk,cb){
		try{
			if(idk.isDriver=="yes"){		//good to go
				var veh=app.models.Vehicle;
				var data={
					"id": 0
				};
				var counter=0;
				Member.create(idk,function(err,user){
					//TODO: error handling
					if(err)
						console.log(err);
					idk.car.forEach(function(ka,index,array){
						// user.owns.create(data, function(err,own){
						// 	if(err)
						// 		console.log(err);
						// 	own.vehicles.create(ka,function(err,vehicle){
						// 		if(err)
						// 			console.log(err);
						// 	});
						// });
						veh.create(ka,function(err,vehicle){
							if(err)
								console.log(err);
							vehicle.owns.create(ka, function(err,own){
								if(err)
									console.log(err);
								own.updateAttribute("memberId",user.id,function(err,fown){
									if(err)
										console.log(err);
									counter++;
									if(counter==array.length){
										cb(null,user);
									}
								})
							});
						});
					});
				});

			}
			else{
				Member.create(idk,function(err,user){
					if(err)
						console.log(err);
					cb(null,user);
				});
			}
		}
		catch(err){
			console.log(err);
			cb(err,"fk");
		}
	}

	Member.afterRemote('register',function(ctx,obj,next){
		try{
			console.log('> user.afterRemote triggered');

			Member.findById(obj.status.id,function(err,mem){
				if(err)
					console.log(err);
				var options = {
					type: 'email',
					to: "kenkwoktszting@gmail.com",
					from: 'hkustfyp2016@gmail.com',
					subject: 'Thanks for registering.',
					user: mem,
					template: path.resolve(__dirname, '../../server/views/verify.ejs'),
					redirect: '/verified'	//TODO:change it
				};
				console.log(mem);
				mem.verify(options, function(err, response, next) {
					if (err){
						console.log(err);
						if(next!=null)
							return next(err);
					}
					console.log('> verification email sent:', response);
				});	
			})	//TODO: callback?
			next();
		}
		catch(err){
			console.log(err);
		}
	});

	Member.resetPw=function(idk,cb){
		try{
			console.log(idk.email);
			var mail={ email: idk.email};
			Member.resetPassword(mail,function(err){
				console.log("test");
				if(err){
					console.log(err);
					cb(err,null);
				}
				cb(null,"Success");
			});
		}
		catch(err){
			console.log(err);
			cb(err,null);
		}
	};

	Member.on('resetPasswordRequest', function(info){
		try{
			var url='http://' + config.host + ':' + config.port + '/reset-password';
			var html = 'Click <a href="' + url + '?access_token=' +
			info.accessToken.id + '">here</a> to reset your password';
			app.models.Email.send({
				to: "kenkwoktszting@gmail.com",
				subject: "Password reset",
				html: html
			}, function(err){
				if (err) return console.log('> error sending password reset email');
				console.log('> sending password reset email to:', info.email);
			});
		}
		catch(err){
			console.log(err);
		}
	});

	Member.updateToken=function(idk,cb){
		try{
			var ctx=loopback.getCurrentContext();
			var currentUser = ctx && ctx.get('currentUser');
			console.log(idk.deviceToken);
			currentUser.updateAttribute("deviceToken",idk.deviceToken,function(err,user){
				if(err){
					console.log(err);
					cb(err,null);
				}
				// console.log(user);
				cb(null,user);
			});
		}
		catch(err){
			console.log(err);
			cb(err,null);
		}
	}
	//updateVehicle is a big problem
	//try to do it later
	Member.updateVehicle=function(idk,cb){
		try{
			var ctx=loopback.getCurrentContext();
			var currentUser = ctx && ctx.get('currentUser');
			currentUser.updateAttribute("deviceToken",idk.deviceToken,function(err,user){
				if(err){
					console.log(err);
					cb(err,null);
				}
				// console.log(user);
				cb(null,user);
			});
		}
		catch(err){
			console.log(err);
			cb(err,null);
		}

	}

	Member.updatePw=function(idk,cb){
		try{
			var ctx=loopback.getCurrentContext();
			var currentUser = ctx && ctx.get('currentUser');
			console.log(currentUser.password);
			console.log(idk.oldpassword);
			// console.log(bcrypt.compareSync("123456",currentUser.password));

			if(bcrypt.compareSync(idk.oldpassword,currentUser.password)){
				currentUser.updateAttribute("password",idk.newpassword,function(err,user){
					if(err){
						console.log(err);
						cb(err,null);
					}
					// console.log(user);
					cb(null,"success");
				});
			}
			else{
				cb(null,"fail")
			}
		}
		catch(err){
			console.log(err);
			cb(err,null);
		}
	};

	Member.remoteMethod(
		'validationandregister',
		{
			http: {path: '/validationandregister', verb: 'post'},
			accepts: {arg: 'well', type: 'object', http:{source:'body'}},
			returns: {arg: 'status', type: 'string'}
		}
	);

	Member.remoteMethod(
		'updateVehicle',
		{
			http: {path: '/updateVehicle', verb: 'post'},
			accepts: {arg: 'well', type: 'object', http:{source:'body'}},
			returns: {arg: 'status', type: 'string'}			
		}
	);

	Member.remoteMethod(
		'updatePw',
		{
			http: {path: '/updatePw', verb: 'post'},
			accepts: {arg: 'well', type: 'object', http:{source:'body'}},
			returns: {arg: 'status', type: 'string'}			
		}
	);

	Member.remoteMethod(
		'updateToken',
		{
			http: {path: '/updateToken', verb: 'post'},
			accepts: {arg: 'well', type: 'object', http:{source:'body'}},
			returns: {arg: 'status', type: 'object'}			
		}
	);


	Member.remoteMethod(
		'resetPw',
		{
			http: {path: '/resetPw', verb: 'post'},
			accepts: {arg: 'well', type: 'object', http:{source:'body'}},
			returns: {arg: 'status', type: 'string'}			
		}
	);

	Member.remoteMethod(
		'register',
		{
			http: {path: '/register', verb: 'post'},
			accepts: {arg: 'well', type: 'object', http:{source:'body'}},
			returns: {arg: 'status', type: 'object'}
		}
	);

};
