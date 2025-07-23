const { Kafka } = require("kafkajs");

const KAFKA_BROKER = process.env.KAFKA_BROKER || "kafka:9092";
const KAFKA_TOPIC = process.env.KAFKA_TOPIC || "kube-learn-topic";

const kafka = new Kafka({ brokers: [KAFKA_BROKER] });

const producer = kafka.producer({
	idempotent: true, // Enable idempotent producer
});

const consumer = kafka.consumer({ groupId: "kube-learn-group" });

// In-memory store to demonstrate consumer idempotency
const processedMessages = new Set();

async function startProducer() {
	await producer.connect();
}

async function publishEvent(event) {
	// Add a unique key to the message for idempotency demonstration
	const key = event.id || String(event.timestamp);
	await producer.send({
		topic: KAFKA_TOPIC,
		messages: [{ key, value: JSON.stringify(event) }],
	});
}

async function startConsumer() {
	await consumer.connect();
	await consumer.subscribe({ topic: KAFKA_TOPIC, fromBeginning: true });
	await consumer.run({
		eachMessage: async ({ message }) => {
			const key = message.key ? message.key.toString() : null;
			// Idempotency: Only process if not already processed
			if (key && processedMessages.has(key)) {
				console.log(
					`Duplicate message with key ${key} ignored (idempotent consumer).`
				);
				return;
			}
			if (key) processedMessages.add(key);
			console.log("YAY! EVENT CONSUMED!");
			console.log(`Consumed message: ${message.value.toString()}`);
		},
	});
}

module.exports = {
	startProducer,
	publishEvent,
	startConsumer,
};
