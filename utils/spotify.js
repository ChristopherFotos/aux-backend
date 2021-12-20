const axios = require('axios');
const DATA = require('../data.json');
const querystring = require('querystring');
const fs = require('fs');
const _ = require('lodash');

const getNewToken = (refreshToken) => {
	const params = {
		grant_type: 'refresh_token',
		refresh_token: refreshToken,
	};

	const paramString = querystring.stringify(params);

	return axios
		.post('https://accounts.spotify.com/api/token', paramString, {
			headers: {
				Authorization:
					'Basic ' +
					new Buffer(
						process.env.SPOTIFY_CLIENT_ID +
							':' +
							process.env.SPOTIFY_CLIENT_SECRET
					).toString('base64'),
				'Content-Type': 'application/x-www-form-urlencoded',
			},
		})
		.then((res) => {
			const room = getRoomByProperty({
				name: 'access_token.refresh_token',
				value: refreshToken,
			});

			room.access_token.access_token = res.data.access_token;
			console.log('RES DOT DATA: ', res.data);
			fs.writeFileSync('./data.json', JSON.stringify(DATA));
		})
		.catch((e) => console.log('########## refresh token error ##########'));
};

/**
 *
 * @param {object} property an object with properties name<string> and
 * value<string>. Name is the property you're searching by, value that
 * property's expected value.
 * @returnsobject
 */

const getRoomByProperty = (property) => {
	const room =
		DATA.rooms[
			DATA.rooms.findIndex(
				(room) => _.get(room, property.name) === property.value
			)
		];

	if (!room) {
		return `Could not find room where property ${property.name} === ${property.value}`;
	}

	return room;
};

const getPlaylistByRoomCode = (roomCode) => {
	const room = getRoomByProperty({ name: 'id', value: roomCode });
	if (!room) return;

	const { playlist, access_token } = room;
	const { uri } = playlist;
	const { access_token: token } = access_token;
	const { refresh_token } = access_token;

	return axios(`https://api.spotify.com/v1/playlists/${uri}`, {
		headers: {
			Authorization: `Bearer ${token}`,
		},
	}).catch((e) => {
		console.log('catching');
		if (e.response.status !== 401) {
			console.log(e.response);
			return;
		}

		getNewToken(refresh_token).then(() => getPlaylistByRoomCode(roomCode, int));
	});
};

const getSong = (roomCode, uri) => {
	const { access_token } = _s.getRoomByProperty({ name: id, value: roomCode });

	return axios(`https://api.spotify.com/v1/tracks/${uri}`, {
		headers: {
			Authorization: `Bearer ${access_token.access_token}`,
		},
	})
		.then((response) => (playlistResponse = response.data))
		.catch((e) => {
			console.log('catching');
			if (e.response.status !== 401) return 'user must re-authenticate';
			getNewToken(refresh_token).then(() => getPlaylistByRoomCode(roomCode));
		});
};

const addSongToPlaylist = (room, song) => {
	const roomObj = getRoomByProperty({ name: 'id', value: room });
	const { id } = roomObj.playlist;
	const { access_token, refresh_token } = roomObj.access_token;

	console.log(access_token);

	return axios
		.post(
			`https://api.spotify.com/v1/playlists/${id}/tracks`,
			{
				uris: [song],
			},
			{
				headers: {
					Authorization: `Bearer ${access_token}`,
				},
			}
		)
		.then((response) => response)
		.catch((e) => {
			console.log('catching', e.response.data, access_token);

			if (e.response.status !== 401) return 'user must re-authenticate';

			getNewToken(refresh_token).then(() => addSongToPlaylist(room, song));
		});
};

module.exports = {
	getRoomByProperty,
	getNewToken,
	addSongToPlaylist,
	getSong,
	getPlaylistByRoomCode,
};
