const os = require('os');

function getLocalIp() {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
            // Skip internal (non-127.0.0.1) and non-ipv4
            if ('IPv4' !== iface.family || iface.internal) {
                continue;
            }
            return iface.address;
        }
    }
    return '127.0.0.1';
}

function ipToId(ip) {
    try {
        const parts = ip.split('.');
        if (parts.length !== 4) return null;
        return parts.map(part => {
            const hex = parseInt(part, 10).toString(16);
            return hex.length === 1 ? '0' + hex : hex;
        }).join('').toUpperCase();
    } catch (e) {
        return null;
    }
}

function idToIp(id) {
    try {
        if (!id || id.length !== 8) return null;
        const parts = [];
        for (let i = 0; i < 8; i += 2) {
            parts.push(parseInt(id.substring(i, i + 2), 16));
        }
        return parts.join('.');
    } catch (e) {
        return null;
    }
}

module.exports = { getLocalIp, ipToId, idToIp };
