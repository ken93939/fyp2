var es = require('event-stream');
var ts = require('../bin/test_script.js');

module.exports = function(server){

	var run_test_script = false;

	ts.runScript(run_test_script, function(){

		// admin real-time dashboard
		var Dashboard = server.models.Dashboard;
		Dashboard.createChangeStream(function(err, changes) {
			changes.pipe(es.stringify()); // .pipe(process.stdout);
		});
		Dashboard.updateAllInfo(function(err, status){
			if (err) console.log(err);

			// model observers
			var hookArray = ['after save', 'after delete'];
			var Member = server.models.Member;
			var request = server.models.request;
			var Ride = server.models.Ride;
			var Join = server.models.Join;

			hookArray.forEach(function(hook){
				Member.observe(hook, function(ctx, next) {
					var curTime = new Date();
					var today = new Date(curTime.getFullYear(), curTime.getMonth(), curTime.getDate());
					Dashboard.updateCount(Member, {created: {gte: today}}, "memCount", function(err, db){
						if (err) console.log(err);
						Dashboard.updateCount(Member, {isDriver: "no"}, "passengerCount", function(err, db){
							if (err) console.log(err);
							Dashboard.updateCount(Member, {isDriver: "yes"}, "driverCount", function(err, db){
								if (err) console.log(err);
								Dashboard.updateCount(Member, {gender: "male"}, "maleCount", function(err, db){
									if (err) console.log(err);
									Dashboard.updateCount(Member, {gender: "female"}, "femaleCount", function(err, db){
										if (err) console.log(err);
										next();
									});
								});
							});
						});
					});
				});
				Ride.observe(hook, function(ctx, next) {
					var curTime = new Date();
					var today = new Date(curTime.getFullYear(), curTime.getMonth(), curTime.getDate());
					Dashboard.updateCount(Ride, {time: {gte: today}}, "rideCount", function(err, db){
						if (err) console.log(err);
						next();
					});
				});
				request.observe(hook, function(ctx, next) {
					var curTime = new Date();
					var today = new Date(curTime.getFullYear(), curTime.getMonth(), curTime.getDate());
					Dashboard.updateCount(request, {time: {gte: today}}, "requestCount", function(err, db){
						if (err) console.log(err);
						Dashboard.updateArray(function(err, db){
							if (err) console.log(err);
							next();
						});
					});
				});
				Join.observe(hook, function(ctx, next) {
					var curTime = new Date();
					var today = new Date(curTime.getFullYear(), curTime.getMonth(), curTime.getDate());
					Dashboard.updateCount(Join, {time: {gte: today}}, "joinCount", function(err, db){
						if (err) console.log(err);
						Dashboard.updateArray(function(err, db){
							if (err) console.log(err);
							next();
						});
					});
				});
			});
		});
	});

};