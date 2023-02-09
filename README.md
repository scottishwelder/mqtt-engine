# mqtt-engine

This small library can help you write code that is driven by MQTT messages. Similar to Express with HTTP requests.
It automatically subscribes to topics, when necessary.

## Installation

This package is available on npm:

``` shell
npm install mqtt-engine
```

## Usage

The ringing of a doorbell causes a notification on a TV:

``` ts
import getMQTTEngine from "mqtt-engine";
import { notifyTV } from "./tv-control"

(async () => {
    const engine = await getMQTTEngine("localhost");
    await engine.register('doorbell/report/state', message => {
        if (message.toString() === 'ringing')
            notifyTV();
    })
})();
```

## Exports

The mqtt-engine package exports the main class `MQTTEngine` and, by default,
its factory method `MQTTEngine.getMQTTEngine`. So you probably would start you program like this:

``` ts
import getMQTTEngine from "mqtt-engine";
```

You can also import the main class for typing or some other reason:

``` ts
import { MQTTEngine } from "mqtt-engine";
```

## API

### Default export

The default export of this package is an async factory method (not a constructor).

``` ts
async getMQTTEngine(host: string, port?: number): Promise<MQTTEngine>
```

* **host**: The URL to the MQTT broker;
* **port**: The port number, default to 1883.

### MQTTEngine.register

Registers a handler for when the engine receives a message with the specified topic.
It can be called more than once for the same topic,
all the registered handlers will be executed at-the-same-time-ish with `Promise.all`.

``` ts
async register(topic: string, handler: MQTTMessageHandler): Promise<void>
```

* **topic**: The topic that will trigger the execution of the handler;
* **handler**: A function to be executed when a message with the specified topic is received;
    * Its type is `MQTTMessageHandler = (message: Buffer, topic: string, engine: MQTTEngine) => Promise<void> | void;`
    * **message** will be the message received;
    * **topic** will be the topic of the message;
    * **engine** will always be a reference to the engine itself. Useful to call .publish() inside a handler.

### MQTTEngine.registerAll

Registers multiple pairs of topic and handler. The same as calling register multiple times.

``` ts
async registerAll(registerList: {topic: string, handler: MQTTMessageHandler}[]): Promise<void>
```

Example:

``` ts
await engine.registerAll([
    {topic: "foxtrot/control/audioSource", handler: changeAudioSource},
    {topic: "zigbee2mqtt/button", handler: buttonPressed}
]);

function buttonPressed(message: Buffer) {
    switch (message.toString()) {
        case "pressedOnce":
            turnLightOn();
            break;
        case "pressedTwice":
            turnComputerOn();
            break;
        default:
            console.warn("Unknown button action");
            break;
    }
}
```

### MQTTEngine.redirect

Registers a function that relays messages from one topic to another.

``` ts
async redirect(topicIn: string, topicOut: string): Promise<void>;
```

Example:

``` ts
await engine.redirect('zigbee2mqtt/buttton', 'foxtrot/control/audioSource');
```

### MQTTEngine.redirectAll

Registers multiple pairs of topics to redirect. The same as calling redirect multiple times

``` ts
async redirectAll(redirectList: {topicIn: string, topicOut: string}[]): Promise<void>;
```

Example:

``` ts
await engine.redirect([
    {topicIn: 'zigbee2mqtt/buttton', topicOut: 'foxtrot/control/audioSource'},
    {topicIn: 'zigbee2mqtt/thermometer', topicOut: 'zigbee2mqtt/thermostat'},
]]);
```

### MQTTEngine.publish

Publishes an MQTT message.

``` ts
async publish(topic: string, message: string | Buffer, options?: IClientPublishOptions): Promise<void>;
```

* **topic**: topic to publish to;
* **message**: message to publish;
* **options**: an object of extra options, exactly as [mqttjs](https://github.com/mqttjs/MQTT.js#mqttclientpublishtopic-message-options-callback)'.

## Acknowledgements

Written by the Scottish Welder.\
Produced with the help of the open source community, especially the [MQTT.js](https://github.com/mqttjs) project.\
Approved by Daniel:
![Photo of a cat](daniel.jpeg "Daniel")
