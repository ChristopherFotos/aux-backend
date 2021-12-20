const router = require('express').Router();
const { default: axios } = require('axios');
const bodyParser = require('body-parser');
const querystring = require('querystring');
const cors = require('cors');
const DATA = require('./data.json');
const _s = require('./utils/spotify');

router.use(cors());
router.use(bodyParser.json());

router.post('/joinroom', async (req, res) => {
	const room = _s.getRoomByProperty({ name: 'id', value: req.body.id });

	_s.getPlaylistByRoomCode(room.id).then((response) =>
		res.status(200).json({ id: room.id, playlist: response.data })
	);
});

module.exports = router;
