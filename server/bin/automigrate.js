var path = require('path');
var app = require(path.resolve(__dirname, '../server'));
var loopback = require('loopback');
// var moment= require('moment');

var dataSource = app.dataSources.mySQL;

var destination_array=[
{
	"location_name": "hkust"
},
{
	"location_name": "hk"
},
{
  "location_name": "hku"
}
];

var emailTemplate_array=[
{
  "text": "Dear Sir/Madam\n\nAn account has already been created.Please seek help from the administrator by going to his office at 1234 since you do not possess an ust email.\n\nRegards,\nRideSharingTeam"
}
]
var admin_array=[
{
  "password": "123456",
  "username": "admin",
  "email": "hkustfyp2016@gmail.com",
  "emailVerified": 1,
  "id": 1
},
{
  "password": "123456",
  "username": "admin2",
  "email": "admin@hkust.com",
  "emailVerified": 1,
  "id": 2
}
];

var member_array=[
{
  "first_name": "ken",
  "last_name": "kwok",
  "phone_number": 51191726,
  "gender": "male",
  "authorized": "yes",
  "isDriver": "yes",
  "password": "123456",
  "email": "ken@ken.com",
  "deviceToken": "hkustfyp",
  "emailVerified": 1,
  "gender_preference": true,
  "created": new Date()//moment().format()
},
{
  "first_name": "sam",
  "last_name": "wong",
  "phone_number": 999123,
  "gender": "male",
  "authorized": "yes",
  "isDriver": "yes",
  "password": "123456",
  "email": "sam@sam.com",
  "deviceToken": "fypyeah",
  "emailVerified": 1,
  "gender_preference": false,
  "created": new Date(2016,0,27)
},
{
  "first_name": "hin",
  "last_name": "kwok",
  "phone_number": 98989898,
  "gender": "male",
  "authorized": "yes",
  "isDriver": "yes",
  "password": "123456",
  "email": "9g@9g.com",
  "deviceToken": "chingwinglok",
  "emailVerified": 1,
  "gender_preference": true,
  "created": new Date(2016,0,25)
},
{
  "first_name": "nicole",
  "last_name": "ho",
  "phone_number": 89898989,
  "gender": "female",
  "authorized": "yes",
  "isDriver": "yes",
  "password": "123456",
  "email": "dd@dd.com",
  "deviceToken": "kong",
  "emailVerified": 1,
  "gender_preference": false,
  "created": new Date(2016,1,27)
}
];

var join_array=[
{
  "id": 1,
  "status": null,
  "time": new Date(2016,1,27)
},
{
  "id": 2,
  "status": null,
  "time": new Date(2016,1,27)
}
];

var own_array=[
{
  "id": 1,
  "memberId": 1,
  "vehicleId": 1,
},
{
  "id": 2,
  "memberId": 1,
  "vehicleId": 2,
}
]

var pickup_array=[
{
  "location_name": "Choi Hung"
},
{
  "location_name": "Hang Hau"
}
]

var ride_array=[
{
  "id": 1,
  "time": new Date(2016,0,23),
  "seat_number": 3,
  "beforeArrive": 15,
  "status": "inactive",
  "gender_preference": true,
  "ownId": 1,
  "memberId": 1,
  "created": new Date()
},
{
  "id": 2,
  "time": new Date(),
  "seat_number": 2,
  "beforeArrive": 10,
  "status": "inactive",
  "gender_preference": false,
  "ownId": 1,
  "memberId": 1,
  "created": new Date()
}
]

var vehicle_array=[
{
  "license_number": "SAM 9",
  "color": "black",
  "maker": "audi"
},
{
  "license_number": "HKUST",
  "color": "blue",
  "maker": "tesla"
}
]

var request_array=[
{
  "id": 1,
  "time": new Date(2016,0,21),
  "status": "inactive",
  "gender_preference": true
},
{
  "id": 2,
  "time": new Date(2016,0,22),
  "status": "inactive",
  "gender_preference": false
}
]
var icon_array=[
{
  "match_icon": 1
},
{
  "match_icon": 2
},
{
  "match_icon": 3
},
{
  "match_icon": 4
}
]

dataSource.automigrate('destination', function(err) {
  if(err) throw err;
  console.log("Destination!");

  var destination=app.models.destination;
  var count=destination_array.length;
  destination_array.forEach(function(Destination){
    destination.create(Destination,function(err,record){
      if(err) 
        return console.log(err)
      console.log("done",record);
      count--;
      if(count==0){
        console.log("ko");
        //dataSource.disconnect(); 
      }
    })

  });
});

