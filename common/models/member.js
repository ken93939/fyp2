var path = require('path');
var app = require(path.resolve(__dirname, '../../server/server'));
var loopback=require('loopback');
var config = require('../../server/config.json');
var bcrypt=require('bcryptjs');

module.exports = function(Member) {
	//firstname,last_name,phoneno,gender,genderpreference,authroized,isDriver,email,pw
	//email,phone,car.license_number
	Member.validationandregister=function(dataPoint,cb){
		try{
			var veh=app.models.Vehicle;
			//check conflict of email, phone number
			Member.findOne({where: {email:dataPoint.email}},function(err,memIns){
				console.log(memIns);
				if(err){
					console.log(err);
					cb(err,null);
				}
				else if(memIns==null){
					Member.findOne({where: {phone_number: dataPoint.phone_number}},function(err,mmIns){
						console.log(mmIns);
						if(err){
							console.log(err);
							cb(err,null);
						}
						else if(mmIns==null){
							var counter=0;
							var wrong=false;
							// if(dataPoint.car.length==0){
								// Member.register(dataPoint);
							cb(null,"success");
							// }
							// else{
							// 	dataPoint.car.forEach(function(ka,index,array){
							// 		veh.findOne({where: {license_number: ka.license_number}},function(err,vehIns){
							// 			console.log(vehIns);
							// 			if(err){
							// 				console.log(err);
							// 				cb(err,null);
							// 			}
							// 			else if(vehIns==null){
							// 				counter++;
							// 				if(counter==array.length && !wrong){
							// 					// Member.register(dataPoint);
							// 					cb(null,"success");
							// 				}
							// 				else if(counter==array.length && wrong){
							// 					cb(null,"fail");
							// 				}
							// 			}
							// 			else{
							// 				wrong=true;
							// 				counter++;
							// 				if(counter==array.length){
							// 					cb(null,"fail");
							// 				}
							// 			}
							// 		});
							// 	});
							// }

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
	Member.register=function(dataPoint,cb){
		try{
			dataPoint.created = new Date();
			if(dataPoint.isDriver=="yes"){		//good to go
				var veh=app.models.Vehicle;
				var data={
					"id": 0
				};
				var counter=0;
				Member.create(dataPoint,function(err,user){
					//TODO: error handling
					if(err)
						console.log(err);
					console.log(dataPoint.car);

					dataPoint.car.forEach(function(ka,index,array){
						veh.findOne({where: {license_number: ka.license_number}}, function(err,vehModel){
							if(err){
								console.log(err);
								cb(err,null);
							}
							if(vehModel==null){
								// user.owns.create(data, function(err,own){
								// 	if(err)
								// 		console.log(err);
								// 	own.vehicles.create(ka,function(err,vehicle){
								// 		if(err)
								// 			console.log(err);
								// 	});
								// });
								console.log(ka);
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
							}
							else{
								vehModel.owns.create(ka,function(err,own){
									if(err){
										console.log(err);
									}
									own.updateAttribute("memberId", user.id, function(err,fown){
										if(err)
											console.log(err);
										counter++;
										if(counter==array.length){
											cb(null,user);
										}
									});
								});
							}
						});
					});
				});

			}
			else{
				Member.create(dataPoint,function(err,user){
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
					to: mem.email, //"kenkwoktszting@gmail.com",
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

	//email
	//admin email

	Member.sendEmailNonUST=function(dataPoint){
		var emailModel=app.models.Email;
		var emailTemplate=app.models.emailTemplate;
		//send to the person who wants to register an account
		emailTemplate.getEmailTemplate(function(err,text){
			if(err){
				console.log(err);
			}
			else{
				emailModel.send({
					to: "kenkwoktszting@gmail.com",
					from: "hkustfyp2016@gmail.com",
					subject: 'Thank you for your registration',
					text: text
					
				},function(err,mail){
					if(err){
						console.log(err);
						// cb(err,null);
					}
					else{
						console.log('email sent');
						// cb(null,"ok");
					}
				});
			}
		});

	}

	Member.registerNonUST=function(dataPoint,cb){
		try{
			dataPoint.created = new Date();
			if(dataPoint.isDriver=="yes"){		//good to go
				var veh=app.models.Vehicle;
				var data={
					"id": 0
				};
				var counter=0;
				Member.create(dataPoint,function(err,user){
					//TODO: error handling
					if(err)
						console.log(err);
					console.log(dataPoint.car);

					dataPoint.car.forEach(function(ka,index,array){
						veh.findOne({where: {license_number: ka.license_number}}, function(err,vehModel){
							if(err){
								console.log(err);
								cb(err,null);
							}
							if(vehModel==null){
								// user.owns.create(data, function(err,own){
								// 	if(err)
								// 		console.log(err);
								// 	own.vehicles.create(ka,function(err,vehicle){
								// 		if(err)
								// 			console.log(err);
								// 	});
								// });
								console.log(ka);
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
												Member.sendEmailNonUST(dataPoint);
												cb(null,user);
											}
										})
									});
								});								
							}
							else{
								vehModel.owns.create(ka,function(err,own){
									if(err){
										console.log(err);
									}
									own.updateAttribute("memberId", user.id, function(err,fown){
										if(err)
											console.log(err);
										counter++;
										if(counter==array.length){
											Member.sendEmailNonUST(dataPoint);
											cb(null,user);
										}
									});
								});
							}
						});
					});
				});

			}
			else{
				Member.create(dataPoint,function(err,user){
					if(err)
						console.log(err);
					Member.sendEmailNonUST(dataPoint);
					cb(null,user);
				});
			}
		}
		catch(err){
			console.log(err);
			cb(err,"fk");
		}
	}

	Member.resetPw=function(dataPoint,cb){
		try{
			console.log(dataPoint.email);
			var mail={ email: dataPoint.email};
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

	Member.updateToken=function(dataPoint,cb){
		try{
			var ctx=loopback.getCurrentContext();
			var currentUser = ctx && ctx.get('currentUser');
			console.log(dataPoint.deviceToken);
			currentUser.updateAttribute("deviceToken",dataPoint.deviceToken,function(err,user){
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

	//flag 1=+ 2=change 3=delete
	/*
		{
			license_number: "??"
			.......
		}
	*/
	Member.updateVehicle=function(dataPoint,cb){
		var ctx=loopback.getCurrentContext();
		var currentUser = ctx && ctx.get('currentUser');
		var identifier=0;
		if(currentUser!=null){
			identifier=currentUser.id;
		}
		else{
			identifier=dataPoint.id;
		}
		var veh=app.models.Vehicle;
		var ownModel=app.models.Own;
		var okay="ok";

		if(dataPoint.flag==1){
			veh.findOne({where : {license_number: dataPoint.car.license_number}}, function(err,vehModel){
				if(err){
					console.log(err);
					cb(err,null);
				}
				//new car
				else if(vehModel==null){
					veh.create(dataPoint.car,function(err,createdVeh){
						if(err){
							console.log(err);
							cb(err,null);
						}
						else{
							createdVeh.owns.create({}, function(err,createdOwn){
								if(err){
									console.log(err);
									cb(err,null);
								}
								else{
									createdOwn.updateAttribute("memberId", currentUser.id, function(err,updatedOwn){
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
				//existing car new own
				else{
					vehModel.owns.create({},function(err,createdOwn){
						if(err){
							console.log(err);
							cb(err,null);
						}
						else{
							createdOwn.updateAttribute("memberId",currentUser.id,function(err,updatedOwn){
								if(err){
									console.log(err);
									cb(err,null);
								}
								else{
									okay=vehModel.id;
									cb(null,okay);
								}
							});
						}
					});
				}
			});
		}
		//change
		else if(dataPoint.flag==2){
			veh.findOne({where: {license_number: dataPoint.car.license_number}}, function(err,vehModel){
				if(err){
					console.log(err);
					cb(err,null);
				}
				else{
					vehModel.updateAttributes(dataPoint.car,function(err,updatedVeh){
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
		else{
			veh.findOne({where: {license_number: dataPoint.car.license_number}},function(err,vehModel){
				if(err){
					console.log(err);
					cb(err,null);
				}
				else{
					vehModel.owns({},function(err,allOwns){
						if(err){
							console.log(err);
							cb(err,null);
						}
						else{
							var counter=0;
							if(allOwns.length==1){
								veh.destroyById(vehModel.id,function(err){
									if(err){
										console.log(err);
										cb(err,null);
									}
								});
							}

							allOwns.forEach(function(ownIns){
								if(ownIns.memberId==identifier){
									ownIns.rides({},function(err,allRides){
										var counterForRide=0;
										if(err){
											console.log(err);
											cb(err,null);
										}
										else{
											if(allRides.length==0){
												ownModel.destroyById(ownIns.id,function(err){
													if(err){
														console.log(err);
													}
													else{
														cb(null,okay);
													}
												});
											}
											else{
												allRides.forEach(function(rideObj){
													rideObj.updateAttribute("ownId",null,function(err,updatedRide){
														counterForRide++;
														if(err){
															console.log(err);
															cb(err,null);
														}
														else{
															if(counterForRide==allRides.length){
																ownModel.destroyById(ownIns.id,function(err){
																	if(err){
																		console.log(err);
																	}
																	else{
																		cb(null,okay);
																	}
																})
															}
														}
													});
												});
											}					
										}
									});
								}
							});
						}
					});
				}
			});
		}
	}

	// Member.updateVehicle=function(carArr,cb){
	// 	try{
	// 		var ctx=loopback.getCurrentContext();
	// 		var currentUser = ctx && ctx.get('currentUser');
	// 		var veh=app.models.Vehicle;
	// 		var ownModel=app.models.Own;
	// 		var okay="ok";
	// 		console.log(carArr);
	// 		console.log(carArr.length);
	// 		var counter=0;

	// 		currentUser.owns({},function(err,ownIns){
	// 			ownIns.forEach(function(ownObj,index,ownArr){
	// 				ownObj.vehicle(function(err,ownVeh){
	// 					var equal=false;
	// 					var count=0;	//counter for carArr
	// 					if(err){
	// 						console.log(err);
	// 						//cb(err,null);
	// 					}
	// 					else{
	// 						//+ - change
	// 						//- = ownIns yes carArr no
	// 						//change
	// 						//must be delete
	// 						if(carArr.length==0){

	// 							veh.findById(Number(ownVeh.id),{},function(err,foundVeh){
	// 								console.log(foundVeh);
	// 								var counterForRide=0;
	// 								if(err){
	// 									console.log(err);														
	// 								}
	// 								else{
	// 									foundVeh.owns(function(err,allOwns){
	// 										if(err)
	// 											console.log(err)
	// 										else{
	// 											allOwns.forEach(function(idkOwns){
	// 												idkOwns.rides({},function(err,rideIns){
	// 													rideIns.forEach(function(rideObj,index,rideArray){
	// 														counterForRide++;
	// 														rideObj.updateAttribute("ownId",null,function(err,updatedRide){
	// 															if(err)
	// 																console.log(err)
	// 															else{
	// 																if(counterForRide==rideArray.length){
	// 																	counter++;
	// 																	if(counter==carArr.length){
	// 																		cb(null,okay);
	// 																	}
	// 																}
	// 															}
	// 														});
	// 													});

	// 													ownModel.destroyById(idkOwns.id,function(err){
	// 														if(err){
	// 															console.log(err);
	// 															cb(err,null);
	// 														}
	// 													});

	// 													veh.destroyById(foundVeh.id,function(err){
	// 														if(err){
	// 															console.log(err);
	// 															cb(err,null);
	// 														}
	// 													})
	// 												});
	// 											});
	// 										}
	// 									});													
	// 								}

	// 							});	
	// 						}
	// 						else{
	// 							carArr.forEach(function(ka){
	// 								count++;
	// 								// console.log(ka.id);
	// 								if(ka.id==ownVeh.id){
	// 									equal=true;												
	// 									ownVeh.updateAttributes(ka,function(err,updatedIns){
	// 										counter++;
	// 										if(counter==carArr.length){
	// 											cb(null,okay);
	// 										}
	// 									});
	// 								}
	// 								//cant find the instance =>delete
	// 								// make the ownid associated with that vehicle of the ride null
	// 								else if(count==carArr.length && !equal){
	// 									if(ka.id!=null){
	// 										var counterForRide=0;
	// 										console.log(ka.id);
	// 										veh.findById(Number(ownVeh.id),{},function(err,foundVeh){
	// 											if(err){
	// 												console.log(err);														
	// 											}

	// 											else{
	// 												foundVeh.owns(function(err,allOwns){
	// 													if(err)
	// 														console.log(err)
	// 													else{
	// 														allOwns.forEach(function(idkOwns){
	// 															idkOwns.rides({},function(err,rideIns){
	// 																rideIns.forEach(function(rideObj,index,rideArray){
	// 																	counterForRide++;
	// 																	rideObj.updateAttribute("ownId",null,function(err,updatedRide){
	// 																		if(err)
	// 																			console.log(err)
	// 																		else{
	// 																			if(counterForRide==rideArray.length){
	// 																				counter++;
	// 																				if(counter==carArr.length){
	// 																					cb(null,okay);
	// 																				}
	// 																			}
	// 																		}
	// 																	});
	// 																});

	// 																ownModel.destroyById(idkOwns.id,function(err){
	// 																	if(err){
	// 																		console.log(err);
	// 																		cb(err,null);
	// 																	}
	// 																});

	// 																veh.destroyById(foundVeh.id,function(err){
	// 																	if(err){
	// 																		console.log(err);
	// 																		cb(err,null);
	// 																	}
	// 																})
	// 															});
	// 														});
	// 													}
	// 												});													
	// 											}

	// 										});													
	// 									}
	// 								}
	// 							});	
	// 						}
	// 					}
	// 				});
	// 			});
	// 			//+
	// 			carArr.forEach(function(kakaka, index,car_array){
	// 				if(kakaka.id==null){
	// 					veh.create(kakaka,function(err,vehIns){
	// 						if(err){
	// 							console.log(err)
	// 						}
	// 						else{
	// 							vehIns.owns.create({},function(err,vehOwnIns){
	// 								if(err)
	// 									console.log(err)
	// 								else{
	// 									vehOwnIns.updateAttribute("memberId",currentUser.id,function(err,updatedVehOwnIns){
	// 										if(err)
	// 											console.log(err)
	// 										else{
	// 											counter++;
	// 											okay=vehIns.id;
	// 											if(counter==carArr.length){
	// 												cb(null,okay);
	// 											}
	// 										}
	// 									});
	// 								}

	// 							});
	// 						}
	// 					});
	// 				}
	// 			});
	// 		});


	// 	}
	// 	catch(err){
	// 		console.log(err);
	// 		cb(err,null);
	// 	}

	// }

	Member.updatePw=function(dataPoint,cb){
		try{
			var ctx=loopback.getCurrentContext();
			var currentUser = ctx && ctx.get('currentUser');
			console.log(currentUser.password);
			console.log(dataPoint.oldpassword);
			// console.log(bcrypt.compareSync("123456",currentUser.password));

			if(bcrypt.compareSync(dataPoint.oldpassword,currentUser.password)){
				currentUser.updateAttribute("password",dataPoint.newpassword,function(err,user){
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

	Member.adminDisplay=function(cb){
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

	Member.adminChange=function(dataPoint,cb){
		Member.findById(dataPoint.id,{},function(err,instance){
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


	Member.clientValidateVehicle=function(dataPoint,cb){
		// var veh=app.models.Vehicle;
		// var counter=0;
		// var wrong=false;
		// //find the car if yes=>ok
		// //if no fail (?)
		// if(dataPoint.length!=0){
		// 	dataPoint.forEach(function(kaka,index,array){
		// 		// console.log(kaka.id);
		// 		if(kaka.id!=null){
		// 			veh.findOne({where: {license_number: kaka.license_number}},function(err,returnedIns){
		// 				if(err){
		// 					console.log(err);
		// 					cb(err,null);
		// 				}
		// 				else if(returnedIns!=null){
		// 					// console.log(returnedIns);
		// 					counter++;
		// 					if(counter==array.length){
		// 						if(!wrong){
		// 							console.log("validateok");
		// 							cb(null,"ok");
		// 						}
		// 						else{
		// 							cb(null,"fail");
		// 						}
		// 					}
		// 				}
		// 				else {
		// 					console.log("wrong");
		// 					wrong=true;
		// 					counter++;
		// 					if(counter==array.length){
		// 						cb(null,"fail");
		// 					}
		// 				}
		// 			});
		// 		}
		// 		else{
		// 			veh.findOne({where: {license_number: kaka.license_number}},function(err,returnedIns){
		// 				if(err){
		// 					console.log(err);
		// 					cb(err,null);
		// 				}
		// 				else if(returnedIns==null){
		// 					counter++;
		// 					if(counter==array.length){
		// 						if(!wrong){
		// 							console.log("ok");
		// 							cb(null,"ok");
		// 						}
		// 						else{
		// 							cb(null,"fail");
		// 						}
		// 					}
		// 				}
		// 				else{
		// 					wrong=true;
		// 					counter++;
		// 					console.log("exisitng instance");
		// 					// console.log(returnedIns);
		// 					if(counter==array.length){
		// 						cb(null,"fail");
		// 					}
		// 				}
		// 			});
		// 		}
		// 	});
		// }
		// else{
		// 	cb(null,"ok");
		// }
	}

	//provide member id, vehicle
	/*	{
		"memberId":_,
		"car":{
			[0]:{
	
			}
		}
	}
	*/	
	// Member.ValidateVehicle=function(dataPoint,cb){
	// 	var veh=app.models.Vehicle;
	// 	var counter=0;
	// 	var wrong=false;
	// 	dataPoint.forEach(function(kaka,index,array){
	// 		veh.findOne({where: {license_number: kaka.license_number}},function(err,vehIns){
	// 			if(err){
	// 				console.log(err);
	// 				cb(err,null);
	// 			}
	// 			else{
	// 				counter++;
	// 				if(vehIns==null){
	// 					if(counter==array.length){
	// 						if(!wrong){
	// 							// Member.findById(dataPoint.memberId,{},function(err,Ins){
	// 							// });
	// 							cb(null,"ok");
	// 						}
	// 						else{
	// 							console.log("fail");
	// 							cb(null,"fail");
	// 						}
	// 					}
	// 				}
	// 				else{
	// 					wrong=true;
	// 					if(counter==array.length){
	// 						console.log("fail");
	// 						cb(null,"fail");
	// 					}
	// 				}
	// 			}
	// 		});
	// 	});
	// }


	//TODO: call validate and create
	//provide member id, vehicle
	/*	{
		"memberId":_,
		"car":{
			"license_number": "dataPoint"
		}
	}
	*/
	//for edit and delete call updateVehicle();
	Member.adminAddVehicle=function(dataPoint,cb){
		var veh=app.models.Vehicle;
		var okay="ok";
		Member.findById(dataPoint.memberId,function(err,memIns){
			if(err){
				console.log(err);
				cb(err,null);
			}
			else{
				veh.findOne({where: {license_number: dataPoint.car.license_number}},function(err,vehIns){
					if(err){
						console.log(err);
						cb(err,null);
					}
					//create a new car
					else if(vehIns==null){
						veh.create(dataPoint.car,function(err,createdVeh){
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

	Member.adminViewVehicle=function(dataPoint,cb){
		var array=[];
		Member.findById(dataPoint.id,function(err,memIns){
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
	Member.adminMassImport=function(dataPoint,cb){

	}

	Member.setGenderPreference=function(dataPoint,cb){
		var ctx=loopback.getCurrentContext();
		var currentUser = ctx && ctx.get('currentUser');
		currentUser.updateAttribute("gender_preference",dataPoint.gender_preference,function(err,updatedIns){
			if(err){
				console.log(err);
				cb(err, null);
			} else{
				cb(null,"ok");
			}
		});	
	}

	Member.getGenderPreference=function(cb){
		var ctx=loopback.getCurrentContext();
		var currentUser = ctx && ctx.get('currentUser');
		cb(null,currentUser.gender_preference);
	}

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
		'clientValidateVehicle',
		{
			http: {path: '/clientValidateVehicle', verb: 'post'},
			accepts: {arg: 'well', type: 'object', http:{source:'body'}},
			returns: {arg: 'status', type: 'string'}			
		}
	);

	Member.remoteMethod(
		'adminDisplay',
		{
			http: {path: '/adminDisplay', verb: 'get'},
			returns: {arg: 'status', type: 'object'}			
		}
	);

	Member.remoteMethod(
		'adminChange',
		{
			http: {path: '/adminDisplay', verb: 'post'},
			accepts: {arg: 'well', type: 'object', http:{source:'body'}},
			returns: {arg: 'status', type: 'string'}			
		}
	);

	Member.remoteMethod(
		'adminAddVehicle',
		{
			http: {path: '/adminAddVehicle', verb: 'post'},
			accepts: {arg: 'well', type: 'object', http:{source:'body'}},
			returns: {arg: 'status', type: 'string'}			
		}
	);

	Member.remoteMethod(
		'adminViewVehicle',
		{
			http: {path: '/adminViewVehicle', verb: 'post'},
			accepts: {arg: 'well', type: 'object', http:{source:'body'}},
			returns: {arg: 'status', type: 'object'}			
		}
	);

	// Member.remoteMethod(
	// 	'ValidateVehicle',
	// 	{
	// 		http: {path: '/ValidateVehicle', verb: 'post'},
	// 		accepts: {arg: 'well', type: 'object', http:{source:'body'}},
	// 		returns: {arg: 'status', type: 'string'}			
	// 	}
	// );

	Member.remoteMethod(
		'adminMassImport',
		{
			http: {path: '/adminMassImport', verb: 'post'},
			accepts: {arg: 'well', type: 'object', http:{source:'body'}},
			returns: {arg: 'status', type: 'string'}			
		}
	);

	Member.remoteMethod(
		'getGenderPreference',
		{
			http: {path: '/getGenderPreference', verb: 'get'},
			returns: {arg: 'status', type: 'boolean'}			
		}
	);

	Member.remoteMethod(
		'setGenderPreference',
		{
			http: {path: '/setGenderPreference', verb: 'post'},
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

	Member.remoteMethod(
		'registerNonUST',
		{
			http: {path: '/registerNonUST', verb: 'post'},
			accepts: {arg: 'well', type: 'object', http:{source:'body'}},
			returns: {arg: 'status', type: 'object'}
		}
	);

};
