#!/usr/bin/env node
/*
 * FQL-Workbench
 * Copyright 2012 Joseph Werle (joseph.werle@gmail.com)
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *         http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
  ./bin/cli.js connect -h localhost -i 459902834061249 -s 6869526eeba8fe539fe8cc4f7c5bdc64
 */

var parseopts   = require('../deps/parseopts')
  , args        = process.argv.slice(1)
  , Bench       = require('../index').Bench
  , opts
  , cmds
  , parser
  , bench
  , preventSync = false


var cli = {}

opts = [
    {full: 'debug', abbr: 'd'}
  , {full: 'id', abbr: 'i', args: true}
  , {full: 'secret', abbr: 's', args: true}
  , {full: 'host', abbr: 'h', args: true}
  , {full: 'uid', abbr: 'u', args: true}
  , {full: 'port', abbr: 'p', args: true}
  , {full: 'user', abbr: 'U'}
  , {full: 'version', abbr: 'v'}
  , {full: 'prevent-sync', abbr: 'ps'}
];

parser = new parseopts.Parser(opts);
parser.parse(args);
cmds = parser.cmds;
opts = parser.opts;

if (opts.version) {
  console.log(require('../package').version.green)
  process.exit();
}

switch (cmds[1]) {
  case 'daemon' :
    console.log("Starting FQL Workbench Daemon");
    bench = new Bench(false, false, opts.port);

    bench.createDaemon().initDaemon();
  break;

  case 'connect' :
    console.log("Connecting to daemon..");

    bench = new Bench(opts.id, opts.secret, opts.port, opts.uid);

    if (opts.debug) {
      bench.debug = true;
    }

    if (opts['prevent-sync']) {
      preventSync = true;;
    }

    bench.connect(opts.host, preventSync);

    if (opts.user) {
      bench.session.isUser = true;
    }
  break;

  default:
}