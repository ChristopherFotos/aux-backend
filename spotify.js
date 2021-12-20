const router = require('express').Router();
const axios = require('axios');
const bodyParser = require('body-parser');
const fs = require('fs');
const _s = require('./utils/spotify');
const DATA = require('./data.json');
const cors = require('cors');
const uniqid = require('uniqid');
const querystring = require('querystring');

router.use(cors());

require('dotenv').config({ path: './.env' });

router.use((req, res, next) => bodyParser.json()(req, res, next));

router.post('/token', async (req, res) => {
	// Creating a params object for the token request
	const paramsObj = {
		grant_type: 'authorization_code',
		code: req.body.code,
		redirect_uri: 'http://localhost:3000/',
	};

	// Stringifying the params object so that it can be sent
	let params = querystring.stringify(paramsObj);

	// Stringifying our credentials and creating the headers for the request
	let encodedSecrets =
		'Basic ' +
		new Buffer(
			process.env.SPOTIFY_CLIENT_ID + ':' + process.env.SPOTIFY_CLIENT_SECRET
		).toString('base64');

	const headers = {
		'Content-Type': 'application/x-www-form-urlencoded',
		Authorization: encodedSecrets,
	};

	// This object will be sent back to the client *and* stored in the DB
	const room = {
		id: uniqid.time(),
	};

	// Making the request and storing the token in a variable
	axios
		.post('https://accounts.spotify.com/api/token', params, { headers })
		.then(async (data) => {
			const headers = {
				Authorization: `Bearer ${data.data.access_token}`,
			};

			const playlistData = {
				name: room.id,
				description: 'aux playlist',
				public: false,
			};

			const user = await axios.get('https://api.spotify.com/v1/me', {
				headers,
			});

			const user_id = user.data.uri.split(':')[2];

			const playlist = await axios.post(
				`https://api.spotify.com/v1/users/${user_id}/playlists`,
				playlistData,
				{ headers, 'Content-Type': 'application/json' }
			);

			// populating the rooms object initialized earlier
			room.owner = 'tom';
			room.access_token = data.data;
			room.user_id = user_id;
			room.playlist = playlist.data;
			room.playlist.uri = playlist.data.uri.split(':')[2];

			DATA.rooms.push(room);
			const dataJSON = JSON.stringify(DATA);
			fs.writeFileSync('./data.json', dataJSON);

			res.status(200).json(room);
		})
		.catch((e) => res.json({ e }));
});

router.get('/login', (req, res) => {
	const query = querystring.stringify({
		response_type: 'code',
		client_id: process.env.SPOTIFY_CLIENT_ID,
		scope:
			'playlist-modify-private playlist-modify-public playlist-read-private',
		redirect_uri: 'http://localhost:3000/',
	});

	res.redirect(`https://accounts.spotify.com/authorize?${query}`);
});

router.post('/add-song', (req, res) => {
	const { uri, room } = req.body;

	console.log('RUNNING RUNNING', uri, room);

	_s.addSongToPlaylist(room, uri).then(async (response) => {
		const playlist = await _s.getPlaylistByRoomCode(room);
		res.json(playlist);
	});
});

router.get('/playlist/:room', (req, res) => {
	const { room } = req.params;

	_s.getPlaylistByRoomCode(room).then((response) => {
		res.json(response.data);
	});
});

module.exports = router;
