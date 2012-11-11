FQLWorkbench
============

#### A workbench for Facebook's FQL

### Step 1 - Install
```
$ sudo npm install fql-workbench -g
```

### Step 2 - Start the daemon
```
$ fql daemon
```

### Step 3 - Connect (Local/remote)
```
$ fql connect -h/--host [host] -p/--port [port] -i/--id [id] -s/--secret [secret] -u/--uid [uid] (optional) -U/--user (optional)
```

### Step 4 - Play
```
fql> SELECT uid, username, first_name, last_name, name, sex, is_app_user FROM user WHERE uid = :uid;
... 
-
  uid: 543985131
  username: joseph.werle
  first_name: Joseph
  last_name: Werle
  name: 'Joseph Werle'
  sex: male
  is_app_user: false

Query took 0.087 seconds to execute.
fql>
```

### Aliases
The following aliases are available within the query:
```
:id           - App ID
:secret       - App Secret
:accessToken  - The access token generated by the app id and secret
:uid          - The UID supplied by the -u or --uid flag.
:me           - If the -U or --user flag was supplied then the value of this variable is the uid supplied by the -u or --uid flag
```

### Commands
The following commands are available at the command line interface
```
:help <command>     - Displays usage on a given command
:print <string>     - Prints a string to the buffer
:exit               - Exits the session
:describe <table>   - Shows a table definition
```

### Help
Using :help
```
fql> :help
... 
':help <command> - Displays usage on a given command'

fql> :help print
... 
':print <string> - Prints a string to the buffer'

fql> :help describe
... 
':describe <table> - Shows a table definition'

fql> 
```

### Tab Completion 
There is tab completion for the support query syntax. Tables, fields, permissions coming soon.
```
fql> sele
select 
fql> select name fr
from 
fql> select name from user w
where 
fql> select name from user where uid = :uid
... 
-
  name: 'Joseph Werle'

Query took 0.082 seconds to execute.
fql> 
```

### Exiting
You can leave the remote session by simply typing 'exit' or calling it as a function 'exit()'
```
Query took 0.081 seconds to execute.
fql> exit
Exiting...
```

### Using commands

``:print`` 
```
fql> :print :uid
... 
'543985131'

fql> :print :id
... 
'459902834061249'

fql> 
```

``:desc | :describe``
```
fql> :describe insights
... 
name: insights
fields:
  object_id: { name: object_id, type: { type: int }, indexable: true, description: 'The object for which you are retrieving metrics.' }
  metric: { name: metric, type: { type: string }, indexable: true, description: 'The usage data to retrieve.' }
  end_time: { name: end_time, type: { type: int }, indexable: true, description: "The end of the period during which the metrics were collected,\nexpressed as a unix time (which should always be midnight, Pacific Daylight Time)\nor using the function end_time_date() which takes a date string in 'YYYY-MM-DD' format.\nNote: If the unix time provided is not midnight, Pacific Daylight Time, your query may return an empty resultset.\nExample: To obtain data for the 24-hour period starting on September 15th at 00:00 (i.e. 12:00 midnight)\nand ending on September 16th at 00:00 (i.e. 12:00 midnight),\nspecify 1284620400 as the end_time and 86400 as the period.\n\nNote: end_time should not be specified when querying lifetime metrics." }
  period: { name: period, type: { type: int }, indexable: true, description: "The length of the period during which the metrics were collected,\nexpressed in seconds as one of 86400 (day), 604800 (week),\n2592000 (month) or 0 (lifetime) or using the function period(),\nwhich takes one of the strings day, week, month or lifetime.\n\nNote: Each metric may not have all periods available." }
  value: { name: value, type: { type: mixed }, indexable: false, description: 'The value of the requested metric.' }
permissions:
  - access_token
  - read_insights


fql>
```


### Examples

Query your own data
```
fql> SELECT name FROM user WHERE uid = :uid
... 
-
  name: 'Joseph Werle'
```

Query data about a Facebook page
```
fql> SELECT name, page_id, username, description, page_url FROM page WHERE username = 'facebook';
... 
-
  name: Facebook
  page_id: 20531316728
  username: facebook
  description: 
  page_url: 'http://www.facebook.com/facebook'

Query took 0.103 seconds to execute.
fql> 
```

Multi Query
```
fql>  #user SELECT uid, username, name, first_name, last_name FROM user WHERE uid = :uid; #profile SELECT uid, username, name FROM #user
... 
-
  name: user
  fql_result_set: [{ uid: 543985131, username: joseph.werle, name: 'Joseph Werle', first_name: Joseph, last_name: Werle }]
-
  name: profile
  fql_result_set: [{ uid: 543985131, username: joseph.werle, name: 'Joseph Werle' }]

Query took 0.08 seconds to execute.
fql>
```

Query app metric data
```
fql> SELECT metric, value FROM insights WHERE object_id = :id AND metric = 'application_active_users' AND end_time=end_time_date('2011-06-26') AND period=period('month')
... 
-
  metric: application_active_users
  value: 434

Query took 0.144 seconds to execute.
fql> 
```

```
fql> SELECT metric, value FROM insights WHERE object_id = :id AND metric = 'application_like_adds' AND end_time=end_time_date('2011-06-26') AND period=period('month')
... 
-
  metric: application_like_adds
  value: 87

Query took 0.125 seconds to execute.
fql> 
```

Copyright and license
---------------------

Copyright 2012

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this work except in compliance with the License.
You may obtain a copy of the License in the LICENSE file, or at:

   http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.

- - -
fql-workbench copyright 2012
joseph.werle@gmail.com