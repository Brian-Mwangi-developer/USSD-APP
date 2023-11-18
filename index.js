
require('dotenv').config();
const db         = require('./config/database');
const express    = require('express');
const UssdMenu   = require('ussd-builder');
const userInfo = require('./model/model')
db.connect()

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended:true }));


let menu = new UssdMenu();

let dataToSave = {}

const atCredentials = {
    apiKey  : process.env.AT_SANDBOX_APIKEY,
    username: process.env.AT_SANDBOX_USERNAME
}

const AfricasTalking = require('africastalking')(atCredentials)

const sms = AfricasTalking.SMS
const payments = AfricasTalking.PAYMENTS

menu.startState({
    run: () =>{
        menu.con('Welcome! Ready to register for the Tujijenge SMS alerts: ' + '\n1. Get Started ' + '\n2. Quit!');
    },
    next:{
        '1': 'register',
        '2': 'quit'
    }
});

menu.state('register', {
    run: () =>{
        menu.con('Before we go ahead, what is your name?')
    },
    next: {
        '*[a-zA-Z]+': 'register.notification'
    }
});

menu.state('register.notification', {
    run: () => {
        let name = menu.val;
        dataToSave.name = name;
        console.log(dataToSave);
        
        menu.con('Please Specify your location to receive Sms Alert: ' 
        +'\n1. Western kenya ' + 
        '\n2. Central Kenya ' + 
        '\n3. Eastern Kenya ' + 
        '\n4. Rift Valley ' + 
        '\n5. Nyanza ' + 
        '\n6. Coast ' + 
        '\n7. Nairobi ' + 
        '\n8. Quit');

    },

    next: {
        // using regex to match user input to net state

        '*\\d+': 'end'
    }
});
menu.state('end',{
    run:async()=>{
        let regionCode = menu.val;

        // Map region code to region name
        const regionMap = {
            '1': 'Western Kenya',
            '2': 'Central Kenya',
            '3': 'Eastern Kenya',
            '4': 'Rift Valley',
            '5': 'Nyanza',
            '6': 'Coast',
            '7': 'Nairobi'
        };

        const selectedRegion = regionMap[regionCode];

        if (selectedRegion) {
            // Save data to the database 
            const phoneNumber = menu.args.phoneNumber;
            const data = new userInfo({
                name: dataToSave.name,
                phoneNumber:menu.args.phoneNumber,
                region: selectedRegion
            });
            console.log(data);
    
            const dataSaved = await data.save();

            const options = {
                to     : menu.args.phoneNumber,
                message: `Hi ${dataToSave.name},You will receive message updates related to crops  in ${selectedRegion}.`
            }
    
            await sms.send(options)
                    .then( response =>{
                        console.log(response)
                    })
                    .catch( error => {
                        console.log(error)
                    })
            // End the USSD session
            menu.end('Thank you! You will receive SMS updates for your selected region.');
        } else {
            // Handle invalid region code
            menu.end('Invalid region code. Please try again.');
        }
    }
})

// menu.state('end', {
//     run: async () =>{
//         let tickets = menu.val;
//         dataToSave.tickets = tickets;
//         console.log(dataToSave);

//         // save data
//         const data = new userInfo({
//             name   : dataToSave.name,
//             phoneNumber:menu.args.phoneNumber,
//             tickets: dataToSave.tickets
//         });

//         const dataSaved = await data.save();

//         const options = {
//             to     : menu.args.phoneNumber,
//             message: `Hi ${dataToSave.name}, we've reserved ${dataToSave.tickets} tickets for you`
//         }

//         await sms.send(options)
//                 .then( response =>{
//                     console.log(response)
//                 })
//                 .catch( error => {
//                     console.log(error)
//                 })

//         menu.end('Awesome! We have you tickets reserved. sending a confrimation text shortly')
//     }
// });

menu.state('quit', {
    run: () =>{
        menu.end("Goodbye")
    }
})

app.post('/ussd', (req, res)=>{
    menu.run(req.body, ussdResult => {
        res.send(ussdResult)
    })
})


port=process.env.PORT || 8000

app.listen(port, async () => console.log('App running on port 8000'));
