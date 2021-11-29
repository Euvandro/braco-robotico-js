
const express = require('express');
const app = express();
app.use(express.static(__dirname + '/public'));
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");

const io = new Server(server);

const fs = require('fs');
var five = require("johnny-five");
var board = new five.Board({ port: 'COM5' });

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
});



board.on('ready', () => {

    let passo = -1;
    const base = new five.Servo(5);
    const garra = new five.Servo(6);
    const altura = new five.Servo(9);
    const profundidade = new five.Servo(10);

    base.to(90);
    garra.to(160);
    altura.to(140);
    profundidade.to(120);


    io.on("connection", socket => {
        // ...
        console.log('alguem entrou');

        socket.on("base", (data) => {
            base.to(data);
        });

        socket.on("garra", (data) => {
            garra.to(data);
        });

        socket.on("altura", (data) => {
            altura.to(data);
        });

        socket.on("profundidade", (data) => {
            profundidade.to(data);
        });

        socket.on("reset", (data) => {
            passo = -1;
        });

        socket.on("load", () => {

            fs.readFile('caminho.json', 'utf-8', (err, data) => {
                if (err) {
                    throw err;
                }

                // parse JSON object
                const dads = JSON.parse(data.toString());

                if (dads.length < 0) return;
                //while(dads[passo + 1]){

                const inter = setInterval(() => {
                    if (passo > dads.length - 2) {
                        console.log('limpa');
                        passo = -1;
                        clearInterval(inter);
                    } else {

                        passo++;
                        console.log('Passo: ', passo);
                        garra.to(dads[passo].garra);
                        base.to(dads[passo].base);
                        altura.to(dads[passo].altura);
                        profundidade.to(dads[passo].profundidade);
                    }
                }, 1000);

            });

        })

        socket.on("save", () => {

            let novosDados;

            const dados = {
                "base": base.value,
                "garra": garra.value,
                "altura": altura.value,
                "profundidade": profundidade.value,
            }

            fs.readFile('caminho.json', 'utf-8', (err, data) => {
                if (err) {
                    throw err;
                }

                // parse JSON object
                const dads = JSON.parse(data.toString() + '\r\n');

                novosDados = [...dads, dados]
                console.log('Salvou ', novosDados.length);

                fs.writeFile('caminho.json', JSON.stringify(novosDados), (err) => {
                    if (err) {
                        throw err;
                    }
                    console.log("JSON data is saved.");
                });
            });



        })

    })


});

console.log("ouvindo porta 3000..");
server.listen(3000);
