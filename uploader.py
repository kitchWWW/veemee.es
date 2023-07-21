import boto
import boto.s3
import sys
from boto.s3.key import Key
from decouple import config


AWS_ACCESS_KEY_ID  = config('AWS_ACCESS_KEY_ID')
AWS_SECRET_ACCESS_KEY =  config('AWS_SECRET_ACCESS_KEY')

bucket_name = 'veemeees-dump'
conn = boto.connect_s3(AWS_ACCESS_KEY_ID,
        AWS_SECRET_ACCESS_KEY)

bucket = conn.create_bucket(bucket_name,
    location=boto.s3.connection.Location.DEFAULT)

def percent_cb(complete, total):
    sys.stdout.write('.')
    sys.stdout.flush()


def uploadMessage(messageId):
    wavfile = './static/messages/'+messageId+'.wav'
    k = Key(bucket)
    k.key = messageId+'.wav'
    k.set_contents_from_filename(wavfile,
        cb=percent_cb, num_cb=10)

    transcript = './static/messages/'+messageId+'.json'
    k2 = Key(bucket)
    k2.key = messageId+'.json'
    k2.set_contents_from_filename(transcript,
        cb=percent_cb, num_cb=10)
    print("all uploaded for "+str(messageId))

import sys
mid = sys.argv[1]
uploadMessage(mid)