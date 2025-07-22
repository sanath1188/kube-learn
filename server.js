const http = require("http");
const PORT = process.env.PORT || 3000;
const CUSTOM_MESSAGE = process.env.CUSTOM_MESSAGE || "";

const server = http.createServer((req, res) => {
	res.writeHead(200, { "Content-Type": "text/plain" });
	res.end(`Hello from Node.js on Kubernetes! ${CUSTOM_MESSAGE}\n`);
});

server.listen(PORT, () => {
	console.log(`Server running on port ${PORT}`);
});
