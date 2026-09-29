import os

bind = "0.0.0.0:8000"
workers = int(os.environ.get("GUNICORN_WORKERS", "3"))
accesslog = "-"
errorlog = "-"
access_log_format = '%(h)s "%(r)s" %(s)s %(b)s %(M)sms request_id=%({x-request-id}i)s'
