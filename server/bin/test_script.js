var path = require('path');
var app = require(path.resolve(__dirname, '../server'));
var loopback = require('loopback');
var dataSource = app.dataSources.mySQL;

var run = true;

if (!run) return;

// instance array

var table = ['Icon', 'admin', 'request', 'Vehicle', 'Ride', 'pickup', 'Own', 'Join', 'Member', 'destination'];

// recommend max mem = 20
var mem = 20; // total = mem*7

var data = {};
data.memCount = 0;
data.requestCount = 0;
data.rideCount = 0;
data.joinCount = 0;
data.driverCount = 0;
data.passengerCount = 0;
data.maleCount = 0;
data.femaleCount = 0;

var member_array = [];
for (var j=7; j>0; j--){
	for (var i=1; i<=mem; i++){
		member_array.push({
			"id": member_array.length+1,
			"first_name": "first_"+(member_array.length+1),
			"last_name": "last_"+(member_array.length+1),
			"phone_number": 10000000+(member_array.length+1),
			"gender": (i+j)%4? "male": "female",
			"authorized": "yes",
			"isDriver": (i+j)%3? "yes": "no",
			"password": "123456",
			"email": "user"+(member_array.length+1)+"@user.com",
			"deviceToken": "hkustfyp",
			"emailVerified": 1,
			"gender_preference": (i+j)%2,
			"created": new Date(Date.now()-((j-1)*24*60*60-i)*1000)
		});
		!(j-1) && data.memCount++;
		(i+j)%4 && data.maleCount++;
		!((i+j)%4) && data.femaleCount++;
		(i+j)%3 && data.driverCount++;
		!((i+j)%3) && data.passengerCount++;
	}
}

var admin_array = [];
for (var i=1; i<=2; i++){
	admin_array.push({
		"id": i,
		"username": "admin"+(i>1? i: ""),
		"password": "123456",
		"email": "admin"+i+"@admin.com",
		"emailVerified": 1
	});
}

var icon_array = [];
for (var i=1; i<=50; i++){
	icon_array.push({
		"id": i,
		"match_icon": i
	});
}

var vehicle_array = [];
for (var i=1; i<=member_array.length/2; i++){
	vehicle_array.push({
		"id": i,
		"license_number": "A"+(1000+i),
		"color": "color_"+i,
		"maker": "maker_"+i
	});
}

var own_array = [];
for (var i=0; i<member_array.length; i++){
	if (member_array[i].isDriver == "yes"){
		for (var j=0; j<i%3+1; j++){
			own_array.push({
			  "id": own_array.length+1,
			  "memberId": member_array[i].id,
			  "vehicleId": vehicle_array[(i+j)%vehicle_array.length].id
			});
		}
	}
}

var request_array = [];
var request_queue = [];
var request_queue_ust = [];
for (var j=10; j>0; j--){
	for (var i=1; i<=((member_array.length/(j%8+1))%member_array.length+1)*10; i++){
		var request_data = {
			"id": request_array.length+1,
			"time": new Date(Date.now()-((j-1)*24*60*60-i)*1000),
			"status": j-1? "inactive": "active",
			"gender_preference": member_array[(i-1)%member_array.length].gender_preference,
			"memberId": member_array[(i-1)%member_array.length].id,
			"pickup_name": (i+j)%3? ((i+j)%2? "Hang Hou": "Choi Hung"): "HKUST",
			"destination_name": (i+j)%3? "HKUST": ((i+j)%2? "Hang Hou": "Choi Hung")
		}
		request_array.push(request_data);
		!(j-1) && data.requestCount++;

		var request_queue_data = JSON.parse(JSON.stringify(request_data));
		if (!(j-1)){
			if (request_queue_data.pickup_name == "HKUST"){
				request_queue_data.member_gender = member_array[(i-1)%member_array.length].gender;
				request_queue_data.requestId = request_queue_data.id;
				request_queue_data.id = request_queue.length+1;
				request_queue.push(request_queue_data);
			} else{
				request_queue_data.member_gender = member_array[(i-1)%member_array.length].gender;
				request_queue_data.requestId = request_queue_data.id;
				request_queue_data.id = request_queue_ust.length+1;
				request_queue_ust.push(request_queue_data);
			}
		}
	}
}

