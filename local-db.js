// Database launcher.
//  1. If MONGO_URI is MongoDB Atlas (mongodb+srv://…) we resolve its SRV
//     records, probe each host, and build a direct connection string from the
//     hosts whose TLS handshake actually works on this network (some ISPs /
//     networks block TLS to individual Atlas nodes).
//  2. If Atlas is unreachable entirely — or MONGO_URI is the local one — we
//     start a persistent local MongoDB (data in .mongo-data/) as a fallback.
//  3. Finally the Express server (server.js) boots.
const path = require('path');
const fs = require('fs');
const dns = require('dns').promises;

// load config.env before anything reads process.env
require('dotenv').config({ path: path.join(__dirname, 'backend', 'config', 'config.env') });

const LOCAL_URI = 'mongodb://127.0.0.1:27017/flipkartdb';

const isLocalUri = (uri) =>
    /^mongodb:\/\/(127\.0\.0\.1|localhost)(:|\/|$)/.test(uri || '');

// mongodb+srv://CREDS@CLUSTER/DB?QUERY  →  { creds, db, query }
const parseSrvUri = (uri) => {
    const m = uri.match(/^mongodb\+srv:\/\/([^@]+)@([^/?]+)(\/[^?]*)?(\?.*)?$/);
    if (!m) return null;
    return {
        creds: m[1],
        cluster: m[2],
        db: (m[3] || '').replace(/^\//, '') || 'gadshop',
        query: (m[4] || '').replace(/^\?/, ''),
    };
};

// try to connect + read something (forces TLS *and* authentication)
const tryUri = async (uri) => {
    const { MongoClient } = require('mongodb');
    const client = new MongoClient(uri, {
        serverSelectionTimeoutMS: 7000,
        connectTimeoutMS: 7000,
    });
    try {
        await client.connect();
        await client.db().command({ ping: 1 });
        await client.db().collection('products').find().limit(1).toArray(); // needs auth
        return { ok: true };
    } catch (err) {
        const replicaSet = (err.message.match(/reports set name "([^"]+)"/) || [])[1];
        return { ok: false, error: err.message, replicaSet };
    } finally {
        await client.close().catch(() => {});
    }
};

const startLocalMongo = async () => {
    // a mongod may already be running (e.g. orphaned from a previous launch
    // whose parent died) — reuse it instead of hitting the lock file
    const probe = await tryUri(LOCAL_URI);
    if (probe.ok) {
        console.log(`Reusing local MongoDB already running at ${LOCAL_URI}`);
        return;
    }

    const { MongoMemoryServer } = require('mongodb-memory-server');
    const dbPath = path.join(__dirname, '.mongo-data');
    if (!fs.existsSync(dbPath)) {
        fs.mkdirSync(dbPath, { recursive: true });
    }
    const mongod = await MongoMemoryServer.create({
        instance: { port: 27017, dbPath, storageEngine: 'wiredTiger' },
    });
    console.log(`Local MongoDB running at ${mongod.getUri()}`);
};

(async () => {
    try {
        const srvUri = process.env.MONGO_URI || '';

        if (isLocalUri(srvUri)) {
            console.log('MONGO_URI is local — starting local MongoDB…');
            await startLocalMongo();
        } else {
            const parts = parseSrvUri(srvUri);
            console.log(`Target database: ${srvUri.replace(/:[^:@]+@/, ':****@')}`);

            let hosts = [];
            try {
                const srv = await dns.resolveSrv(`_mongodb._tcp.${parts.cluster}`);
                hosts = srv.map((s) => s.name);
                console.log(`SRV hosts: ${hosts.join(', ')}`);
            } catch (err) {
                console.log(`SRV lookup failed: ${err.message}`);
            }

            const working = [];      // hosts that handshook + authenticated
            let replicaSet = null;   // discovered replica-set name, if any

            for (const host of hosts) {
                const base = `mongodb://${parts.creds}@${host}:27017/${parts.db}`;
                const extra = `ssl=true&authSource=admin&${parts.query}`;

                let r = await tryUri(`${base}?${extra}`);
                if (!r.ok && r.replicaSet && !replicaSet) {
                    replicaSet = r.replicaSet;
                    r = await tryUri(`${base}?replicaSet=${replicaSet}&${extra}`);
                }
                // authSource fallback: database in the path (driver default)
                if (!r.ok && /auth|credential|Unauthorized/i.test(r.error || '')) {
                    r = await tryUri(`${base}?ssl=true&${parts.query}`);
                }

                if (r.ok) {
                    working.push(host);
                    console.log(`  ✓ ${host} — TLS + auth OK`);
                } else {
                    console.log(`  ✗ ${host} — ${r.error}`);
                }
            }

            if (working.length > 0) {
                const direct = `mongodb://${parts.creds}@${working.join(',')}:27017/${parts.db}` +
                    `?ssl=true&authSource=admin${replicaSet ? `&replicaSet=${replicaSet}` : ''}` +
                    `&${parts.query}`;
                process.env.MONGO_URI = direct;
                console.log(`Atlas OK via ${working.length}/${hosts.length} host(s). Connecting directly.`);
            } else {
                process.env.MONGO_URI = LOCAL_URI;
                console.log('→ No Atlas host reachable, falling back to LOCAL MongoDB.');
                await startLocalMongo();
            }
        }

        require('./server');
    } catch (err) {
        console.error('Failed to start database:', err.message);
        process.exit(1);
    }
})();
