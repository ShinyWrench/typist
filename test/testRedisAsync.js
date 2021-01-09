const RedisAsync = require('../redisAsync');

const redisAsync = new RedisAsync();

async function main() {
    await redisAsync.set('abcd', 12345);
    let result = await redisAsync.get('abcd');
    console.log(`result = ${result}`);
}

redisAsync.connect();

main().then(() => {
    redisAsync.disconnect();
});
