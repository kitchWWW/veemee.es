import boto
import boto.s3
import sys
from boto.s3.key import Key
from decouple import config
import sys


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

def uploadMessage(fullfilepath, resfilename):
    wavfile = fullfilepath
    k = Key(bucket)
    k.key = resfilename
    k.set_contents_from_filename(wavfile,
        cb=percent_cb, num_cb=10)
    print("all uploaded for "+str(resfilename))

uploadMessage(sys.argv[1], sys.argv[2])