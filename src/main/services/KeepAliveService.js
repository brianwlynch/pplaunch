class KeepAliveService {
      /**
   * @param {object} opts
   * @param {() => string} opts.getUrl - returns the current URL to check
   * @param {number} [opts.pollS=5] - interval between checks
   * @param {number} [opts.failAfterS=60] - continuous failure window before triggering fallback
   * @param {(info: {reason: string, lastOkAt: number, now: number, error?: any}) => void} opts.onFailHard
   * @param {(info: {ok: boolean, status?: number, reason?: string}) => void} [opts.onTick]
   */
    constructor({getUrl, pollS = 5, failAfterS = 60, onFailHard, onTick}){
        this.getUrl = getUrl;
        this.pollS = pollS;
        this.pollMs = pollS * 1000;
        this.failAfterS = failAfterS;
        this.failAfterMs = failAfterS * 1000;
        this.onFailHard = onFailHard;
        this.onTick = onTick;

        this._timer = null;
        this._lastOkAt = Date.now();
        this._running = false;
      }

      start(){
        if(this._running) return;
        this._running = true;
        this._lastOkAt = Date.now();

        this._timer = setInterval(() => {
            this._chockOnce().catch(() => {});
        }, this.pollMs);
      }

      stop(){
        this._running = false;
        if(this._timer){
            clearInterval(this._timer);
            this._timer = null;
        }
      }

      async _chockOnce() {
        const url = this.getUrl?.();
        if(!url) return;

        const now = Date.now();
        try {
            const { ok, status, text } = await this._fetchWithTimeout(url, 4000);

            const bodyLooks404 = status === 200 && typeof text === "string" && text.includes("404");
            if (status === 404 || bodyLooks404 || !ok) {
                this.onTick?.({ ok: false, status, reason: "http_error" });
                console.log("</3");
                return this._maybeFailHard(now, "http_error", { status });
            } else {
                console.log("<3");
            }

            this._lastOkAt = now;
            this.onTick?.({ok: true, status});
        } catch (err) {
            this.onTick?.({ ok: false, reason: "network_error"});
            return this._maybeFailHard(now, "network_error", { err });
        }
      }

      _maybeFailHard(now, reason, extra = {} ){
        const elapsed = now - this._lastOkAt;

        if (elapsed > this.failAfterMs) {
            this.onFailHard?.({
                reason,
                lastOkAt: this._lastOkAt,
                now, 
                ...extra,
            });
            this.stop();
        }
      }

      async _fetchWithTimeout(url, timeoutMs){
        const controller = new AbortController();
        const t = setTimeout(() => controller.abort(), timeoutMs);

        try {
            const res = await fetch(url, { method: "GET", signal: controller.signal });
            const text = await res.text().catch(() => "");
            return { ok: res.ok, status: res.status, text};
        } catch (e){
            return { ok: null, status: e, text: "Heartbeat broken!"};
        } finally {
            clearTimeout(t);
        }
      }
}
module.exports = KeepAliveService;