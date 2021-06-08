import { Connection } from '@iobroker/socket-client/dist/Connection';

let connection = new Connection({ port: 8082 });
connection.onConnectionHandlers.push(async connected => {
    await connection.getObjects(true);
});

export default connection;