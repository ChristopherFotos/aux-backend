const DATA = require('../data.json');
const _s = require('./spotify');

const room = _s.getRoomByProperty({
	name: 'access_token.access_token',
	value:
		'BQBYdJEO1p6w6qTKWsAbT-43CiQ_1vvFYEMI8bPlZy46BKsKuTUURKN86HOIz5sqbtXpcO-vqIIDQ87_Sjb4MiIpokV-ISbNuBmGlK-WE1k3Fe6UHCIc41qivFfEe3rj5MdmhOHvD68GV7Yt3VccwrtjfFqBL0XTfYYnImfR3qbZBXBbra26AM2RDu2TNpokY2ysT1rMIcHhdb-rFa3kNXv_HN0',
});

console.log(room);
