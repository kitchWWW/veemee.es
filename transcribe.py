import wave
import contextlib

def getdurr(fname):
    with contextlib.closing(wave.open(fname,'r')) as f:
        frames = f.getnframes()
        rate = f.getframerate()
        duration = frames / float(rate)
        return duration


import os
import requests
import json

def doAndSay(com):
    print(com)
    os.system(com)


replaceDict = [
    ["vimi","Veemee"]
]

def getWitForFile(fullFileName):
    headers = {
        'Authorization': 'Bearer ' + os.getenv('TOKEN', 'YEQRH3CXJ2IBLNIDGEWAAO3D5525VBLH'),
        'Content-Type': 'audio/wav',
    }
    params = {
        'v': '20230215',
    }
    with open(fullFileName, 'rb') as f:
        data = f.read()
        response = requests.post('https://api.wit.ai/dictation', params=params, headers=headers, data=data)
        res = response.text
        bits = res.split("\n{")
        bitsToUse = []
        skipLeading = False
        if(len(bits) == 1):
            skipLeading = True 
        print(bits)
        for b in bits:
            if('"is_final": true' in b):
                bitToParse = b
                if not skipLeading:
                    bitToParse = "{"+b
                jb = json.loads(bitToParse.strip())
                print(jb['speech'])
                # and make sure the last token ends in a .
                for t in jb['speech']['tokens']:
                    for item in replaceDict:
                        if(item[0].lower() in t['token'].lower()):
                            print("FOUND IT!!!!!")
                            print(t['token'])
                            t['token'] = t['token'].lower().replace(item[0],item[1])
                            print(t['token'])
                if not jb['speech']['tokens'][-1]['token'].endswith("."):
                    jb['speech']['tokens'][-1]['token'] = jb['speech']['tokens'][-1]['token']+"."        
                bitsToUse.extend(jb['speech']['tokens'])
        return bitsToUse

chunkdurr = 25

def offsetBits(bits, offset):
    newBits = []
    for b in bits:
        print(b)
        newBits.append({
            'confidence': b['confidence'],
            'token': b['token'],
            'start': b['start']+(offset * 1000),
            'end': b['end']+(offset * 1000)
            })
    return newBits


def transcribe(messageId):
    print("Transcribing for id: "+str(messageId))
    doAndSay('sox ./static/messages/'+messageId+'.wav ./static/messages/'+messageId+'_norm.wav norm rate 44100')
    doAndSay('mv ./static/messages/'+messageId+'_norm.wav ./static/messages/'+messageId+'.wav')
    
    totalDurr = getdurr('./static/messages/'+messageId+'.wav')
    overallBits = []
    for i in range(int(totalDurr / chunkdurr) + 1):
        print(i)
        startPoint = chunkdurr * i
        doAndSay('sox ./static/messages/'+messageId+'.wav ./static/messages/'+messageId+'_'+str(i)+'.wav trim '+str(startPoint)+' '+str(chunkdurr))
        bitsToUse = getWitForFile('./static/messages/'+messageId+'_'+str(i)+'.wav')
        newBits = offsetBits(bitsToUse, startPoint)
        overallBits.extend(newBits)
        print(overallBits)
        doAndSay('rm ./static/messages/'+messageId+'_'+str(i)+'.wav')

    # bitsToUse = getWitForFile('./static/messages/'+messageId+'.wav')
    bitsToUse = overallBits
    print(bitsToUse)
    print("Got full transcript! "+str(messageId))
    outfd = open("./static/messages/"+messageId+".json",'w')
    outfd.write(json.dumps(bitsToUse))
    outfd.close()
    print("Saved full transcript! "+str(messageId))

import sys
mid = sys.argv[1]
transcribe(mid)