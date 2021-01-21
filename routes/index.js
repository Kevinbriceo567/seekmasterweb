const express = require('express');
const router = express.Router(); 
const nodemailer = require('nodemailer');

router.get('/', (req, res) => {

    res.render('home');

}); 

router.get('/about', (req, res) => {
   
    res.render('about');

});

router.get('/contact', (req, res) => {
   
    res.render('contact');

});

router.get('/service', (req, res) => {
   
    res.render('service');

});

router.get('/plataforms', (req, res) => {
   
    res.render('plataforms');

});

router.post('/send-email', async (req, res) => { 

    const {name, email, subject, message} = req.body;
    
    contentHTML = `

        <h1>Información del usuario</h1>
        <ul>
            <li>Nombre: ${name}</li>
            <li>Email: ${email}</li>
            <li>Asunto: ${subject}</li>
        </ul>
        <p>Mensaje: ${message}</p>
    `;

    const transporter = nodemailer.createTransport({

        host: 'mail.seekmaster.cl',
        port: 587,
        secure: false,
        auth: {

            user: 'contacto@seekmaster.cl',
            pass: 'zX[!6e?XLN{v'
        },

        tls: {
            rejectUnauthorized: false
        }

    });

    const info = await transporter.sendMail({

        from: "'Seekmaster' <contacto@seekmaster.cl>",
        to: 'contacto@seekmaster.cl',
        subject: 'Contacto',
        html: contentHTML
    });

    console.log('mensaje enviado', info.messageId);
    res.send('Correo envíado con éxito');

});

module.exports = router; 