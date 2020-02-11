const escapeHtml = require('escape-html');
const admin = require("firebase-admin");
const COLLECTION_NAME = 'mazzatech';

const serviceAccount = require("./teste-cloud-functions-266613-firebase-adminsdk-p7pin-b391e86508.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://teste-cloud-functions-266613.firebaseio.com"
});

const firestore = admin.firestore();

const validEvents = ['entrada', 'saida', 'saida-almoco', 'entrada-almoco'];

exports.helloHttp = (req, res) => {
	if(req.method !== 'POST'){
		res.status(405).send('num pode esse método');
	}

	if(validEvents.find(element => element === req.body.event) === undefined){
		res.status(400).send('Num pode esse evento');
	}

	try{
		const today = getDate();
		const thisMonth = today.substring(0, 7);

		let data = {};
		data[req.body.event] = req.body.time;

		firestore.collection(COLLECTION_NAME)
			.doc('banco_horas')
			.collection(thisMonth)
			.doc(today)
			.set(data, { merge: true })
			.then( () => {
				res.send('Adicionado com sucesso');
			}).catch(err => {
				res.status(500).send(err);
			});
	}
	catch(error){
		res.status(500).send('Um erro inesperado aconteceu: ' + error).end();
	}
};


const getDate = () => {
	Date.prototype.yyyymmdd = function() {
		var mm = this.getMonth() + 1; // getMonth() is zero-based
		var dd = this.getDate();

		return [this.getFullYear()+"-",
			(mm>9 ? '' : '0') + mm+'-',
			(dd>9 ? '' : '0') + dd
		].join('');
	};

	var date = new Date();
	return date.yyyymmdd();
};