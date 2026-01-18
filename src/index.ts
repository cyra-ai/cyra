import server from './clients/server.ts';
import { config } from './config/index.ts';

server.listen(config.system.port, () => {
	console.log(`Server is listening on port ${config.system.port}`);
});