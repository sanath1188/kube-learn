const http = require("http");
const {
	startProducer,
	publishEvent,
	startConsumer,
} = require("./kafka/kafkaClient");
const PORT = process.env.PORT || 3000;
const CUSTOM_MESSAGE = process.env.CUSTOM_MESSAGE || "";

startProducer().catch(console.error);
startConsumer().catch(console.error);

const server = http.createServer(async (req, res) => {
	if (req.url === "/publish" && req.method === "POST") {
		let body = "";
		req.on("data", (chunk) => {
			body += chunk;
		});
		req.on("end", async () => {
			let indempotencyTest = false;
			try {
				const parsed = JSON.parse(body || "{}");
				indempotencyTest = parsed.indempotencyTest === true;
			} catch (e) {}
			const event = {
				id: indempotencyTest ? "fixed-id-for-test" : String(Date.now()),
				message: "Hello from Node.js on Kubernetes!",
				custom: CUSTOM_MESSAGE,
				timestamp: Date.now(),
			};
			await publishEvent(event);
			res.writeHead(200, { "Content-Type": "application/json" });
			res.end(JSON.stringify({ status: "Event published!", id: event.id }));
		});
		return;
	}
	res.writeHead(200, { "Content-Type": "text/plain" });
	res.end(`Hello from Node.js on Kubernetes! ${CUSTOM_MESSAGE}\n`);
});

server.listen(PORT, () => {
	console.log(`Server running on port ${PORT}`);
});
