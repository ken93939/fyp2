module.exports = function(server){
	// Load requests from db to RequestQueue
	server.models.request.find({}, function(err, requests) {
		if (err) return console.log(err);
		requests.forEach(function(request, index, array){
			request.requestId = request.id;
			server.models.RequestQueue.create(request, function(err, req){
				if (err) return console.log(err);

			});
		});
	});

	// Load Rides from db to OfferQueue
	server.models.Ride.find({}, function(err, rides) {
		if (err) return console.log(err);
		rides.forEach(function(ride, index, array){
			ride.rideId = ride.id;
			server.models.OfferQueue.create(ride, function(err, offer){
				if (err) return console.log(err);

			});
		});
	});
};