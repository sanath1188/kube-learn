const express = require("express");
const {
	startProducer,
	publishEvent,
	startConsumer,
} = require("./kafka/kafkaClient");
const PORT = process.env.PORT || 3000;
const CUSTOM_MESSAGE = process.env.CUSTOM_MESSAGE || "";

const app = express();
app.use(express.json());

startProducer().catch(console.error);
startConsumer().catch(console.error);

app.post("/publish", async (req, res) => {
	const indempotencyTest = req.body && req.body.indempotencyTest === true;
	const event = {
		id: indempotencyTest ? "fixed-id-for-test" : String(Date.now()),
		message: "Hello from Node.js on Kubernetes!",
		custom: CUSTOM_MESSAGE,
		timestamp: Date.now(),
	};
	await publishEvent(event);
	res.json({ status: "Event published!", id: event.id });
});

app.get("/", (req, res) => {
	res.send(`Hello from Node.js on Kubernetes! ${CUSTOM_MESSAGE}`);
});

app.listen(PORT, () => {
	console.log(`Server running on port ${PORT}`);
});
