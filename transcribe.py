import os
import requests
import json

def transcribe(messageId):
    headers = {
        'Authorization': 'Bearer ' + os.getenv('TOKEN', 'E3JM3C4CO5DVDYPNJDWLTTFD5XZ66KMX'),
        'Content-Type': 'audio/wav',
    }
    params = {
        'v': '20230215',
    }
    with open('./static/messages/'+messageId+'.wav', 'rb') as f:
        data = f.read()
    response = requests.post('https://api.wit.ai/dictation', params=params, headers=headers, data=data)
    res = response.text
    bits = res.split("\n{")
    bitsToUse = []
    skipLeading = False
    if(len(bits) == 1):
        skipLeading = True 
    for b in bits:
        if('"is_final": true' in b):
            bitToParse = b
            if not skipLeading:
                bitToParse = "{"+b
            jb = json.loads(bitToParse.strip())
            try:
                print(jb['speech'])
                # and make sure the last token ends in a .
                if not jb['speech']['tokens'][-1]['token'].endswith("."):
                    jb['speech']['tokens'][-1]['token'] = jb['speech']['tokens'][-1]['token']+"."        
                bitsToUse.extend(jb['speech']['tokens'])
            except:
                print("printing error some thing")
    print(bitsToUse)


    outfd = open("./static/messages/"+messageId+".json",'w')
    outfd.write(json.dumps(bitsToUse))
    outfd.close()


import sys
mid = sys.argv[1]
transcribe(mid)