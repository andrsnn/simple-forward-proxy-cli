#!/usr/bin/env node

var argv = require('yargs').argv;
var fs = require('fs');
var pem = require('pem');
var httpProxy = require('http-proxy');
var async = require('async');

var options = {};
var tasks = [];

async.waterfall([
    function verifyTarget(callback) {
        if (!argv.target) {
            return callback(new Error('--target option in form of url must be provided.'));
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
        var proxy = httpProxy.createServer(options).listen(options.port);

        return callback(null, proxy);
    }
],
function (err, proxy) {
    if (err) {
        throw new Error(err);
    }

    console.log('Forwarding requests at port ' + options.port + ' to target ' + options.target);
});
