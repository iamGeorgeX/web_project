import {app} from './app.mjs';


const PORT =3000;

const server = app.listen(PORT,  () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});



process.on('SIGTERM', () => {
    console.info('SIGTERM signal received.');
    console.log('Closing http server.');
    server.close(() => {
        console.log('Http server closed.');
    });
});
