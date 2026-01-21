import server from './clients/server.ts';
import { config } from './config/index.ts';
import './clients/WebSocket.ts';

import logger from './utils/logger.ts';

server.listen(config.system.port, () => {
	logger.divider('═');
	logger.success_highlight('cyra Server Online');
	logger.label('Port', config.system.port, 'bright');
	logger.label('WebSocket', '/ws', 'bright');
	logger.divider('═');
});