dataSource.automigrate('Member', function(err) {
  if(err) throw err;
  console.log("Member!");

  var member=app.models.Member;
  var count=member_array.length;
  member_array.forEach(function(Mem){
    member.create(Mem,function(err,record){
      if(err)
        return console.log(err)
      console.log("member_done",record);
      count--;
      if(count==0){
        console.log("member_ko");
      }

    })
  });
});


dataSource.automigrate('Join', function(err) {
  if(err) throw err;
  console.log("Join!");

  var join=app.models.Join;
  var count=join_array.length;
  join_array.forEach(function (Jo){
    join.create(Jo,function(err,record){
      if(err)
        return console.log(err)
      console.log("join_done",record);
      count--;
      if(count==0){
        console.log("join_ko");
      }

    });
  });
});

dataSource.automigrate('Own', function(err) {
  if(err) throw err;
  console.log("Own!");
  var own=app.models.Own;
  var count=own_array.length;
  own_array.forEach(function(Own){
    own.create(Own,function(err,record){
      if(err)
        return console.log(err);
      console.log("own_done",record);
      count--;
      if(count==0){
        console.log("own_ko");
      }
    })
  });
});

dataSource.automigrate('pickup', function(err) {
  if(err) throw err;
  console.log("Pickup!");
  var pickup=app.models.pickup;
  var count=pickup_array.length;
  pickup_array.forEach(function(Pick){
    pickup.create(Pick,function(err,record){
      if(err)
        return console.log(err);
      console.log("pickup_done",record);
      count--;
      if(count==0){
        console.log("pickup_ko");
      }
    })
  });
});

dataSource.automigrate('Ride', function(err) {
  if(err) throw err;
  console.log("Ride!");
  var ride=app.models.Ride;
  var count=ride_array.length;
  ride_array.forEach(function(Ride){
    ride.create(Ride,function(err,record){
      if(err)
        return console.log(err);
      console.log("ride_done",record);
      count--;
      if(count==0){
        console.log("ride_ko");
      }
    })
  });
});

dataSource.automigrate('Vehicle', function(err) {
  if(err) throw err;
  console.log("Vehicle!");
  var vehicle=app.models.Vehicle;
  var count=vehicle_array.length;
  vehicle_array.forEach(function(Vehicle){
    vehicle.create(Vehicle,function(err,record){
      if(err)
        return console.log(err)
      console.log("vehicle_done",record);
      count--;
      if(count==0){
        console.log("vehicle_ko");
      }
    });
  });
});

dataSource.automigrate('request', function(err) {
  if(err) throw err;
  console.log("Request!");
  var request=app.models.request;
  var count=request_array.length;
  request_array.forEach(function(Req){
    request.create(Req,function(err,record){
      if(err)
        return console.log(err);
      console.log("Request_done",record);
      count--;
      if(count==0){
        console.log("request_ko");
      }
    });
  });
});

dataSource.automigrate('Icon', function(err) {
  if(err) throw err;
  console.log("Icon!");
  var icon=app.models.Icon;
  var count=request_array.length;
  icon_array = [];
  for (var i=0; i<50; i++){
    icon_array.push({"match_icon": i+1});
  }
  icon_array.forEach(function(Icon){
    icon.create(Icon,function(err,record){
      if(err)
        return console.log(err);
      record.updateAttribute("match_icon", record.id, function(err, rec){
        console.log("ICON_done",record);
        count--;
        if(count==0){
          console.log("ICON_ko");
        }
      });
    });
  });
});

dataSource.automigrate('admin', function(err) {
  if(err) throw err;
  console.log("Admin!");
  var admin=app.models.admin;
  var count=admin_array.length;
  admin_array.forEach(function(Admin){
    admin.create(Admin,function(err,record){
      if(err)
        return console.log(err);
      console.log("Admin_done",record);
      count--;
      if(count==0){
        console.log("admin_ko");
      }
    });
  });
});

dataSource.automigrate('emailTemplate', function(err) {
  if(err) throw err;
  console.log("emailTemplate!");
  var email=app.models.emailTemplate;
  var count=emailTemplate_array.length;
  emailTemplate_array.forEach(function(Email){
    email.create(Email,function(err,record){
      if(err)
        return console.log(err);
      console.log("emailTemplate_done",record);
      count--;
      if(count==0){
        console.log("emailTemplate_ko");
      }
    });
  });
});