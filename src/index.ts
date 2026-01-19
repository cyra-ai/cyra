import server from './clients/server.ts';
import { config } from './config/index.ts';
import './clients/WebSocket.ts';

import logger from './utils/logger.ts';

server.listen(config.system.port, () => {
	logger.info(`Server is listening on port ${config.system.port}`);
});