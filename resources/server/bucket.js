const fs = require('fs')

class Bucket{
    constructor(filename, bucket){
        this.filename = filename
        this.bucket = bucket

        console.log(`created bucket ${this.filename}`)
    }

    put(json){        
        let content = JSON.stringify(json, null, 2)        
        fs.writeFile(this.filename, content, err => {            
            if(err){
                console.log(`could not write bucket ${this.filename} to disk`)
            }else this.bucket.upload(this.filename, {destination: this.filename}, (err, _, apiResponse) => {
                if(err){
                    console.log(`error putting bucket ${this.filename}`, err)
                }else{
                    console.log(`put bucket ${this.filename} content size ${content.length} ok`)
                }
            })    
        })
    }

    get(){
        return new Promise((resolve, reject) => {
            if(!this.bucket) reject(`no bucket for ${this.filename}`)

            this.bucket.file(this.filename).download((err, contents)=>{
                if(err){
                    reject(`error getting bucket ${this.filename}`)
                }else{
                    try{
                        let content = contents.toString()
                        let json = JSON.parse(content)

                        resolve(json)
                    }catch(err){
                        reject(`error parsing bucket ${this.filename}`)
                    }
                }            
            })
        })
    }
}

module.exports = {
    Bucket: Bucket
}
