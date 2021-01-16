import { Socket } from 'net';

export const createTCPPvdTransport = () => {

    const socket = new Socket();

    let connected = false;

    return PhysX.PxPvdTransport.implement({
        connect: (host = "127.0.0.1", port = 5425) => {
            socket.connect(port, host, () => {
                console.log("Connected to PVD");
                connected = true;
            });
        },
        isConnected: () => {
            return connected;
        },
        write: (dataAddress: number, dataSize: number) => {
            const data = PhysX.HEAPU8.slice(dataAddress, dataAddress + dataSize);

            if (socket) {
                try {
                    socket.write(data);
                } catch (E) {
                    console.log(1)
                }

            }
        }
    });
};