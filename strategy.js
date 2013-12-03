var passport = require('passport')
  , FacebookStrategy = require('passport-facebook').Strategy
  , TwitterStrategy = require('passport-twitter').Strategy
  , config = require('./config.json');


passport.serializeUser(function(user, done) {
	done(null, user);
});

passport.deserializeUser(function(obj, done) {
	done(null, obj);
});
	
passport.use(new FacebookStrategy(config.fb,
	function(accessToken, refreshToken, profile, done) {
		profile.photourl = 'http://graph.facebook.com/'+profile.username+'/picture?type=large';
		console.log("+++facebook profileurl+++");
		console.log(profile.photourl);
		console.log(accessToken);
		return done(null, profile);
	}
));

passport.use(new TwitterStrategy(config.tw,
	function(accessToken, refreshToken, profile, done) {
		profile.photourl = profile.photos[0].value + '?type=large';
		console.log("+++twitter profileurl+++");
		console.log(accessToken);
		console.log(profile.photourl);
		return done(null, profile);
	}
));