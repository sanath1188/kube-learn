const http = require("http");
const { Kafka } = require("kafkajs");
const PORT = process.env.PORT || 3000;
const CUSTOM_MESSAGE = process.env.CUSTOM_MESSAGE || "";

const KAFKA_BROKER = process.env.KAFKA_BROKER || "kafka:9092";
const KAFKA_TOPIC = process.env.KAFKA_TOPIC || "kube-learn-topic";

const kafka = new Kafka({ brokers: [KAFKA_BROKER] });
const producer = kafka.producer();
const consumer = kafka.consumer({ groupId: "kube-learn-group" });

async function startKafka() {
	await producer.connect();
	await consumer.connect();
	await consumer.subscribe({ topic: KAFKA_TOPIC, fromBeginning: true });
	await consumer.run({
		eachMessage: async ({ topic, partition, message }) => {
			console.log("YAY! EVENT CONSUMED!");
			console.log(`Consumed message: ${message.value.toString()}`);
		},
	});
}

startKafka().catch(console.error);

const server = http.createServer(async (req, res) => {
	console.log(req.url);
	if (req.url === "/publish" && req.method === "POST") {
		const event = {
			message: "Hello from Node.js on Kubernetes!",
			custom: CUSTOM_MESSAGE,
			timestamp: Date.now(),
		};
		await producer.send({
			topic: KAFKA_TOPIC,
			messages: [{ value: JSON.stringify(event) }],
		});
		res.writeHead(200, { "Content-Type": "application/json" });
		res.end(JSON.stringify({ status: "Event published!" }));
		return;
	}
	res.writeHead(200, { "Content-Type": "text/plain" });
	res.end(`Hello from Node.js on Kubernetes! ${CUSTOM_MESSAGE}\n`);
});

server.listen(PORT, () => {
	console.log(`Server running on port ${PORT}`);
});
