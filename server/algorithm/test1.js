var gb = require('../boot/gb.js');
var Algorithm = require('./Algorithm.js');

// algorithm.printGb();
var request = [
  {
    "time": "2015-12-01T03:13:00.000Z",
    "id": 100,
    "joinId": null,
    "pickup_name": null,
    "destination_name": null,
    "memberId": null
  },
  {
    "time": "2015-12-08T05:03:45.000Z",
    "id": 200,
    "joinId": null,
    "pickup_name": null,
    "destination_name": "aa",
    "memberId": null
  }
];

Algorithm.checkPossibleOffer(request[0], function(err, offer){
	if (err)
		console.log(err);
	if (offer != null){
		// remote push
		console.log(offer);
	}
});