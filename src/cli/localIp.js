module.exports = () => {
    const interfaces = require('os').networkInterfaces();
    const ips = Object.values(interfaces)
        .flat(1)
        .filter(net => net.family === 'IPv4' && !net.internal);
    return ips.length > 0 ? ips[0].address : null;
};