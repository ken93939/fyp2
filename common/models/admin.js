var path = require('path');
var app = require(path.resolve(__dirname, '../../server/server'));
var loopback=require('loopback');
var config = require('../../server/config.json');
var bcrypt=require('bcryptjs');
// var moment= require('moment');


module.exports = function(Admin) {

	Admin.updateEmailTemplate=function(dataPoint,cb){
		var emailTemplate=app.models.emailTemplate;
		Admin.checkValidAdmin(function(err,adminId){
			if(err){
				console.log(err);
				cb(err,null);
			}
			else if(adminId==0){
				console.log("admin not exist");
				cb(null,null);
			}
			else{
				console.log("!!");
				emailTemplate.updateEmailTemplate(dataPoint.text,function(err,returnedIns){
					if(err){
						console.log(err);
						cb(err,null);
					}
					else{
						cb(null,"ok");
					}
				})
			}
		})
	}

	Admin.adminDisplay=function(cb){
		var Member=app.models.Member;
		var array=[];
		Admin.checkValidAdmin(function(err,adminId){
			if(err){
				console.log(err);
				cb(err,null);
			}
			else if(adminId==0){
				console.log("admin not exist");
				cb(null,null);
			}
			else{
				console.log("!!");
				Member.find({},function(err,models){
					if(err){
						console.log(err);
						cb(err,null);
					}
					else{
						var counter=0;
						console.log("123");
						models.forEach(function(mem,index,arr){
							var object={};
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
							if(index==arr.length-1){
								cb(null,array);
							}
						});
					}
				});
			}
		});

		//test only
		// Admin.rideRequestBetween(1,8,{},function(err,object){
		// 	if(err){
		// 		console.log(err);
		// 		cb(err,null);
		// 	}
		// 	else{
		// 		cb(null,object);
		// 	}
		// })
	}

	//do I need to check phone number and email
	/*
	
	*/
	Admin.adminChange=function(dataPoint,cb){
		var Member=app.models.Member;
		Admin.checkValidAdmin(function(err,adminId){
			if(err){
				console.log(err);
				cb(err,null);
			}
			else if(adminId==0){
				console.log("admin not exist");
				cb(null,null);
			}
			else{
				Member.findOne({"where": {phone_number:dataPoint.phone_number}}, function(err,returnedIns){
					if(err){
						console.log(err);
						cb(err,null);
					}
					else if(returnedIns!=null && returnedIns.id!=dataPoint.id){
						console.log("repeated phone_number");
						cb(null,"fail");
					}
					else{
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
								instance.updateAttributes(dataPoint,function(err,updated){
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
				})
			}
		});
	}

	/*
	{
	memberId:1,
	car:{
		"license_number": dasd
		......
	}

	}
	*/
	Admin.adminAddVehicle=function(dataPoint,cb){
		var Member=app.models.Member;
		var veh=app.models.Vehicle;
		var okay="ok";
		Admin.checkValidAdmin(function(err,adminId){
			if(err){
				console.log(err);
				cb(err,null);
			}
			else if(adminId==0){
				console.log("admin not exist");
				cb(null,null);
			}
			else{
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
		})
	}

	/*
	{
		id:123
	}
	*/

	Admin.adminViewVehicle=function(dataPoint,cb){
		var Member=app.models.Member;
		var array=[];
		Admin.checkValidAdmin(function(err,adminId){
			if(err){
				console.log(err);
				cb(err,null);
			}
			else if(adminId==0){
				console.log("admin not exist");
				cb(null,null);
			}
			else{
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
										counter++;
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
		})
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
	Admin.adminMassImport=function(dataPoint,cb){
		var Member=app.models.Member;

	}

	Admin.adminDashBoard=function(cb){
		Admin.checkValidAdmin(function(err, adminId){
			if (err){
				console.log(err);
				cb(err, null);
			} else if (adminId == 0){
				console.log("admin not exist");
				cb(null, null);
			} else{
				var Dashboard = app.models.Dashboard;
				Dashboard.updateAllInfo(function(err, dashboard){
					if (err){
						console.log(err);
						cb(err, null);
					} else{
						cb(null, dashboard);
					}
				});
			}
		});
		// var Member=app.models.Member;
		// var request=app.models.request;
		// var Ride=app.models.Ride;
		// var Join=app.models.Join;
		// var object={};

		// Admin.checkValidAdmin(function(err,adminId){
		// 	if(err){
		// 		console.log(err);
		// 		cb(err,null);
		// 	}
		// 	else if(adminId==0){
		// 		console.log("admin not exist");
		// 		cb(null,null);
		// 	}
		// 	else{
		// 		var curTime=new Date();
		// 		console.log(moment().unix());
		// 		console.log(moment().format());
		// 		var today=new Date(curTime.getFullYear(),curTime.getMonth(),curTime.getDate());
		// 		console.log(today);
		// 		Member.count({created: {gte: today}},function(err,mem_count){
		// 			if(err){
		// 				console.log(err);
		// 				cb(err,null);
		// 			}
		// 			else{
		// 				object.memCount=mem_count;
		// 				Ride.count({time: {gte:today}},function(err,ride_count){
		// 					if(err){
		// 						console.log(err);
		// 						cb(err,null);
		// 					}
		// 					else{
		// 						object.rideCount=ride_count;
		// 						request.count({time: {gte: today}},function(err,request_count){
		// 							if(err){
		// 								console.log(err);
		// 								cb(err,null);
		// 							}
		// 							else{



		// 								object.requestCount=request_count;
		// 								Join.count({time: {gte: today}},function(err,join_count){
		// 									if(err){
		// 										console.log(err);
		// 										cb(err,null);
		// 									}
		// 									else{
		// 										object.joinCount=join_count;
		// 										//7-day stat
		// 										Admin.rideRequestBetween(1,8,object,function(err,object){
		// 											if(err){
		// 												console.log(err);
		// 												cb(err,null);
		// 											}
		// 											else{
		// 												Member.count({gender: "male"},function(err,men_count){
		// 													if(err){
		// 														console.log(err);
		// 														cb(err,null);
		// 													}
		// 													else{
		// 														object.maleCount=men_count;
		// 														Member.count({gender: "female"},function(err,women_count){
		// 															if(err){
		// 																console.log(err);
		// 																cb(err,null);
		// 															}
		// 															else{
		// 																object.femaleCount=women_count;
		// 																Member.count({isDriver: "yes"},function(err,driver_count){
		// 																	if(err){
		// 																		console.log(err);
		// 																		cb(err,null);
		// 																	}
		// 																	else{
		// 																		object.driverCount=driver_count;
		// 																		Member.count({isDriver: "no"}, function(err,nondriver_count){
		// 																			if(err){
		// 																				console.log(err);
		// 																				cb(err,null);
		// 																			}
		// 																			else{
		// 																				object.passengerCount=nondriver_count;
		// 																				cb(null,object);
		// 																			}
		// 																		});
		// 																	}
		// 																});
		// 															}
		// 														});
		// 													}
		// 												});
		// 											}
		// 										});
		// 									}
		// 									//7day separator


		// 								});
		// 							}
		// 						})
		// 					}
		// 				})
		// 			}
		// 		});
		// 	}
		// })
	}

	Admin.checkValidAdmin=function(cb){
		var ctx=loopback.getCurrentContext();
		var accessToken=ctx.get("accessToken");
		console.log(accessToken);
		if(accessToken==null){
			console.log("admin not exist");
			cb(null,0);
		}
		else{
			Admin.findById(accessToken.userId,function(err,adminIns){
				if(err){
					console.log(err);
					cb(err,null);
				}
				else if(adminIns==null){
					cb(null,0);
				}
				else{
					cb(null,adminIns.userId);
				}
			});
		}
	}

	//
	Admin.addMember=function(dataPoint,cb){
		var Member=app.models.Member;
		Admin.checkValidAdmin(function(err,adminId){
			if(err){
				console.log(err);
				cb(err,null);
			}
			else if(adminId==0){
				cb(null,null);
			}
			else{
				validateMember(dataPoint,function(err,status){
					if(err){
						console.log(err);
						cb(err,null);
					}
					else if(status=="fail"){
						console.log("verification failed");
						cb(null,"fail");
					}
					else{
						Member.create(dataPoint,function(err,createMem){
							if(err){
								console.log(err);
								cb(err,null);
							}
							else{
								cb(null,"okay");
							}
						})
					}
				});
			}
		});
	}

	Admin.rideRequestBetween=function(start,end,object,cb){
		var request=app.models.request;
		var Ride=app.models.Ride;
		if(start==end){
			// console.log(object);
			cb(null,object);
		}
		else{
			var curTime=new Date();
			var date=new Date(curTime.getFullYear(),curTime.getMonth(),curTime.getDate()-start);
			var upperDate=new Date(curTime.getFullYear(),curTime.getMonth(),curTime.getDate()-start+1);
			Ride.count({time: {between: [date,upperDate]}},function(err,betweenRideCount){
				if(err){
					console.log(err);
					cb(err,null);
				}
				else{
					object[date.getDate()+"between_rideCount"+upperDate.getDate()]=betweenRideCount;
					request.count({time: {between: [date,upperDate]}},function(err,betweenReqCount){
						if(err){
							console.log(err);
							cb(err,null);
						}
						else{
							object[date.getDate()+"between_requestCount"+upperDate.getDate()]=betweenReqCount;
							Admin.rideRequestBetween(start+1,end,object,cb);
						}
					});
				}
			});
		}

	}

	Admin.validateMember=function(dataPoint,cb){
		var Member=app.models.Member;
		Member.findOne({where: {email: dataPoint.email}},function(err,memIns){
			if(err){
				console.log(err);
				cb(err,null);
			}
			else if(memIns!=null){
				console.log("member already exists");
				cb(null,"fail");
			}
			else{
				Member.findOne({where: {phone_number: dataPoint.phone_number}},function(err,memIns2){
					if(err){
						console.log(err);
						cb(err,null);
					}
					else if(memIns2!=null){
						console.log("member already exists");
						cb(null,"fail");
					}
					else{
						cb(null,"okay");
					}
				})
			}
		});


	}

	Admin.adminGetRide = function(cb){
		var Ride = app.models.Ride;
		Ride.find({}, function(err, ride){
			if (err){
				console.log(err);
				cb(err, null);
			} else{
				var rides = [];
				Admin.getAllRideDetail(ride, 0, rides, function(err, rid){
					if (err){
						console.log(err);
						cb(err, null);
					} else{
						cb(null, rid);
					}
				});
			}
		});

	}

	Admin.getAllRideDetail = function(ride, index, rides, cb){
		if (index >= ride.length){
			cb(null, rides);
		} else{
			ride[index].member(function(err, mem){
				if (err){
					console.log(err);
					cb(err, null);
				} else{
					ride[index].user = mem.email;
					ride[index].own(function(err, own){
						if (err){
							console.log(err);
							cb(err, null);
						} else{
							own.vehicle(function(err, veh){
								if (err){
									console.log(err);
									cb(err, null);
								} else{
									ride[index].license_number = veh.license_number;
									rides.push(ride[index]);
									Admin.getAllRideDetail(ride, index+1, rides, cb);
								}
							})
						}
					});
				}
			});
		}
	}

	Admin.adminGetRequest = function(cb){
		var Request = app.models.Request;
		Request.find({}, function(err, request){
			if (err){
				console.log(err);
				cb(err, null);
			} else{
				var requests = [];
				Admin.getAllRequestDetail(request, 0, requests, function(err, req){
					if (err){
						console.log(err);
						cb(err, null);
					} else{
						cb(null, req);
					}
				});
			}
		});

	}

	Admin.getAllRequestDetail = function(request, index, requests, cb){
		if (index >= request.length){
			cb(null, requests);
		} else{
			request[index].member(function(err, mem){
				if (err){
					console.log(err);
					cb(err, null);
				} else{
					request[index].user = mem.email;
					requests.push(request[index]);
					Admin.getAllRequestDetail(request, index+1, requests, cb);
				}
			});
		}
	}

	Admin.remoteMethod(
		'addMember',
		{
			http: {path: '/addMember', verb: 'post'},
			accepts: {arg: 'well', type: 'object', http:{source:'body'}},
			returns: {arg: 'status', type: 'string'}			
		}
	);

	Admin.remoteMethod(
		'adminDashBoard',
		{
			http: {path: '/adminDashBoard', verb: 'get'},
			returns: {arg: 'status', type: 'object'}			
		}
	);

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
			http: {path: '/adminChange', verb: 'post'},
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

	Admin.remoteMethod(
		'updateEmailTemplate',
		{
			http: {path: '/updateEmailTemplate', verb: 'post'},
			accepts: {arg: 'well', type: 'object', http:{source:'body'}},
			returns: {arg: 'status', type: 'string'}			
		}
	);

	Admin.remoteMethod(
		'adminGetRide',
		{
			http: {path: '/adminGetRide', verb: 'get'},
			returns: {arg: 'status', type: 'object'}			
		}
	);

	Admin.remoteMethod(
		'adminGetRequest',
		{
			http: {path: '/adminGetRequest', verb: 'get'},
			returns: {arg: 'status', type: 'object'}			
		}
	);
};
