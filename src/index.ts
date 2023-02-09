import { AsyncMqttClient, connectAsync, IClientPublishOptions } from "async-mqtt";

type MQTTMessageHandler = (message: Buffer, topic: string, engine: MQTTEngine) => Promise<void> | void;

export class MQTTEngine {
    private client: AsyncMqttClient;
    private handlers: Map<string, MQTTMessageHandler[]>;

    constructor(client: AsyncMqttClient) {
        this.handlers = new Map();
        this.client = client;
    }

    static async getMQTTEngine(host: string, port?: number): Promise<MQTTEngine> {
        const client = await connectAsync(`mqtt://${host}`, {port});
        console.debug("Connected to MQTT broker. Listening to messages...");

        const object = new MQTTEngine(client);

        client.on("message", object.onMessage.bind(object));
        return object;
    }

    private async onMessage(topic: string, message: Buffer): Promise<void> {
        const handlers = this.handlers.get(topic);
        if (handlers)
            await Promise.all(handlers.map(handler => handler(message, topic, this)));
    }

    async register(topic: string, handler: MQTTMessageHandler): Promise<void> {
        const handlers = this.handlers.get(topic);
        if (handlers) {
            handlers.push(handler);
        } else {
            await this.client.subscribe(topic);
            this.handlers.set(topic, [handler]);
            console.debug(`Subscribed to ${topic}`);
        }
    }

    async registerAll(registerList: {topic: string, handler: MQTTMessageHandler}[]): Promise<void> {
        await Promise.all(registerList.map(e => this.register(e.topic, e.handler)));
    }

    async redirect(topicIn: string, topicOut: string): Promise<void> {
        await this.register(topicIn, message => this.publish(topicOut, message));
    }

    async redirectAll(redirectList: {topicIn: string, topicOut: string}[]): Promise<void> {
        await Promise.all(redirectList.map(e => this.redirect(e.topicIn, e.topicOut)));
    }

    async publish(topic: string, message: string | Buffer, options?: IClientPublishOptions) {
        if (options)
            await this.client.publish(topic, message, options);
        else
            await this.client.publish(topic, message);
    }
}

export default MQTTEngine.getMQTTEngine;
