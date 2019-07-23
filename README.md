# Pet Recognition Trainer

## Use code

Install dependencies
```
npm install
```

Generate SSL key
```
openssl genrsa -out server.key 2048

openssl req -new -x509 -sha256 -key server.key -out server.cer -days 365 -subj /CN={YourIpAddress}
```

Then Run the Server

```
sudo npm start
```

This will start a web server on [`localhost:9966`](http://localhost:443). Try and allow permission to your webcam, and add some examples by holding down the buttons.

Add Pets with the button or edit the array in main.js
