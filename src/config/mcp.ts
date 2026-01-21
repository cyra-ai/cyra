import path from 'path';
const config = [
	{
		command: 'npx',
		args: [
			'-y',
			'@philschmid/weather-mcp'
		]
	},
	{
		command: 'npx',
		args: [
			'-y',
			'@modelcontextprotocol/server-filesystem',
			path.join(process.cwd(), 'sandbox')
		]
	}
];

export default config;