db = db.getSiblingDB("openwhyd_data"); //connect("localhost:27017/whyd_music");

print("upserting openwhyd team users ...");

db.user.update({ "_id" : ObjectId("4d94501d1f78ac091dbc9b4d"), }, { "$set" : {
	"email" : "admin@yoursite.com",
	"name" : "admin",
	"pwd" : "21232f297a57a5a743894a0e4a801fc3"
} }, { upsert: true });

print("done! :-)");
