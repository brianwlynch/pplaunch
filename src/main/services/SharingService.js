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


class Sharing {
    constructor({ windowManager }) {
        this.wm = windowManager;
        this._peers = new Map();
        this._bonjour = null;
        this._published = null;
        this._browser = null;
        this._running = false;
        this._serviceName = null;
        this._heartbeatTimer = null;
        this._evictTimers = new Map();

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
                        log.info(`Received from LAN - ${body}`);
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

            if (this._evictTimers.has(key)) {
                clearTimeout(this._evictTimer.get(key));
                this._evictTimers.delete(key);
            }

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
            if (!this._peers.has(key)) return;

            const handle = setTimeout(() => {
                this._evictTimers.delete(key);
                this._evictPeer(key);
            }, 5000);
            this._evictTimers.set(key, handle);
        });
        this._browser.start();

        this._server.listen(SERVICE_PORT, () => log.info(`HTTP server listening on port ${SERVICE_PORT}`));
        
        this._heartbeatTimer = setInterval(() => this._checkPeers(), 30_000);

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
            this._server.close();

            clearInterval(this._heartbeatTimer);
            this._heartbeatTimer = null;
            for (const handle of this._evictTimers.values()) clearTimeout(handle);
            this._evictTimers.clear();

            log.info(`Stopped - ${reason}`);
            resolve();
        });
    }

    async restart(reason) {
        await this.stop(`Restarting! - ${reason}`);
        this.start();
    }

    getPeers() {
        log.info(`Current peers: ${this._peers}`);
        return Array.from(this._peers.values());
    }

    async _checkPeers(){
        for (const [key, peer] of this._peers){
            if (this._evictTimers.has(key)) continue;
            const ipv4 = peer.addresses?.find(a => /^\d+\.\d+\.\d+\.\d+$/.test(a));
            const addr = formatAddr(ipv4 || peer.addresses?.[0] || peer.host);
            try{
                log.info(`TRYing to check peer: ${peer.name}`);
                await fetch(`http://${addr}:{peer.port}/scores`, {
                    signal: AbortSignal.timeout(3000),
                });
            } catch {
                this._peers.delete(key);
                this._send("sharing:peer-lost", peer);
                log.info(`Peer heartbeat lost: ${peer.name}`);
            }
        }
    }

    async _evictPeer(key){
        const peer = this._peers.get(key);
        if (!peer) return;

        const ipv4 = peer.addresses?.find(a => /^\d+\.\d+\.\d+\.\d+$/.test(a));
        const addr = formatAddr(ipv4 || peer.addresses?.[0] || peer.host);
        try{
            log.info(`TRYing to evict peer: ${peer.name}`);
            await fetch(`http://${addr}:{peer.port}/scores`, {
                signal: AbortSignal.timeout(3000),
            });

            log.info(`Peer still reachable, keeping: ${peer.name}`);
        } catch {
            this._peers.delete(key);
            this._send("sharing:peer-lost", peer);
            log.info(`Peer lost: ${peer.name}`);
        }
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
                const ip4 = peer.addresses?.find(a => /^\d+\.\d+\.\d+\.\d+$/.test(a));
                const addr = formatAddr(ipv4 || peer.addresses?.[0] || peer.host);
                try {
                    log.info("TRYing to push!");
                    await fetch(`http://${addr}:${peer.port}/scores`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body,
                        signal: AbortSignal.timeout(3000),
                    })
                } catch (error) {
                    log.warn(`CATCHed - Push failed to ${peer.name}: ${error.message}`);
                }
            }));
    }

}

function formatAddr(addr) {
    return addr.includes(":") ? `[${addr}]` : addr;
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

module.exports = Sharing