var ride_array = [];
var ride_queue = [];
var ride_queue_ust = [];
for (var j=7; j>0; j--){
	for (var i=1; i<=((member_array.length/((j+1)%5+1))%member_array.length+1)*10; i++){
		var ride_data = {
			"id": ride_array.length+1,
			"time": new Date(Date.now()-((j-1)*24*60*60-i)*1000),
			"status": j-1? "inactive": "active",
			"seat_number": (i+j)%7+1,
			"beforeArrive": ((i+j)%7+1)*j,
			"gender_preference": member_array[(i-1)%member_array.length].gender_preference,
			"memberId": member_array[(i-1)%member_array.length].id,
			"ownId": member_array[(i-1)%member_array.length].id,
			"pickup_name": (i+j)%3? ((i+j)%2? "Hang Hou": "Choi Hung"): "HKUST",
			"destination_name": (i+j)%3? "HKUST": ((i+j)%2? "Hang Hou": "Choi Hung")
		}
		ride_array.push(ride_data);
		!(j-1) && data.rideCount++;

		var ride_queue_data = JSON.parse(JSON.stringify(ride_data));
		if (!(j-1)){
			if (ride_queue_data.pickup_name == "HKUST"){
				ride_queue_data.is_full = false;
				ride_queue_data.member_gender = member_array[(i-1)%member_array.length].gender;
				ride_queue_data.rideId = ride_queue_data.id;
				ride_queue_data.id = ride_queue.length+1;
				ride_queue.push(ride_queue_data);
			} else{
				ride_queue_data.is_full = false;
				ride_queue_data.member_gender = member_array[(i-1)%member_array.length].gender;
				ride_queue_data.rideId = ride_queue_data.id;
				ride_queue_data.id = ride_queue_ust.length+1;
				ride_queue_ust.push(ride_queue_data);
			}
		}
	}
}

var join_array = [];
for (var i=1; i<=Math.min(request_array.length-data.requestCount, ride_array.length-data.rideCount)/10; i++){
	join_array.push({
		"id": i,
		"status": "Finished",
		"rideId": i,
		"requestId": i,
		"iconId": i,
	});
	data.joinCount++;
}

// test method

var automigrate = function(table, i, cb){
	dataSource.automigrate(table[i], function(err) {
		if (err) console.log(err);
		if (i+1 < table.length){
			automigrate(table, i+1, cb);
		} else{
			cb();
		}
	});
};

var create = function(name, model, array, cb){
	model.create(array, function(err, record){
		console.log(name, array.length);
		if (err) console.log(err);
		cb();
	});
};

var createS = function(total, count, cb){
	create("Member", app.models.Member, member_array, function(){
		++count == total && cb();
	});
	create("Admin", app.models.Admin, admin_array, function(){
		++count == total && cb();
	});
	create("Icon", app.models.Icon, icon_array, function(){
		++count == total && cb();
	});
	create("Vehicle", app.models.Vehicle, vehicle_array, function(){
		++count == total && cb();
	});
	create("Own", app.models.Own, own_array, function(){
		++count == total && cb();
	});
};

var createROJ = function(total, count, cb){
	create("request", app.models.request, request_array, function(){
		++count == total && cb();
	});
	create("Ride", app.models.Ride, ride_array, function(){
		++count == total && cb();
	});
	create("RequestQueue", app.models.RequestQueue, request_queue, function(){
		++count == total && cb();
	});
	create("RequestQueueUST", app.models.RequestQueueUST, request_queue_ust, function(){
		++count == total && cb();
	});
	create("OfferQueue", app.models.OfferQueue, ride_queue, function(){
		++count == total && cb();
	});
	create("OfferQueueUST", app.models.OfferQueueUST, ride_queue_ust, function(){
		++count == total && cb();
	});
	create("Join", app.models.Join, join_array, function(){
		++count == total && cb();
	});
}

// main

console.log(">>>>>>>>>>>>>>> test_script.js <<<<<<<<<<<<<<<");
var st = Date.now();
automigrate(table, 0, function(){
	console.log("...");
	createS(5, 0, function(){
		console.log("...");
		createROJ(7, 0, function(){
			console.log("...");
			console.log(data);
			console.log("...");
			console.log("Time", (Date.now()-st)/1000);
			console.log(">>>>>>>>>>>>>>> Server Ready <<<<<<<<<<<<<<<");
		});
	});
});