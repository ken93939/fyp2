module.exports = function(server){

	// Maybe no need to initialize

	// Load requests from db to RequestQueue
	// server.models.request.find({"where": {"status": "active"}}, function(err, requests) {
	// 	if (err) console.log(err);
	// 	requests.forEach(function(request, index, array){
	// 		request.requestId = request.id;
	// 		request.member(function(err, mem){
	// 			if (err) console.log(err);
	// 			request.member_gender = mem.gender;
	// 			server.models.RequestQueue.create(request, function(err, req){
	// 				if (err) console.log(err);

	// 			});
	// 		});
	// 	});
	// });

	// Load Rides from db to OfferQueue
	// server.models.Ride.find({"where": {"status": "active"}}, function(err, rides) {
	// 	if (err) console.log(err);
	// 	rides.forEach(function(ride, index, array){
	// 		ride.rideId = ride.id;
	// 		ride.member(function(err, mem){
	// 			if (err) console.log(err);
	// 			ride.member_gender = mem.gender;
	// 			server.models.OfferQueue.create(ride, function(err, offer){
	// 				if (err) console.log(err);

	// 			});
	// 		});
	// 	});
	// });

	// TODO: Load PendingQueue & MatchedQueue?
};