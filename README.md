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
$ fql connect --host [host] --id [id] --secret [secret] --uid [uid]
```

### Step 4 - Play
```
fql> select uid, username, first_name, last_name, name, sex, is_app_user from user where uid = :uid;
... 
-
  uid: 543985131
  username: joseph.werle
  first_name: Joseph
  last_name: Werle
  name: 'Joseph Werle'
  sex: male
  is_app_user: false

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