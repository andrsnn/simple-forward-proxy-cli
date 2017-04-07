#!/usr/bin/env node

var argv = require('yargs').argv;
var url = require('url');
var fs = require('fs');
var pem = require('pem');
var httpProxy = require('http-proxy');
var async = require('async');

var options = {};
var tasks = [];

var target = argv.target;
var host = argv.host;

async.waterfall([
    function verifyTarget(callback) {
        if (!target) {
            return callback(new Error('--target option in form of url must be provided.  e.g. http://localhost:8008'));
        }
        return callback(null);
    },
    function verifyHost(callback) {
        if (!argv.host) {
            console.log('Defaulting host to http://localhost:8080');
            host = {
                hostname: 'localhost',
                port: '8080'
            };
            return callback(null);
        }

        host = url.parse(host);

        if (!host.hostname ||
            !host.port) {
            throw new Error('--host option in form of url must be provided.  e.g. http://localhost:8008')
        }
        return callback(null);
    },
    function generateSSLCertificate(callback) {
        if (!argv.ssl) {
            return callback(null);
        }
        pem.createCertificate({days:1, selfSigned:true}, function(err, keys){
          if (err) {
            return callback(err);
          }

          options.ssl = {
            key: keys.serviceKey,
            cert: keys.certificate
          };

          return callback(null);
        });
    },
    function copyAdditionalArguments(callback) {
        for (var key in argv) {
          if (key === '_' || key === '$0' || key === 'ssl') {
            continue;
          }
          options[key] = argv[key];
        }
        return callback(null);
    },
    function startReverseProxyServer(callback) {
        console.log('Starting proxy server...');
        var proxy = httpProxy.createServer(options).listen(host.port, host.hostname);

        return callback(null, proxy);
    }
],
function (err, proxy) {
    if (err) {
        throw new Error(err);
    }

    console.log('Forwarding requests at ' + host.hostname + ':' + host.port + ' to target ' + options.target);
});
