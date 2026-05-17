/** This is to test sharing scores via mDNS on the same computer */

const http = require("http");
const { Bonjour } = require("bonjour-service");

const TEST_PORT = 7473;
const SERVICE_PORT = 7373;
const SERVICE_TYPE = "pplaunch";


const bonjour = new Bonjour();

let _peers = new Map();
let _bonjour = null;
let _published = null;
let _browser = null;
let _running = false;
let _serviceName = null;

const testScores = [
    { id: "test-001", score: Math.random*100, player: "TEST A", panel: "PANEL A" },
    { id: "test-002", score: Math.random*100, player: "TEST B", panel: "PANEL B" },
];

LOCAL_SCORES = encodeScores(testScores);

let _server = http.createServer((req, res) => {
    if (req.method === "GET" && req.url === "/scores") {
        const scores = LOCAL_SCORES ? decodeScores(LOCAL_SCORES) : [];
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ scores, unit: "TEST" }));
    } else if (req.method === "POST" && req.url === "/scores") {
        let body = "";
        req.on("data", chunk => body += chunk);
        req.on("end", () => {
            try {
                console.log(`Received from LAN - ${body}`);
                const { scores: incoming, from } = JSON.parse(body);
                _mergeAndPropagate(incoming, from);
            } catch (error) {
                console.warn(`Bad POST body: ${error.message}`);
            }
            res.writeHead(204); res.end();
        });
    } else {
        res.writeHead(404); res.end();
    }
})

_server.listen(TEST_PORT, () => {
    console.log(`[TEST] Fake peer listening on port ${TEST_PORT}`);

    bonjour.publish({
        name: "test-panel",
        type: SERVICE_TYPE, 
        protocol: "tcp", 
        port: TEST_PORT,
        txt: { unit: "test", location: "test", version: "0.0.0"},
    });

    console.log(`[TEST] Bonjour service published as "test-panel"`);

    setTimeout(() => {
        const testScores = [
            { id: "test-001", score: 9999, name: "TEST A", date: Date.now() },
            { id: "test-002", score: 40, name: "TEST B", date: Date.now() },
        ];
        const body = JSON.stringify({ scores: testScores, from: "test-panel" });
        console.log(`[TEST] Posting test scores to app...`);

        const req = http.request(
            { hostname: "localhost", port: SERVICE_PORT, path: "/scores", method: "POST",
                headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(body) } },
                res => console.log(`[TEST] App responded: ${res.statusCode}`)
        );
        req.on("error", err => console.error(`[TEST] POST Failed: ${err.message}`));
        req.write(body);
        req.end();
    }, 3000);
});

//####################################################

function start() {
    if (_running) return;
    _running = true;

    const UNIT = "TEST_PANEL";
    let LOCATION = `-TEST`;

    _serviceName = `${UNIT}${LOCATION}`.slice(0, 63);

    _bonjour = new Bonjour();

    _published = _bonjour.publish({
        name: _serviceName,
        type: SERVICE_TYPE,
        protocol: "tcp",
        port: SERVICE_PORT,
        txt: {
            unit: UNIT || "",
            location: LOCATION || "",
            version: "0.0.0.0",
        },
    });

    _browser = _bonjour.find({ type: SERVICE_TYPE, protocol: "tcp" });

    _browser.on("up", (service) => {
        if (service.name === _serviceName) return;
        const key = service.fqdn || service.name;

        const peer = {
            name: service.name,
            host: service.host,
            port: service.port,
            addresses: service.addresses || [],
            txt: service.txt || {},
            fqdn: service.fqdn,
            seenAt: Date.now(),
        };
        _peers.set(key, peer);
        console.log(`Peer found: ${service.name}`);
    });

    _browser.on("down", (service) => {
        if (service.name === _serviceName) return;
        const key = service.fqdn || service.name;
        const peer = _peers.get(key) || { name: service.name };
        _peers.delete(key);
        console.log(`Peer lost: ${service.name}`);
    });

    _browser.start();
    console.log(`Started advertising as: ${_serviceName}`);
}

function stop(reason) {
    return new Promise((resolve) => {
        if (!_running) { resolve(); return; }
        _running = false;
        try { _browser?.stop(); } catch { };
        _browser = null;
        if (_bonjour) {
            _bonjour.destroy();
            _bonjour = null;
        }
        _published = null;
        _peers.clear();
        console.log(`Stopped - ${reason}`);
        resolve();
    });
}

async function restart(reason) {
    await stop(`Restarting! - ${reason}`);
    start();
}

function getPeers() {
    return Array.from(_peers.values());
}

/** Push new scores to all panels, except who sent to this panel. */
async function pushToAll(scores, excludedName = null) {
    const body = JSON.stringify({ scores, from: _serviceName });
    if (_peers.size === 0) {
        console.log(`No peers to send to.`);
        return;
    } else {
        console.log(`Pushing scores to LAN.`);
    }
    await Promise.all(Array.from(_peers.values())
        .filter(p => p.name !== excludedName)
        .map(async (peer) => {
            const addr = peer.addresses?.[0] || peer.host;
            try {
                await fetch(`http://${addr}:${SERVICE_PORT}/scores`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body,
                    signal: AbortSignal.timeout(3000),
                })
            } catch (error) {
                console.warn(`Push failed to ${peer.name}: ${error.message}`);
            }
        }));
}

function encodeScores(scores) {
    return btoa(JSON.stringify(scores));
}

function decodeScores(encoded) {
    try {
        return JSON.parse(atob(encoded));
    } catch (error) {
        console.warn(`Decode error - ${error}`);
    }
}


start();
process.on("SIGINT", () => { bonjour.destroy(); _server.close(); process.exit(); });