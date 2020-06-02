'use strict';

const Hapi = require('@hapi/hapi');
const options = require("./options")

const data_storage = {
    data_stored: null,
    data_received: null
};



const init = async () => {

    const server = Hapi.server({
        port: 3333,
        host: 'localhost'
    });

    // Defining templating
    await server.register(require('@hapi/vision'));

    server.views({
        engines: {
            html: require('handlebars')
        },
        relativeTo: __dirname,
        path: 'templates'
    });


    // defining routes
    server.route([
        {
            method: 'GET',
            path: '/',
            handler: (request, h) => {
                return h.view('index');
            }
        },
        // /t2/queryParaReflectOnResponse?data=98bnsd67234nko
        {
            method: 'GET',
            path: '/t2/queryParaReflectOnResponse',
            handler: (request, h) => {
                const query = request.query || {}                
                return h.view("reflectOnResponse",{data: query.data})
            }
        },
        // /t3/reflectB64encoded?data=78bu23e90nasd98
        {
            method: 'GET',
            path: '/t3/reflectB64encoded',
            handler: (request, h) => {
                const query = request.query || {}                
                return h.view("reflectOnResponse", {data:Buffer.from(query.data).toString('base64')})
            }
        },
        // /t4/reflectHTMLencoded?data=%3Chtml%3E
        {
            method: 'GET',
            path: '/t4/reflectHTMLencoded',
            handler: (request, h) => {
                const query = request.query || {}                
                return h.view("reflectOnResponse", {data:query.data})
            }
        },
        // /t5/reflectB64decoded?data=cXVlcnlQYXJhUmVmbGVjdE9uUmVzcG9uc2VCNjRlbmNvZGVk
        {
            method: 'GET',
            path: '/t5/reflectB64decoded',
            handler: (request, h) => {
                const query = request.query || {}                
                return h.view("reflectOnResponse", {data: Buffer.from(query.data, 'base64').toString('ascii')})
            }
        },
        // /t6/PathParaReflectOnResponse/kjbusd87gqw872d
        {
            method: 'GET',
            path: '/t6/PathParaReflectOnResponse/{data?}',
            handler: (request, h) => {
                const params = request.params || {}                
                return h.view("reflectOnResponse",{data: params.data})
            }
        },

        // Input reflected on other page/sms/email ( we can assume that this is going to be done through POST/PUT/DELETE/PATCH
        // /t7/inputlocation
        {
            method: 'GET',
            path: '/t7/inputlocation',
            handler: (request, h) => {
                return h.view('storedInputForm', {postLocation:'/t7/inputlocation'});
            }
        },
        {
            method: 'POST',
            path: '/t7/inputlocation',
            handler: (request, h) => {
                const data = request.payload.data;
                data_storage.t7DataReceived = data;
                return h.view('Sucessfullystored', {sinkLocation: '/t7/sinklocation'})
            }
        },
        {
            method: 'GET',
            path: '/t7/sinklocation',
            handler: (request, h) => {
                return h.view("sinkLocation",{data: data_storage.t7DataReceived})
            }
        },


        //input reflection on the response but requires requests before input
        // /t8/inputlocation
        {
            method: 'GET',
            path: '/t8/inputlocation',
            handler: (request, h) => {
                return h.view('storedInputForm', {postLocation:'/t8/inputlocation'});
            }
        },
        {
            method: 'POST',
            path: '/t8/inputlocation',
            handler: (request, h) => {
                const data = request.payload.data;
                data_storage.t8DataReceived = data;
                return h.view('confirmstorage', {confirmPath: '/t8/confirmStorage'})
            }
        },
        {
            method: 'POST',
            path: '/t8/confirmStorage',
            handler: (request, h) => {
                data_storage.t8data_stored = data_storage.t8DataReceived;
                return h.view('Sucessfullystored', {sinkLocation: '/t8/sinklocation'})
            }
        },
        {
            method: 'GET',
            path: '/t8/sinklocation',
            handler: (request, h) => {
                return h.view("sinkLocation",{data: data_storage.t8data_stored})
            }
        },

        //input reflection on the response but requires requests before input
        // /t9/activateinputlocation
        {
            method: 'GET',
            path: '/t9/activateinputlocation',
            handler: (request, h) => {
                data_storage.t9inputlocationActivated = true;
                return h.view('activateinputlocation', {inputLocation:'/t9/inputlocation'});
            }
        },
        {
            method: 'GET',
            path: '/t9/inputlocation',
            handler: (request, h) => {
                if (!data_storage.t9inputlocationActivated) {
                    return h.view('error', {error:'you need to activate input location first'});
                }
                return h.view('storedInputForm', {postLocation:'/t9/inputlocation'});
            }
        },
        {
            method: 'POST',
            path: '/t9/inputlocation',
            handler: (request, h) => {
                if (!data_storage.t9inputlocationActivated) {
                    throw new  Error();
                }
                const data = request.payload.data;
                data_storage.t9DataReceived = data;
                return h.view('Sucessfullystored', {sinkLocation: '/t9/sinklocation'})
            }
        },
        {
            method: 'GET',
            path: '/t9/sinklocation',
            handler: (request, h) => {
                data_storage.t9inputlocationActivated = false;
                return h.view("sinkLocation",{data: data_storage.t9DataReceived})
            }
        }

        /*input reflection on email
        // /t10/sendEmail
        {
            method: 'GET',
            path: '/t10/sendEmail',
            handler: (request, h) => {
                return h.view('sendEmail', {postLocation:'/t10/sendEmail'});
            }
        },
        {
            method: 'POST',
            path: '/t10/inputlocation',
            handler: (request, h) => {
                const data = request.payload.data;
                data_storage.t7DataReceived = data;
                return h.view('sendEmail')
            }
        }
        */

    ]);




    await server.start();
    console.log('The server has started')
}


process.on('unhandledRejection',(err) => {
    console.log(err);
    process.exit();
})


init();