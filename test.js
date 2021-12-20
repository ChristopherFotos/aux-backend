require('dotenv').config({ path: './.env' });

console.log('SECRET ', process.env.SPOTIFY_CLIENT_SECRET);
console.log('ID ', process.env.SPOTIFY_CLIENT_ID);

const auth = new Buffer(
	process.env.SPOTIFY_CLIENT_ID + ':' + process.env.SPOTIFY_CLIENT_SECRET
).toString('base64');

console.log(auth);
