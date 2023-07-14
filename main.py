from flask import Flask
from flask import jsonify
from flask import request
from flask import render_template
# import transcribe 
import random
import string

import os

app = Flask(__name__)

def genID():
    return ''.join(random.choice(string.ascii_uppercase + string.digits) for _ in range(20))


@app.route("/", methods=['POST', 'GET'])
def index():
    return render_template("index.html")

@app.route("/upload", methods=['POST'])
def uploadAudio():
    f = request.files['audio_data']
    messageid = genID()
    with open('./static/messages/'+messageid+'.wav', 'wb') as audio:
        f.save(audio)
    # transcribe.async_transcribe(messageid)
    os.system("python transcribe.py "+messageid+" &")
    print('file uploaded successfully')
    return jsonify({'messageid':messageid})

@app.route("/view", methods=['GET'])
def view():
    return render_template("view.html")

if __name__ == "__main__":
    app.run(debug=True)