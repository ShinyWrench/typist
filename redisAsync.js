const redis = require('redis');
const { promisify } = require('util');

class RedisAsync {
    constructor() {
        this.client = null;
        process.on('exit', function () {
            try {
                this.client.quit();
                console.log('process exit -- client.quit()');
            } catch (err) {}
        });
    }

    connect() {
        this.client = redis.createClient();
        this.boundFunctions = {
            set: promisify(this.client.set).bind(this.client),
            get: promisify(this.client.get).bind(this.client),
            zincrby: promisify(this.client.zincrby).bind(this.client),
        };
    }

    disconnect() {
        this.client.quit();
        this.client = null;
    }

    async set() {
        return this.boundFunctions.set.apply(null, arguments);
    }

    async get() {
        return this.boundFunctions.get.apply(null, arguments);
    }

    async zincrby() {
        return this.boundFunctions.zincrby.apply(null, arguments);
    }
}

module.exports = RedisAsync;

// exports.hset = promisify(client.hset).bind(client);
// exports.incrby = promisify(client.incrby).bind(client);
// exports.hincrby = promisify(client.hincrby).bind(client);
// exports.zadd = promisify(client.zadd).bind(client);
