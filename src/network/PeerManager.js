import Peer from "peerjs";
import CryptoJS from "crypto-js";

export default class PeerManager {
    constructor() {
        this.peer = null;
        this.connections = {}; // peerId -> DataConnection
        this.isHost = false;
        this.handlers = {};

        this.myPeerId = null;
        this.hostId = null;
        this.players = []; // Array of ids including self
    }

    on(event, handler) {
        if (!this.handlers[event]) this.handlers[event] = [];
        this.handlers[event].push(handler);
    }

    emit(event, data) {
        if (this.handlers[event]) {
            this.handlers[event].forEach(h => h(data));
        }
    }

    async init(peerId = null) {
        return new Promise((resolve, reject) => {
            // peerId is specified for Host, let peerjs assign for guest
            this.peer = new Peer(peerId);
            this.peer.on("open", (id) => {
                this.myPeerId = id;
                resolve(id);
            });
            this.peer.on("error", (err) => {
                console.error("PeerJS error:", err);
                this.emit("error", err);
                reject(err);
            });

            this.peer.on("connection", (conn) => {
                if (!this.isHost) {
                    console.warn("Got connection but not host");
                    return;
                }
                this._setupConnection(conn);
            });
        });
    }

    async beHost(customId) {
        this.isHost = true;
        const id = await this.init(customId);
        this.players = [id];
        return id;
    }

    async joinRoom(hostId) {
        this.isHost = false;
        this.hostId = hostId;
        const id = await this.init();
        this.players = [id];

        return new Promise((resolve, reject) => {
            const conn = this.peer.connect(hostId);
            conn.on("open", () => {
                this._setupConnection(conn);
                this._sendTo(hostId, { type: "JOIN" });
                resolve(id);
            });
            conn.on("error", (err) => {
                reject(err);
            });
        });
    }

    _setupConnection(conn) {
        this.connections[conn.peer] = conn;
        conn.on("data", (data) => {
            this._handleMessage(conn.peer, data);
        });
        conn.on("close", () => {
            delete this.connections[conn.peer];
            this.players = this.players.filter(p => p !== conn.peer);
            this.emit("playerLeft", conn.peer);
            if (this.isHost) {
                this.broadcast({ type: "PLAYERS_UPDATE", players: this.players });
            }
        });
    }

    _handleMessage(senderId, data) {
        console.log("Received", data, "from", senderId);
        if (this.isHost) {
            if (data.type === "JOIN") {
                if (!this.players.includes(senderId)) {
                    this.players.push(senderId);
                }
                this.broadcast({ type: "PLAYERS_UPDATE", players: this.players });
                this.emit("PLAYERS_UPDATE", { players: this.players });
            }
        } else {
            if (data.type === "PLAYERS_UPDATE") {
                this.players = data.players;
                this.emit("PLAYERS_UPDATE", { players: this.players });
            }
        }

        // Bubble event to UI
        this.emit("message", { senderId, data });
    }

    broadcast(data) {
        if (!this.isHost) {
            console.warn("Only host can broadcast");
            return;
        }
        for (const peerId in this.connections) {
            this._sendTo(peerId, data);
        }
    }

    sendToHost(data) {
        if (this.isHost) {
            this._handleMessage(this.myPeerId, data);
        } else {
            this._sendTo(this.hostId, data);
        }
    }

    _sendTo(peerId, data) {
        if (this.connections[peerId]) {
            this.connections[peerId].send(data);
        }
    }

    // Cryptography helpers
    generateRandomSeed() {
        return Math.floor(Math.random() * 2147483647);
    }

    hash(data) {
        return CryptoJS.SHA256(data.toString()).toString();
    }
}
