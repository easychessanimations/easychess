const path = require('path')
const { fromchunks } = require('./firebase')

let sacckeypath = path.join(__dirname, "../..", "firebase/sacckey.json")

fromchunks(sacckeypath)

admin = require("firebase-admin")

firebase = admin.initializeApp({
    credential: admin.credential.cert(sacckeypath),
    storageBucket: "pgneditor-1ab96.appspot.com",
    databaseURL: "https://pgneditor-1ab96.firebaseio.com/"
})

bucket = admin.storage().bucket()

for(let engineName of ["zurimain_upload", "zurimain_upload.exe"]){
    console.log("uploading", engineName)
    bucket.upload(path.join(__dirname, "../server/bin/" + engineName), {destination: engineName}, (err, _, apiResponse)=>{
        console.log(err ? "engine upload failed for " + engineName : `engine upload ok for ${engineName}, uploaded, size ${apiResponse.size}`)
    })    
}
