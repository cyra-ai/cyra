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
			process.cwd()
		]
	}
];

export default config;