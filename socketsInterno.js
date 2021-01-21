var fs = require('fs');
// INTERNO
const User = require('./models/User');
const Boleto = require('./models/Boleto');
const Subasta = require('./models/Subasta');
const Mensaje = require('./models/Mensaje');
const Post = require('./models/Post');

module.exports = function (io) {

    io.on('connection', socket => {
        console.log('Socket interno connected');

        socket.on('add-clase-gratis', async function (telf) {

            let mensaje = new Mensaje({
                telf: telf,
                hora: new Date().toUTCString("-4"),
            });

            await mensaje.save();

            socket.emit("alert-main", "Clase solicitada exitosamente");
        });

        socket.on('msg-client', async function (msg) {
            console.log(msg);
        });

        socket.on('add-subasta', async function (id, rut) {
            let existe = await Subasta.findOne({ codigo: id, dueno: rut, vendiendo: "Si" });
            if (existe) {
                socket.emit("db-fail", "Boleto ya en venta");
                return false;
            }

            let enSubasta = await Subasta.findOne({ codigo: rut + ";" + id });
            if (enSubasta) {
                socket.emit("subasta-not-added");
                return false;
            }
            let newSubasta = new Subasta({
                codigo: rut + ";" + id,
                vendedor: rut,
                boleto: id,
                mensajes: [],
            });
            await newSubasta.save();
            console.log("Agregada subasta");
            socket.emit("subasta-added");
        });

        socket.on('add-venta', async function (id, rut, valor) {
            let existe = await Subasta.findOne({ codigo: id, dueno: rut, vendiendo: "Si" });
            if (existe) {
                socket.emit("db-fail", "Boleto ya en venta");
                return false;
            }

            let enSubasta = await Subasta.findOne({ codigo: rut + ";" + id });
            if (enSubasta) {
                socket.emit("subasta-not-added");
                return false;
            }

            let boleto = await Boleto.findOne({ codigo: id, dueno: rut });
            boleto.vendiendo = "Si";
            boleto.valor = valor;
            await boleto.save();
            console.log("Agregada venta");
            socket.emit("db-fail", "Boleto en venta");
        });

        socket.on('add-msg', async function (codigo, rut) {
            let subasta = await Subasta.findOne({ codigo: codigo });
            let user = await User.findOne({ rut: rut });

            subasta.mensajes.push([user, msg]);
            await subasta.save();
        })

        socket.on('add-money', async function (rut) {
            let user = await User.findOne({ rut: rut });
            let newMoney = parseInt(user.dinero) + 5000;
            user.dinero = newMoney.toString();
            await user.save();

        });

        function generarBoleto(rut) {

            valorRand = Math.floor(Math.random() * 10001) + 1000;

            let descripciones = ["City Tour", "Sesión de fotografía", "Película en cine", "Viaje en bus", "Vuelo en avión", "Conducir auto", "Partida de golf", "Piscina"];
            let lugares = ["Santiago", "San Miguel", "Manuel Montt", "Salvador", "La Cisterna", "La Serena", "Iquique"];
            let newBoleto = {
                codigo: Math.random().toString(36).slice(-8),
                descripcion: descripciones[Math.floor(Math.random() * descripciones.length)],
                lugar: lugares[Math.floor(Math.random() * lugares.length)],
                valor: valorRand.toString(),
                hora: "25 de Junio, 19:00hrs",
                dueno: rut,
                vendido: "false",
            };

            return newBoleto;
        }

        socket.on('new-bol-user', async function (rut, boletoData) {
            console.log("(SOCKET CALLED) - new-bol-user");

            let canjeado = await Boleto.findOne({ codigo: boletoData.codigo });

            if (canjeado) {
                socket.emit("db-fail", "Este boleto ya fue canjeado");
                return false;
            }

            let boleto = new Boleto(boletoData);

            let boletoSaved = await boleto.save();

            let user = await User.findOne({ rut: rut });
            user.boletos.push(boletoSaved.id);
            await user.save();

            socket.emit("db-fail", "Boleto agregado");
            return false;
        });

        // USUARIOS //////////////////////////////////////////////////////////////////////////////////////////77
        socket.on('gen-bol', async function (rut) {
            console.log("(SOCKET CALLED) - gen-bol");
            let boleto = new Boleto(generarBoleto(rut));

            let boletoSaved = await boleto.save();

            let user = await User.findOne({ rut: rut });
            user.boletos.push(boletoSaved.id);
            await user.save();

            socket.emit('bol-saved');
            
        })

        socket.on('get-bols', async function (rut) {
            console.log("(SOCKET CALLED) - get-bols");
            let boletos = await Boleto.find({ dueno: rut });

            console.log(boletos);

            socket.emit('bols-user', boletos);
        })

        socket.on('get-all-users', async function (rut) {
            console.log("(SOCKET CALLED) - get-all-users");
            let users = await User.find();

            console.log(users);

            socket.emit('all-users', users);
        })

        socket.on('add-post-server', async function (post) {
            console.log("(SOCKET CALLED) - add-post-server");
            let newPost = new Post(post);
            newPost.hora = new Date(newPost.hora);
            await newPost.save();

            console.log(newPost);

            socket.emit('post-added');
        })

        socket.on('get-subasta-data', async function (codigoBoleto, rut) {
            console.log("(SOCKET CALLED) - 'get-subasta-data");
            let subastaFound = await Subasta.findOne({ codigo: rut + ";" + codigoBoleto });
            let boleto = await Boleto.findOne({ codigo: subastaFound.boleto});
            let usuarios = [];

            for (var i=0; i<subastaFound.mensajes.length; i++) {
                let user = await User.findOne({ rut: subastaFound.mensajes[i].transmisor });
                usuarios.push(user);
            }

            console.log(subastaFound);

            socket.emit('update-subasta', subastaFound, boleto, usuarios);
        })

        socket.on('send-msg', async function (msg, codigoB, rutDueno) {
            console.log("(SOCKET CALLED) - 'send-msg");

            let subastaFound = await Subasta.findOne({ codigo: rutDueno + ";" + codigoB });
            subastaFound.mensajes.push(msg);
            await subastaFound.save();

            let usuario = await User.findOne({ rut: msg.transmisor });

            io.sockets.emit('update-msg', msg, usuario);
        })

        socket.on('end-subasta', async function(subastaId, rut, dinero) {
            let subasta = await Subasta.findById(subastaId);
            let boleto = await Boleto.findOne({ codigo: subasta.codigo.split(";")[1] });

            let vendedor = await User.findOne({ rut: subasta.vendedor });
            let newDineroVendedor = parseInt(vendedor.dinero) + parseInt(dinero);
            vendedor.dinero = newDineroVendedor.toString();
            vendedor.boletos.pop();

            console.log("NEW DINERO:", vendedor.dinero);

            let ganador = await User.findOne({ rut: rut });
            let newDinero = parseInt(ganador.dinero) - parseInt(dinero);
            console.log(ganador);
            ganador.dinero = newDinero.toString();
            ganador.boletos.push(boleto._id);
            boleto.dueno = rut;

            await vendedor.save();
            await boleto.save();
            await ganador.save();

            await subasta.remove();

            io.sockets.emit('subasta-finalizada', subastaId);
        })

        socket.on('buy-bol', async function (rutComprador, codigoBoleto) {
            console.log("COMPRANDO BOLETO -->");
            let boleto = await Boleto.findOne({ codigo: codigoBoleto });
            let comprador = await User.findOne({ rut: rutComprador });
            let vendedor = await User.findOne({ rut: boleto.dueno });

            console.log("BOLETO: ", boleto.codigo);
            console.log("VENDEDOR: ", vendedor.rut);
            console.log("COMPRADOR: ", comprador.rut);

            vendedor.boletos.pop();

            comprador.boletos.push(boleto._id);
            boleto.dueno = comprador.rut;
            boleto.vendiendo = "No";

            await boleto.save();
            await comprador.save();
            await vendedor.save();

            socket.emit('bol-comp');

        })

        // AÑADIR USUARIO //
        socket.on('usu-add', async function (newUsuario) {
            console.log("(SOCKET CALLED) - usu-add");

            let exists = await User.findOne({ rut: newUsuario.rut });

            if (exists) {
                if (exists.password != newUsuario.password) {
                    socket.emit('fail-login', "Contraseña incorrecta para ese usuario");
                    return false;
                }
                socket.emit('res-login', "Usuario ya existe");
                return false;
            }

            var pictures = fs.readdirSync('./public/icons/');
            var randomPicture = pictures[Math.floor(Math.random() * pictures.length)];

            var usuario = new User(newUsuario);

            usuario.picture = randomPicture;
            usuario.password = newUsuario.password;//await usuario.encryptPassword(newUsuario.password);

            var usuarioSaved = await usuario.save();

            console.log(usuarioSaved);

            socket.emit('res-login', "Usuario nuevo registrado");
        });
        //**//

        // EDICIÓN USUARIO //
        // BUSCANDO PARA EDITAR
        socket.on('get-user', async function (data) {
            console.log("(SOCKET CALLED) - get-user");
            var usuario = await User.findOne({ rut: data.toString() });

            let subastas = await Subasta.find({});
            let subastasList = [];
            for (var i=0; i<subastas.length; i++) {
                let vendedor = await User.findOne({ rut: subastas[i].vendedor });
                let boleto = await Boleto.findOne({ codigo: subastas[i].boleto });
                subastasList.push({
                    _id: subastas[i]._id,
                    codigo: subastas[i].codigo,
                    vendedor: vendedor,
                    boleto: boleto,
                    mensajes: subastas[i].mensajes,
                });
            }

            let ventas = await Boleto.find({ vendiendo: "Si" });
            let ventasList = [];
            for (var i=0; i<ventas.length; i++) {
                let user = await User.findOne({ rut: ventas[i].dueno });
                ventasList.push({
                    codigo: ventas[i].codigo,
                    descripcion: ventas[i].descripcion,
                    lugar: ventas[i].lugar,
                    valor: ventas[i].valor,
                    hora: ventas[i].hora,
                    dueno: user,
                    vendido: ventas[i].vendido,
                    vendiendo: "Si",
                });
            }


            let posts = await Post.find({});
            let postsList = [];
            for (var i=0; i<posts.length; i++) {
                let transmisor = await User.findOne({ rut: posts[i].transmisor });
                postsList.push({
                    _id: posts[i]._id,
                    descripcion: posts[i].descripcion,
                    transmisor: transmisor,
                    hora: posts[i].hora,
                    likes: posts[i].likes,
                });
            }

            let boletos = await Boleto.find({ dueno: usuario.rut });
            let nBoletos = boletos.length;

            socket.emit('user-data', usuario, subastasList, ventasList, postsList, nBoletos);
        });

        socket.on('like-post', async function (id, sum) {
            let post = await Post.findById(id);
            let newLikes = parseInt(post.likes) + parseInt(sum);
            post.likes = newLikes.toString();
            await post.save();
            return false;
        });

        // EDICIÓN USUARIO
        socket.on('usu-edi', async function (newUsuario) {
            console.log("(SOCKET CALLED) - usu-edi");
            const usuarioFound = await User.findById(newUsuario.id);

            usuarioFound.rut = usuarioFound.rut;
            usuarioFound.name = usuarioFound.name;
            usuarioFound.rol1 = usuarioFound.rol1;
            usuarioFound.rol2 = usuarioFound.rol2;

            let usuarioEdited = usuarioFound.save();

            console.log(usuarioEdited);

            io.sockets.emit('usu-edited', usuarioEdited);
        });
        //**//

        // ELIMINACIÓN USUARIO
        socket.on('usu-del', async function (id) {
            console.log("(SOCKET CALLED) - usu-del");

            const usuarioDeleted = await User.findByIdAndDelete(id);

            console.log(usuarioDeleted);

            io.sockets.emit('usu-deleted', usuarioDeleted);
        });
        //**//
    });
}