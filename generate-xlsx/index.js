const ExcelJS = require('exceljs');
const fs = require('fs');
const nodemailer = require('nodemailer');
const moment = require('moment');
const admin = require("firebase-admin");
const serviceAccount = require("./teste-cloud-functions-266613-firebase-adminsdk-p7pin-b391e86508.json");
const filename = 'assets/planilha.xlsx';
const COLLECTION_NAME = 'mazzatech';

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://teste-cloud-functions-266613.firebaseio.com"
});

const firestore = admin.firestore();

exports.generateXls = (req, res) => {
    console.log('console log iniciando');
    let workbook = new ExcelJS.Workbook();

    let fileData = fs.readFileSync(filename);

    workbook.xlsx.load(fileData)
        .then(() => {
            workbook.eachSheet((worksheet) => {
                let firstDate = req.body.month ? req.body.month : moment().startOf('month').format('YYYY-MM-DD');

                let events = getEventsByMonth(firstDate.substring(0, 7));
                res.send('testado'); return true;

                worksheet.getCell('E6').value = new Date(firstDate);

                let i = 15;
                let counter = 1;
                let iterableDate = moment(firstDate);
                while(i <= 45){
                    let value = { formula: 'E6' };
                    if(i > 15) {
                        value = {
                            formula: 'B15+'+ counter
                        };

                        counter++;
                    }

                    worksheet.getCell('B' + i).value = value;

                    let weekDay = iterableDate.weekday();
                    if(weekDay > 0 && weekDay < 6){
                        worksheet.getCell('D' + i).value = '09:00';
                        worksheet.getCell('E' + i).value = '12:00';
                        worksheet.getCell('F' + i).value = '13:00';
                        worksheet.getCell('G' + i).value = '18:00';
                    }

                    iterableDate = iterableDate.add(1 ,'day');

                    i++;
                }

                workbook.xlsx.writeBuffer().then((buffer) => {
                    console.log('enviando buffer');

                    sendEmail(buffer);

                    res.send('ok');
                });
            });
        });
};

getEventsByMonth = (selectedMonth) => {
     firestore.collection(COLLECTION_NAME)
        .doc('banco_horas')
        .collection(selectedMonth).get().then(doc => {
            if (!doc.exists) {
                console.log('No such document!');
            } else {
                console.log('Document data:', doc.data());
                return doc.data();
            }
        }).catch(() => {
            return false;
        });
};

sendEmail = (fileBuffer) => {
    console.log('iniciando envio via email');
    let transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: process.env.NODEMAILER_EMAIL,
            pass: process.env.NODEMAILER_PASS
        }
    });

    let message = {
        from: 'maxwillian63@gmail.com',
        to: 'max.maluf.mazzatech@estadao.com',
        subject: 'Planilha de hrs',
        text: 'PLanilha enviada pelo sistema',
        attachments: [
            {
                filename: 'planilha.xlsx',
                content: fileBuffer
            },
        ]
    }

    transporter.sendMail(message, function(error, info){
        if (error) {
            console.log('erro ocorreu ao enviar email', error);
        } else {
            console.log('Email sent: ' + info.response);
        }
    });
};
