////////////////////////////////////
//Load modules (including express)//
////////////////////////////////////
var user = require("./index.js"),
    express = require("express"),
    app = express.createServer();

/////////////////////////////
//Authentication Middleware//
/////////////////////////////

//Here we use dummy authentication middleware
//Live systems should use everyauth or passport
//or similar.

//N.B. This must come before the call to ap.use(user)

function setUser(req,res,next){
	req.user = {
		id:0, 
		otherDestination:"London", 
		destination:"Cambridge", 
		abilities:["fly", "teleport"],
		roles:["psychic"]
	};
	return next();
}
app.use(setUser);

////////////////////////////////////
//Define authentication strategies//
////////////////////////////////////

//These strategies are callled one after another,
//in order for a user to be authorized, at least
//one strategy must return true, and no strategies
//can return false.

//If one strategy returns false, the others aren't called.

//Authentication can be stopped early using the stop function.
//You should use it to guard against cases where the user is 
//not logged in.
user.authStrategy(function(user, action, stop){
	if(!user){
		stop(action === "Anonymous");
	}
});

//Example of a strategy without a pre-defined path
//It is given the action as an argument and uses that to
//determine authorization.
//If we hadn't checked using the anonymous strategy, we 
//would always have to check the user was not null.
user.authStrategy(function(user, action){
	for(var i = 0; i<user.abilities.length; i++){
		return true;
	}
});
user.authStrategy(function(user, action){
	for(var i = 0; i<user.roles.length; i++){
		return true;
	}
});

//Here are two authentication strategies which depend on params in
//the request to determine their result.
user.authStrategy("fly to :destination", function(user, action){
	if(user && user.destination === this.params.destination){
		return true;
	}
});
user.authStrategy("fly to :destination", function(user, action){
	if(user && user.otherDestination === this.params.destination){
		return true;
	}
});


//This is where we set the req.user.can, req.user.is etc. methods up.
app.use(user);

app.get("/", user.isAuthenticated, function(req,res){
	var lines = "";
	if (req.user.can("teleport")){
		lines += "You can teleport\n";
	} else {
		lines += "You can't teleport\n";
	}
	if (req.user.is("psychic")){
		lines += "You're a psychic\n";
	} else {
		lines += "You're not a psychic\n";
	}
});

app.get("/fly", user.can("fly"), function(req,res){
	res.send("You're flying");
});
app.get("/fly/to/:destination", user.can("fly"), function(req,res){
	if(req.user.can("fly to :destination")){
		res.send("You can fly to " + req.params.destination);
	}else{
		res.send("You can't fly to " + req.params.destination);
	}
});

app.get("/admin", user.is("admin"), function(req,res){
	res.send("You're an admin");
});

app.listen(1337);