#!/usr/bin/python
# -*- coding: utf-8 -*-
from argparse import ArgumentParser
from tabulate import tabulate
from dateutil.parser import parse
import requests
import os
import time

api_url = ""

def login(username, password):
    auth = {
        'user': username,
        'password': password
    }
    r = requests.post(api_url + '/auth', json=auth)
    if r.status_code == 200:
        return r.json()['token']
    return None

def get_stores(token):
    headers = { "Authorization": "Bearer: %s" % token }
    return requests.get(api_url + '/api/stores', headers=headers)

def create_store(token, title):
    headers = { "Authorization": "Bearer: %s" % token }
    params = {
        'title': title,
    }
    return requests.post(api_url + '/api/stores', headers=headers, json=params)

def delete_store(token, store_id):
    headers = { "Authorization": "Bearer: %s" % token }
    return requests.delete(api_url + '/api/store/%s' % store_id, headers=headers)

def get_store_records(token, store_id):
    headers = { "Authorization": "Bearer: %s" % token }
    return requests.get(api_url + '/api/store/%s/records' % store_id, headers=headers)

def create_record(token, store_id, title):
    headers = { "Authorization": "Bearer: %s" % token }
    params = {
        'title': title,
    }
    return requests.post(api_url + '/api/store/%s/records' % store_id, headers=headers, json=params)

def delete_record(token, store_id, record_id):
    headers = { "Authorization": "Bearer: %s" % token }
    return requests.delete(api_url + '/api/store/%s/record/%s/' % (store_id, record_id), headers=headers)

def effect(s,c,close=True):
    if os.getenv('c', '1') == 0:
        return s
    else:
        return "\033[%dm%s%s" % ( c, s, "\33[0m" if close else "" )

def red(s,close=True):
    return effect( s, 31, close )

def green(s,close=True):
    return effect( s, 32, close )

def yellow(s,close=True):
    return effect( s, 33, close )

def blue(s,close=True):
    return effect( s, 34, close )

def gray(s,close=True):
    return effect( s, 90, close )

def bold(s,close=True):
    return effect( s, 1, close )

def dim(s,close=True):
    return effect( s, 2, close )

parser = ArgumentParser()
parser.add_argument("--schema", "-S", dest="schema", default="http", help="Vault schema.")
parser.add_argument("--port", dest="port", default=8081, help="Vault port.")
parser.add_argument("--hostname", "-H", dest="hostname", default="localhost", help="Vault hostname.")
parser.add_argument("--username", "-U", dest="username", default="vault", help="Vault username.")
parser.add_argument("--password", "-P", dest="password", default="vault", help="Vault password.")

parser.add_argument("--create-store", dest="create_store", action="store_true", default=False, help="Create a store, requires --store-title.")
parser.add_argument("--delete-store", dest="delete_store", action="store_true", default=False, help="Delete a store, requires --store-id.")
parser.add_argument("--store-title",  dest="store_title", default=None, help="Store title.")
parser.add_argument("--store-name",  dest="store_name", default=None, help="Store name.")
parser.add_argument("--store-id",     dest="store_id", default=None, help="Store id.")


parser.add_argument("--create-record", dest="create_record", action="store_true", default=False, help="Create a record, requires --store-id/--store-name and --record-title.")
parser.add_argument("--delete-record", dest="delete_record", action="store_true", default=False, help="Delete a record, requires --record-id.")
parser.add_argument("--record-title",  dest="record_title", default=None, help="Record title.")
parser.add_argument("--record-name",  dest="record_name", default=None, help="Record name.")
parser.add_argument("--record-id",     dest="record_id", default=None, help="Record id.")
args = parser.parse_args()

api_url = "%s://%s:%d" % ( args.schema, args.hostname, int(args.port) )

print "@ Logging to %s ..." % api_url

token = login( args.username, args.password )
if token is None:
    print "@ Login failed!"
    quit()

if args.create_store:
    print "@ Creating store '%s' ..." % args.store_title
    res = create_store(token, args.store_title)
    if res.status_code != 200:
        print "! Error %d: %s" % ( res.status_code, res.content )
    else:
        print res.json()
    quit()

if args.delete_store:
    print "@ Deleting store %s ..." % args.store_id
    res = delete_store(token, args.store_id)
    if res.status_code != 200:
        print "! Error %d: %s" % ( res.status_code, res.content )
    else:
        print res.json()
    quit()

if args.create_record:
    print "@ Creating record '%s' for store '%s' ..." % ( args.record_title, args.store_id )
    res = create_record(token, args.store_id, args.record_title)
    if res.status_code != 200:
        print "! Error %d: %s" % ( res.status_code, res.content )
    else:
        print res.json()
    quit()

if args.delete_record:
    print "@ Deleting record '%s' for store '%s' ..." % ( args.record_id, args.store_id )
    res = delete_record(token, args.store_id, args.record_id)
    if res.status_code != 200:
        print "! Error %d: %s" % ( res.status_code, res.content )
    else:
        print res.json()
    quit()

res = get_stores(token)
if res.status_code != 200:
    print "! Error %d: %s" % ( res.status_code, res.content )
    quit()
else:
    stores = res.json()

print "@ Found %d stores:" % len(stores)

for store in stores:
    print
    print "%s %s" % ( bold(store['Title']), dim( "(id %d)" % store['ID'] ) )
    r = get_store_records( token, str(store['ID']) )
    if r.status_code == 200:
        r = r.json()
        for rec in r:
            print "  %s %s" % ( rec['Title'], dim( "(id %d)" % rec['ID'] ) )
