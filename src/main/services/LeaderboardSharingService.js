const fs = require("fs");
const path = require("path");
const { app } = require("electron");
const { Bonjour } = require("bonjour-service");
const { version } = require("os");
const SettingsStore = require("./SettingsStore");
const http = require("http");
const LoggingService = require("./LoggingService");
const log = new LoggingService("Sharing");


const SERVICE_TYPE = "pplaunch";
const SERVICE_PORT = 7373;


class LeaderboardSharing {
    constructor({ windowManager }) {
        this.wm = windowManager;
        this._peers = new Map();
        this._bonjour = null;
        this._published = null;
        this._browser = null;
        this._running = false;
        this._serviceName = null;

        this._server = http.createServer((req, res) => {
            if (req.method === "GET" && req.url === "/scores") {
                const s = new SettingsStore().load();
                const scores = s.LOCAL_SCORES ? decodeScores(s.LOCAL_SCORES) : [];
                res.writeHead(200, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ scores, unit: s.UNIT }));
            } else if (req.method === "POST" && req.url === "/scores") {
                let body = "";
                req.on("data", chunk => body += chunk);
                req.on("end", () => {
                    try {
                        const { scores: incoming, from } = JSON.parse(body);
                        this._mergeAndPropagate(incoming, from);
                    } catch (error) {
                        log.warn(`Bad POST body: ${error.message}`);
                    }
                    res.writeHead(204); res.end();
                });
            } else {
                res.writeHead(404); res.end();
            }
        })

    }

    start() {
        if (this._running) return;
        this._running = true;

        const settings = new SettingsStore().load();
        const unit = settings.UNIT || "panel";
        let location = ""

        if (settings.LOCATION === "custom") {
            location = settings.CUSTOM_LOCATION ? `-${settings.CUSTOM_LOCATION}` : "";
        } else {
            location = settings.LOCATION ? `-${settings.LOCATION}` : "";
        }

        this._serviceName = `${unit}${location}`.slice(0, 63);

        this._bonjour = new Bonjour();

        this._published = this._bonjour.publish({
            name: this._serviceName,
            type: SERVICE_TYPE,
            protocol: "tcp",
            port: SERVICE_PORT,
            txt: {
                unit: settings.UNIT || "",
                location: settings.LOCATION || "",
                version: app.getVersion(),
            },
        });

        this._browser = this._bonjour.find({ type: SERVICE_TYPE, protocol: "tcp" });

        this._browser.on("up", (service) => {
            if (service.name === this._serviceName) return;
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
            this._peers.set(key, peer);
            this._send("sharing:peer-found", peer);
            log.info(`Peer found: ${service.name}`);
        });

        this._browser.on("down", (service) => {
            if (service.name === this._serviceName) return;
            const key = service.fqdn || service.name;
            const peer = this._peers.get(key) || { name: service.name };
            this._peers.delete(key);
            this._send("sharing:peer-lost", peer);
            log.info(`Peer lost: ${service.name}`);
        });

        this._browser.start();
        log.info(`Started advertising as: ${this._serviceName}`);
    }

    stop(reason) {
        return new Promise((resolve) => {
            if (!this._running) { resolve(); return; }
            this._running = false;
            try { this._browser?.stop(); } catch { };
            this._browser = null;
            if (this._bonjour) {
                this._bonjour.destroy();
                this._bonjour = null;
            }
            this._published = null;
            this._peers.clear();
            log.info(`Stopped - ${reason}`);
            resolve();
        });
    }

    async restart(reason) {
        await this.stop(`Restarting! - ${reason}`);
        this.start();
    }

    getPeers() {
        return Array.from(this._peers.values());
    }

    _send(channel, payload) {
        const w = this.wm.get("main")?.window;
        if (w && !w.isDestroyed()) w.webContents.send(channel, payload);
    }

    /** Merge incoming scores from LAN and the scores of this panel. */
    _mergeAndPropagate(incoming, senderName) {
        const store = new SettingsStore();
        const s = store.load();

        const existingScores = s.LOCAL_SCORES ? decodeScores(s.LOCAL_SCORES) : [];
        const existingIDs = new Set(existingScores.map(sc => sc.id));

        const newScores = incoming.filter(sc => !existingIDs.has(sc.id));
        if (newScores.length === 0) return; // Same Data ... Don't need to continue

        const merged = [...existingScores, ...newScores].sort((a, b) => b.score - a.score).slice(0, 10);
        s.LOCAL_SCORES = encodeScores(merged);
        store.save(s);

        //Update UI via IPC
        this._send("sharing:scores-updated", merged);

        //Send to other panels on LAN
        this.pushToAll(merged, senderName);
    }

    /** Push new scores to all panels, except who sent to this panel. */
    async pushToAll(scores, excludedName = null) {
        const body = JSON.stringify({ scores, from: this._serviceName });
        if(this._peers.size === 0) {
            log.info(`No peers to send to.`);
            return;
        } else {
            log.info(`Pushing scores to LAN.`);
        }
        await Promise.all(Array.from(this._peers.values())
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
                    log.warn(`Push failed to ${peer.name}: ${error.message}`);
                }
            }));
    }

}

function encodeScores(scores) {
    return btoa(JSON.stringify(scores));
}

function decodeScores(encoded) {
    try {
        return JSON.parse(atob(encoded));
    } catch (error) {
        log.warn(`Decode error - ${error}`);
    }
}

module.exports = LeaderboardSharing