import https from 'https'
import dotenv from 'dotenv'

export const result = dotenv.config({path: '../.env'})
if (result.error) {
    throw result.error
}

const url = process.env.url
const startEndpoint = process.env.startgame
let gameId

function postRequest(path, callback) {
    const options = {
        hostname: url,
        path: path,
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        }
    };


    const req = https.request(options, (res) => {
        let data = '';

        res.on('data', (chunk) => {
            data += chunk;
        });

        res.on('end', () => {
            const body = JSON.parse(data)
            callback(body)
        });

    }).on("error", (err) => {
        console.log("Error: ", err.message);
    });


    req.end();
}
function getRequest(path, callback) {

    https.get('https://' + url + path, response => {
        let data = '';

        response.on('data', (chunk) => {
            data = data + chunk.toString();
        });
        response.on('end', () => {
            const body = JSON.parse(data);
            callback(body)
        });

    })
}

function startGame(path) {
    postRequest(path, getAds)
    console.log('Starting new game.')
}
function getAds(data) {
    gameId = data.gameId
    const adsEndpoint = `/api/v2/${gameId}/messages`

    getRequest(adsEndpoint, solve)
}
function solve(data) {
    const firstAd = data[0].adId
    const solveEndpoint = `/api/v2/${gameId}/solve/${firstAd}`
    postRequest(solveEndpoint, checkGameStatus)

}
function buyItem(item = 'hpot') {
    const buyEndpoint = `/api/v2/${gameId}/shop/buy/${item}`
    postRequest(buyEndpoint, checkGameStatus)
}
function checkGameStatus(data) {
    const lives = data.lives
    const score = data.score
    const gold = data.gold
    const shoppingSuccess = data.shoppingSuccess

    const winningScore = 1000

    const adsEndpoint = `/api/v2/${gameId}/messages`

    if (score >= winningScore) {
        console.log(`Congratulations! Game finished successfully with a score of ${score}`)
        return
    }

    if (shoppingSuccess === undefined) {
        console.log(`${data.message} Now you have ${gold} gold and ${lives} lives left. Your score is ${score}.`)
    }

    if (shoppingSuccess) {
        console.log(`Your shopping was successful. NOw you have ${lives} lives and ${gold} gold.`)
    }

    if (lives >= 2) {
        getRequest(adsEndpoint, solve)
    } else if (lives < 2 && gold >= 50) {
        console.log('You have 1 live left. Buying some healing for you...')
        buyItem()
    } else if (gold <= 49) {
        console.log('No lives left and no gold to buy them. Ending game.')
        return
    }
}

startGame(startEndpoint)
